import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Search,
  X,
  Clock,
  TrendingUp,
  Package,
} from 'lucide-react-native';
import { useClient, type Product } from '@/contexts/client-context';
import { useDiaspora, formatEur, formatUsd } from '@/contexts/diaspora-context';
import { useTheme } from '@/contexts/theme-context';
import { fetchVendeurs, resolveMediaUrl, type ApiVendeur } from '@/services/api';
import { Store } from 'lucide-react-native';

const RECENT_SEARCHES_KEY = '@zando_recent_searches';
const MAX_RECENT = 5;

// ─── Carte résultat "produit" (secondaire) : ouvre la boutique du produit, jamais d'ajout direct
// au panier depuis un résultat de recherche cross-boutique (voir la fiche boutique pour ça).
function ResultCard({
  product,
  index,
  onPress,
}: {
  product: Product;
  index: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { diasporaModeActive } = useDiaspora();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(index * 50).springify()}
      style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }, animStyle]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={styles.resultCardInner}
      >
        <Image
          source={{ uri: product.image }}
          style={[styles.resultImage, { backgroundColor: colors.backgroundAlt }]}
          contentFit="cover"
        />
        <View style={styles.resultInfo}>
          <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
          {!!product.vendorName && (
            <Text numberOfLines={1} style={[styles.resultCategory, { color: colors.textTertiary }]}>{product.vendorName}</Text>
          )}
          <Text style={[styles.resultPrice, { color: colors.primary }]}>
            {product.price.toLocaleString('fr-FR')} <Text style={[styles.resultUnit, { color: colors.textSecondary }]}>FCFA</Text>
          </Text>
          {diasporaModeActive && (
            <Text numberOfLines={1} style={[styles.resultUnit, { color: colors.textSecondary }]}>
              {formatEur(product.price)} · {formatUsd(product.price)}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Carte résultat "boutique" (résultat principal) ───
function BoutiqueResultCard({ vendeur, index, onPress }: { vendeur: ApiVendeur; index: number; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50).springify()}>
      <Pressable onPress={onPress} style={[styles.boutiqueResultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.boutiqueResultAvatar, { backgroundColor: colors.primarySoft }]}>
          {vendeur.photo_boutique ? (
            <Image source={{ uri: resolveMediaUrl(vendeur.photo_boutique) }} style={styles.boutiqueResultAvatarImage} contentFit="cover" />
          ) : (
            <Store color={colors.primary} size={20} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[styles.resultName, { color: colors.text }]}>{vendeur.nom_commerce}</Text>
          <Text numberOfLines={1} style={[styles.resultCategory, { color: colors.textTertiary, textTransform: 'capitalize' }]}>{vendeur.categorie_principale}{vendeur.ville ? ` · ${vendeur.ville}` : ''}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function SearchScreen() {
  const { q: initialQuery } = useLocalSearchParams<{ q?: string }>();
  const { products, recentProducts, boutiqueTypes } = useClient();
  const { diasporaModeActive } = useDiaspora();
  const { colors, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState(initialQuery || '');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(!!initialQuery);
  const [boutiqueResults, setBoutiqueResults] = useState<ApiVendeur[]>([]);

  // Charger les recherches récentes depuis AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (raw) setRecentSearches(JSON.parse(raw));
      } catch { /* ignore */ }
    })();

    // Focus automatique après 300ms
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  // Si query initiale passée, déclencher la recherche
  useEffect(() => {
    if (initialQuery && initialQuery.trim().length >= 2) {
      setShowResults(true);
    }
  }, [initialQuery]);

  const saveRecentSearch = useCallback(async (term: string) => {
    const trimmed = term.trim().toLowerCase();
    if (!trimmed) return;
    const next = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
    setRecentSearches(next);
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
  }, [recentSearches]);

  const clearRecent = useCallback(async () => {
    setRecentSearches([]);
    try { await AsyncStorage.removeItem(RECENT_SEARCHES_KEY); } catch { /* ignore */ }
  }, []);

  // Filtrer les produits (recherche temps réel)
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return products.filter((p) => {
      const name = p.name.toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const cat = p.category.toLowerCase();
      const orig = (p.origin || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || cat.includes(q) || orig.includes(q);
    });
  }, [products, query]);

  // Boutiques correspondantes — résultat principal du parcours "boutique d'abord" (recherche
  // serveur, contrairement aux produits qui filtrent la liste déjà chargée en local).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setBoutiqueResults([]); return; }
    let cancelled = false;
    const timer = setTimeout(() => {
      fetchVendeurs({ search: q }).then((list) => { if (!cancelled) setBoutiqueResults(list); }).catch(() => { if (!cancelled) setBoutiqueResults([]); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const handleSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setQuery(trimmed);
    setShowResults(true);
  }, [saveRecentSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    setShowResults(false);
    inputRef.current?.focus();
  }, []);

  const showInitialState = !showResults || query.trim().length < 2;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header avec champ de saisie */}
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundAlt }]}>
          <Search color={colors.textTertiary} size={18} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              if (t.trim().length >= 2) setShowResults(true);
              else setShowResults(false);
            }}
            onSubmitEditing={() => {
              if (query.trim()) handleSearch(query);
            }}
            returnKeyType="search"
            placeholder="Rechercher un produit, une catégorie…"
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={8} style={[styles.clearBtn, { backgroundColor: colors.borderStrong }]}>
              <X color={colors.textTertiary} size={16} />
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Contenu */}
      {showInitialState ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Recherches récentes */}
          {recentSearches.length > 0 && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Clock color={colors.textTertiary} size={16} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Récent</Text>
                <Pressable onPress={clearRecent} style={styles.clearRecent}>
                  <Text style={[styles.clearRecentText, { color: colors.textTertiary }]}>Effacer</Text>
                </Pressable>
              </View>
              <View style={styles.recentList}>
                {recentSearches.map((term) => (
                  <Pressable
                    key={term}
                    onPress={() => handleSearch(term)}
                    style={[styles.recentChip, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}
                  >
                    <Clock color={colors.textTertiary} size={13} />
                    <Text style={[styles.recentText, { color: colors.text }]}>{term}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Produits tendances */}
          <Animated.View entering={FadeIn.duration(300).delay(150)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp color={colors.error} size={16} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Tendances</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingList}>
              {(recentProducts.length > 0 ? recentProducts : products.slice(0, 6)).map((product) => (
                <Pressable
                  key={product.id}
                  onPress={() => router.push(`/client/product/${product.id}` as any)}
                  style={[styles.trendingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Image
                    source={{ uri: product.image }}
                    style={[styles.trendingImage, { backgroundColor: colors.backgroundAlt }]}
                    contentFit="cover"
                  />
                  <Text style={[styles.trendingName, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
                  <Text style={[styles.trendingPrice, { color: colors.primary }]}>{product.price.toLocaleString('fr-FR')} FCFA</Text>
                  {diasporaModeActive && (
                    <Text numberOfLines={1} style={[styles.trendingPrice, { color: colors.textSecondary, fontSize: 9.5, fontWeight: '700', marginTop: 1 }]}>
                      {formatEur(product.price)} · {formatUsd(product.price)}
                    </Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Types de boutique */}
          <Animated.View entering={FadeIn.duration(300).delay(250)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Package color={colors.primary} size={16} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Types de boutique</Text>
            </View>
            <View style={styles.categoryGrid}>
              {boutiqueTypes.slice(0, 6).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => router.push(`/client/boutiques/${encodeURIComponent(type)}` as any)}
                  style={[styles.categoryChip, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }]}
                >
                  <Text style={[styles.categoryChipText, { color: colors.primary, textTransform: 'capitalize' }]}>{type}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      ) : (
        /* Résultats de recherche */
        <ScrollView contentContainerStyle={styles.resultsContent} showsVerticalScrollIndicator={false}>
          {/* Boutiques — résultat principal */}
          {boutiqueResults.length > 0 && (
            <Animated.View entering={FadeIn.duration(250)} style={styles.suggestSection}>
              <Text style={[styles.suggestTitle, { color: colors.text }]}>Boutiques</Text>
              <View style={{ gap: 8 }}>
                {boutiqueResults.map((v, index) => (
                  <BoutiqueResultCard key={v.id} vendeur={v} index={index} onPress={() => router.push(`/client/boutique/${v.id}` as any)} />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Compteur de résultats produit */}
          <View style={styles.resultMeta}>
            <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
              {results.length > 0
                ? `${results.length} produit${results.length > 1 ? 's' : ''} pour "${query}"`
                : boutiqueResults.length === 0
                ? 'Aucun résultat'
                : 'Aucun produit correspondant'}
            </Text>
          </View>

          {/* Grille des produits — secondaire, ouvre la boutique du produit */}
          {results.length > 0 && (
            <View style={styles.resultsGrid}>
              {results.map((product, index) => (
                <ResultCard
                  key={product.id}
                  product={product}
                  index={index}
                  onPress={() => router.push(product.vendorId ? `/client/boutique/${product.vendorId}` : `/client/product/${product.id}` as any)}
                />
              ))}
            </View>
          )}

          {results.length === 0 && boutiqueResults.length === 0 && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.noResult}>
              <Search color={colors.textTertiary} size={48} strokeWidth={1.5} />
              <Text style={[styles.noResultTitle, { color: colors.text }]}>Aucun résultat trouvé</Text>
              <Text style={[styles.noResultDesc, { color: colors.textSecondary }]}>
                Essayez avec d'autres termes comme "poisson", "riz" ou "poulet"
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { padding: 18, gap: 24, paddingBottom: 30 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '900', flex: 1 },
  clearRecent: { paddingHorizontal: 4 },
  clearRecentText: { fontSize: 12, fontWeight: '600' },

  recentList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  recentText: { fontSize: 13, fontWeight: '600' },

  trendingList: { gap: 10, paddingRight: 20 },
  trendingCard: {
    width: 120,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
  },
  trendingImage: { width: '100%', height: 80, borderRadius: 12 },
  trendingName: { fontSize: 11.5, fontWeight: '800', marginTop: 6 },
  trendingPrice: { fontSize: 11, fontWeight: '900', marginTop: 3 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 13, fontWeight: '700' },

  resultsContent: { padding: 16, paddingBottom: 30 },
  boutiqueResultCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 12 },
  boutiqueResultAvatar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  boutiqueResultAvatarImage: { width: '100%', height: '100%' },
  suggestSection: { marginBottom: 16 },
  suggestTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  suggestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestChip: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  suggestChipText: { fontSize: 13, fontWeight: '700' },
  resultMeta: { marginBottom: 12 },
  resultCount: { fontSize: 13, fontWeight: '600' },
  resultsGrid: { gap: 10 },
  resultCard: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
  },
  resultCardInner: { flexDirection: 'row', padding: 10, gap: 12 },
  resultImage: { width: 80, height: 80, borderRadius: 12 },
  resultInfo: { flex: 1, justifyContent: 'center' },
  resultName: { fontSize: 15, fontWeight: '800' },
  resultCategory: { fontSize: 11.5, marginTop: 3 },
  resultPrice: { fontSize: 14, fontWeight: '900', marginTop: 4 },
  resultUnit: { fontSize: 10, fontWeight: '500' },
  resultAddBtn: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  resultAddText: { fontSize: 11.5, fontWeight: '800' },

  noResult: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  noResultTitle: { fontSize: 18, fontWeight: '900' },
  noResultDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
});
