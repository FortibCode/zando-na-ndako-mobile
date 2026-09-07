import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
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
  Store,
  Tag,
  ChevronRight,
  TrendingDown,
  CheckCircle2,
  ShoppingCart,
  MapPin,
  Star,
} from 'lucide-react-native';
import { useClient, type Product } from '@/contexts/client-context';
import { useDiaspora, formatEur, formatUsd } from '@/contexts/diaspora-context';
import { useTheme } from '@/contexts/theme-context';
import {
  fetchVendeurs,
  searchProduits,
  resolveMediaUrl,
  type ApiVendeur,
  type ApiProduit,
  type ApiVendeurOffre,
} from '@/services/api';
import { alert } from '@/contexts/alert-context';

const RECENT_SEARCHES_KEY = '@zando_recent_searches';
const MAX_RECENT = 5;

// ─── Carte de comparaison multi-boutiques (Résultat Produit) ───
function GroupedProductCard({
  produit,
  index,
  onComparePress,
}: {
  produit: ApiProduit;
  index: number;
  onComparePress: (p: ApiProduit) => void;
}) {
  const { colors } = useTheme();
  const { diasporaModeActive } = useDiaspora();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const offres = produit.offres_vendeurs || [];
  const nombreBoutiques = produit.nombre_boutiques || (offres.length > 0 ? offres.length : 1);
  const prixMin = produit.prix_min ?? (typeof produit.prix_unitaire === 'string' ? parseFloat(produit.prix_unitaire) : produit.prix_unitaire);
  const prixMax = produit.prix_max ?? prixMin;
  const imageUri = resolveMediaUrl(produit.photo_produit);
  const meilleureOffre = offres.length > 0 ? offres[0] : null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(index * 60).springify()}
      style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }, animStyle]}
    >
      <View style={styles.resultCardInner}>
        <Image
          source={{ uri: imageUri }}
          style={[styles.resultImage, { backgroundColor: colors.backgroundAlt }]}
          contentFit="cover"
        />
        <View style={styles.resultInfo}>
          <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>
            {produit.nom_produit}
          </Text>

          {/* Nombre de boutiques disposant de cet article */}
          {nombreBoutiques > 1 ? (
            <View style={[styles.multiStoreBadge, { backgroundColor: colors.primarySoft }]}>
              <Store size={12} color={colors.primary} />
              <Text style={[styles.multiStoreBadgeText, { color: colors.primary }]}>
                Disponible dans {nombreBoutiques} boutiques
              </Text>
            </View>
          ) : (
            <Text numberOfLines={1} style={[styles.resultCategory, { color: colors.textTertiary }]}>
              {meilleureOffre?.nom_commerce || produit.vendeur?.nom_commerce || 'Boutique partenaire'}
            </Text>
          )}

          {/* Prix min - max */}
          <Text style={[styles.resultPrice, { color: colors.primary }]}>
            {prixMin.toLocaleString('fr-FR')}
            {prixMax > prixMin ? ` - ${prixMax.toLocaleString('fr-FR')}` : ''}{' '}
            <Text style={[styles.resultUnit, { color: colors.textSecondary }]}>FCFA</Text>
          </Text>

          {diasporaModeActive && (
            <Text numberOfLines={1} style={[styles.resultUnit, { color: colors.textSecondary }]}>
              {formatEur(prixMin)} · {formatUsd(prixMin)}
            </Text>
          )}

          {/* Meilleur prix mis en avant */}
          {meilleureOffre && nombreBoutiques > 1 && (
            <View style={styles.bestPriceRow}>
              <TrendingDown size={12} color={colors.success} />
              <Text style={[styles.bestPriceText, { color: colors.success }]} numberOfLines={1}>
                Meilleur prix : {meilleureOffre.nom_commerce} ({meilleureOffre.prix_effectif.toLocaleString('fr-FR')} FCFA)
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Bouton Action / Comparateur */}
      <Pressable
        onPress={() => onComparePress(produit)}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[
          styles.compareBtn,
          {
            backgroundColor: nombreBoutiques > 1 ? colors.primary : colors.primarySoft,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.compareBtnText,
            { color: nombreBoutiques > 1 ? '#FFFFFF' : colors.primary },
          ]}
        >
          {nombreBoutiques > 1
            ? `🛒 Comparer les ${nombreBoutiques} boutiques`
            : `🛒 Choisir cette boutique (${prixMin.toLocaleString('fr-FR')} FCFA)`}
        </Text>
        <ChevronRight size={16} color={nombreBoutiques > 1 ? '#FFFFFF' : colors.primary} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Carte résultat "boutique" ───
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
          <Text numberOfLines={1} style={[styles.resultCategory, { color: colors.textTertiary, textTransform: 'capitalize' }]}>
            {vendeur.categorie_principale}{vendeur.ville ? ` · ${vendeur.ville}` : ''}
          </Text>
        </View>
        {vendeur.note_moyenne > 0 && (
          <View style={styles.ratingChip}>
            <Star size={12} color="#EAB308" fill="#EAB308" />
            <Text style={styles.ratingText}>{Number(vendeur.note_moyenne).toFixed(1)}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function SearchScreen() {
  const { q: initialQuery } = useLocalSearchParams<{ q?: string }>();
  const { products, recentProducts, boutiqueTypes, addToCart } = useClient();
  const { diasporaModeActive } = useDiaspora();
  const { colors, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(initialQuery || '');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(!!initialQuery);
  const [boutiqueResults, setBoutiqueResults] = useState<ApiVendeur[]>([]);
  const [groupedProducts, setGroupedProducts] = useState<ApiProduit[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modal de comparaison des prix par boutique pour un produit donné
  const [selectedProductForCompare, setSelectedProductForCompare] = useState<ApiProduit | null>(null);

  // Charger les recherches récentes depuis AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (raw) setRecentSearches(JSON.parse(raw));
      } catch { /* ignore */ }
    })();

    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

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

  // 1. Filtrage local INSTANTANÉ (0 ms de latence pour le client)
  const localGroupedProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const matched = products.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.vendorName || '').toLowerCase().includes(q)
      );
    });

    return matched.map((p): ApiProduit => ({
      id: p.id,
      categorie_id: '',
      vendeur_id: p.vendorId || '',
      nom_produit: p.name,
      description: p.description || null,
      prix_unitaire: p.price,
      unite_mesure: p.unit ? p.unit.replace('FCFA/', '') : 'unité',
      quantite_stock: p.stock ? 10 : 0,
      statut_disponibilite: p.stock ? 'disponible' : 'rupture',
      photo_produit: p.image || null,
      type_fraicheur: p.fraicheur || null,
      vendeur: p.vendorName ? { id: p.vendorId || '', nom_commerce: p.vendorName } : null,
      prix_min: p.price,
      prix_max: p.price,
      nombre_boutiques: 1,
      offres_vendeurs: [
        {
          produit_id: p.id,
          vendeur_id: p.vendorId || '',
          nom_commerce: p.vendorName || 'Boutique partenaire',
          photo_boutique: null,
          note_moyenne: p.rating || 0,
          ville: null,
          prix_unitaire: p.price,
          prix_effectif: p.price,
          est_en_promotion: false,
          quantite_stock: p.stock ? 10 : 0,
          unite_mesure: p.unit ? p.unit.replace('FCFA/', '') : 'unité',
          photo_produit: p.image || null,
        },
      ],
    }));
  }, [products, query]);

  // 2. Recherche serveur indépendante et réactive (enrichissement en arrière-plan)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setBoutiqueResults([]);
      setGroupedProducts([]);
      setIsSearching(false);
      return;
    }
    let cancelled = false;
    setIsSearching(true);

    // Lancement immédiat sans délai bloquant
    searchProduits(q)
      .then((prods) => { if (!cancelled) setGroupedProducts(prods); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsSearching(false); });

    fetchVendeurs({ search: q })
      .then((vends) => { if (!cancelled) setBoutiqueResults(vends); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [query]);

  // Liste finale affichée (produits serveur si disponibles, sinon produits locaux instantanés)
  const displayProducts = groupedProducts.length > 0 ? groupedProducts : localGroupedProducts;

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
    setGroupedProducts([]);
    setBoutiqueResults([]);
    inputRef.current?.focus();
  }, []);

  const handleAddToCartFromOffer = useCallback((produitId: string, nomCommerce: string) => {
    addToCart(produitId);
    alert('Ajouté au panier', `Produit ajouté depuis « ${nomCommerce} ».`);
    setSelectedProductForCompare(null);
  }, [addToCart]);

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
            placeholder="Rechercher un produit, une marque, un marché…"
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
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Tendances du marché</Text>
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
              {boutiqueTypes.slice(0, 6).map((item) => (
                <Pressable
                  key={item.type}
                  onPress={() => router.push(`/client/boutiques/${encodeURIComponent(item.type)}` as any)}
                  style={[styles.categoryChip, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }]}
                >
                  <Text style={[styles.categoryChipText, { color: colors.primary, textTransform: 'capitalize' }]}>{item.type}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      ) : (
        /* Résultats de recherche */
        <ScrollView contentContainerStyle={styles.resultsContent} showsVerticalScrollIndicator={false}>
          {/* Boutiques correspondantes */}
          {boutiqueResults.length > 0 && (
            <Animated.View entering={FadeIn.duration(250)} style={styles.suggestSection}>
              <Text style={[styles.suggestTitle, { color: colors.text }]}>Boutiques vendant cet article</Text>
              <View style={{ gap: 8 }}>
                {boutiqueResults.map((v, index) => (
                  <BoutiqueResultCard key={v.id} vendeur={v} index={index} onPress={() => router.push(`/client/boutique/${v.id}` as any)} />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Métadonnées de résultats */}
          <View style={styles.resultMeta}>
            <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
              {displayProducts.length > 0
                ? `${displayProducts.length} produit${displayProducts.length > 1 ? 's' : ''} trouvé${displayProducts.length > 1 ? 's' : ''} pour "${query}"`
                : boutiqueResults.length === 0 && !isSearching
                ? 'Aucun résultat'
                : ''}
            </Text>
          </View>

          {/* Grille / Liste des produits regroupés avec comparateur de boutiques */}
          {displayProducts.length > 0 && (
            <View style={styles.resultsGrid}>
              {displayProducts.map((produit, index) => (
                <GroupedProductCard
                  key={produit.id}
                  produit={produit}
                  index={index}
                  onComparePress={(p) => setSelectedProductForCompare(p)}
                />
              ))}
            </View>
          )}

          {displayProducts.length === 0 && boutiqueResults.length === 0 && !isSearching && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.noResult}>
              <Search color={colors.textTertiary} size={48} strokeWidth={1.5} />
              <Text style={[styles.noResultTitle, { color: colors.text }]}>Aucun produit trouvé</Text>
              <Text style={[styles.noResultDesc, { color: colors.textSecondary }]}>
                Essayez avec d'autres termes comme "riz", "poisson", "huile" ou "poulet"
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      )}

      {/* ─── Modal Tiroir : Comparatif des Boutiques et des Prix ─── */}
      <Modal
        visible={!!selectedProductForCompare}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedProductForCompare(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedProductForCompare(null)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            {/* Header Modal */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>
                  {selectedProductForCompare?.nom_produit}
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {selectedProductForCompare?.nombre_boutiques || selectedProductForCompare?.offres_vendeurs?.length || 1} boutique(s) dispose(nt) de ce produit
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedProductForCompare(null)}
                style={[styles.closeBtn, { backgroundColor: colors.backgroundAlt }]}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            {/* Liste des offres triées par prix croissant */}
            <ScrollView contentContainerStyle={styles.offersList} showsVerticalScrollIndicator={false}>
              {(selectedProductForCompare?.offres_vendeurs || []).map((offre, index) => {
                const isBestPrice = index === 0;
                const storeAvatar = resolveMediaUrl(offre.photo_boutique);

                return (
                  <View
                    key={offre.produit_id}
                    style={[
                      styles.offerCard,
                      {
                        backgroundColor: isBestPrice ? colors.success + '0F' : colors.backgroundAlt,
                        borderColor: isBestPrice ? colors.success : colors.border,
                      },
                    ]}
                  >
                    {/* Badge Meilleur Prix */}
                    {isBestPrice && (
                      <View style={[styles.bestBadge, { backgroundColor: colors.success }]}>
                        <TrendingDown size={11} color="#FFFFFF" />
                        <Text style={styles.bestBadgeText}>MEILLEUR PRIX</Text>
                      </View>
                    )}

                    <View style={styles.offerRow}>
                      {/* Avatar Boutique */}
                      <View style={[styles.offerAvatar, { backgroundColor: colors.primarySoft }]}>
                        {storeAvatar ? (
                          <Image source={{ uri: storeAvatar }} style={styles.offerAvatarImage} contentFit="cover" />
                        ) : (
                          <Store color={colors.primary} size={22} />
                        )}
                      </View>

                      {/* Info Vendeur & Prix */}
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.offerStoreName, { color: colors.text }]} numberOfLines={1}>
                          {offre.nom_commerce}
                        </Text>
                        <View style={styles.offerMetaRow}>
                          {!!offre.ville && (
                            <View style={styles.metaItem}>
                              <MapPin size={11} color={colors.textTertiary} />
                              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{offre.ville}</Text>
                            </View>
                          )}
                          {offre.note_moyenne > 0 && (
                            <View style={styles.metaItem}>
                              <Star size={11} color="#EAB308" fill="#EAB308" />
                              <Text style={[styles.metaText, { color: colors.text }]}>{Number(offre.note_moyenne).toFixed(1)}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.offerPrice, { color: colors.primary }]}>
                          {offre.prix_effectif.toLocaleString('fr-FR')}{' '}
                          <Text style={[styles.offerPriceUnit, { color: colors.textSecondary }]}>FCFA/{offre.unite_mesure}</Text>
                        </Text>
                      </View>
                    </View>

                    {/* Actions de l'offre */}
                    <View style={styles.offerActions}>
                      <Pressable
                        onPress={() => {
                          setSelectedProductForCompare(null);
                          router.push(`/client/boutique/${offre.vendeur_id}` as any);
                        }}
                        style={[styles.visitBtn, { borderColor: colors.borderStrong }]}
                      >
                        <Store size={14} color={colors.text} />
                        <Text style={[styles.visitBtnText, { color: colors.text }]}>Visiter la boutique</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleAddToCartFromOffer(offre.produit_id, offre.nom_commerce)}
                        style={[styles.buyBtn, { backgroundColor: colors.primary }]}
                      >
                        <ShoppingCart size={14} color="#FFFFFF" />
                        <Text style={styles.buyBtnText}>Acheter ici</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  ratingChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FEF9C3', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  ratingText: { fontSize: 11, fontWeight: '800', color: '#854D0E' },

  suggestSection: { marginBottom: 16 },
  suggestTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  resultMeta: { marginBottom: 12 },
  resultCount: { fontSize: 13, fontWeight: '600' },
  resultsGrid: { gap: 14 },

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
  resultCardInner: { flexDirection: 'row', padding: 12, gap: 12 },
  resultImage: { width: 84, height: 84, borderRadius: 12 },
  resultInfo: { flex: 1, justifyContent: 'center' },
  resultName: { fontSize: 15, fontWeight: '800' },
  resultCategory: { fontSize: 12, marginTop: 2 },
  multiStoreBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  multiStoreBadgeText: { fontSize: 11, fontWeight: '800' },
  resultPrice: { fontSize: 15, fontWeight: '900', marginTop: 6 },
  resultUnit: { fontSize: 11, fontWeight: '600' },
  bestPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  bestPriceText: { fontSize: 11, fontWeight: '700' },

  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  compareBtnText: { fontSize: 12.5, fontWeight: '800' },

  noResult: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  noResultTitle: { fontSize: 18, fontWeight: '900' },
  noResultDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  // Modal Tiroir
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: '900' },
  modalSubtitle: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  offersList: { padding: 18, gap: 14 },
  offerCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
    position: 'relative',
  },
  bestBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  bestBadgeText: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.5 },
  offerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  offerAvatar: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  offerAvatarImage: { width: '100%', height: '100%' },
  offerStoreName: { fontSize: 15, fontWeight: '800' },
  offerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11.5, fontWeight: '600' },
  offerPrice: { fontSize: 16, fontWeight: '900', marginTop: 4 },
  offerPriceUnit: { fontSize: 11, fontWeight: '600' },

  offerActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  visitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
  },
  visitBtnText: { fontSize: 12, fontWeight: '700' },
  buyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
  },
  buyBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});
