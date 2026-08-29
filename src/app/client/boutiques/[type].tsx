import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Search, Star, MapPin, Store, WifiOff, X } from 'lucide-react-native';
import { fetchVendeurs, resolveMediaUrl, type ApiVendeur } from '@/services/api';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

const BOUTIQUES_BY_TYPE_CACHE_PREFIX = '@zando_client_boutiques_by_type_cache:';

function BoutiqueCard({ vendeur, index }: { vendeur: ApiVendeur; index: number }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <Animated.View entering={FadeInUp.duration(350).delay(index * 50).springify()} style={styles.cardShell}>
      <Pressable
        onPress={() => router.push(`/client/boutique/${vendeur.id}` as any)}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          {vendeur.photo_boutique ? (
            <Image accessibilityLabel={vendeur.nom_commerce} contentFit="cover" source={{ uri: resolveMediaUrl(vendeur.photo_boutique) }} style={styles.avatarImage} />
          ) : (
            <Store color={colors.primary} size={28} />
          )}
        </View>
        <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>{vendeur.nom_commerce}</Text>
        <View style={styles.metaRow}>
          <Star color={colors.gold} size={13} fill={vendeur.note_moyenne > 0 ? colors.gold : 'transparent'} />
          <Text numberOfLines={1} style={[styles.metaText, { color: colors.textSecondary }]}>
            {vendeur.note_moyenne > 0 ? vendeur.note_moyenne.toFixed(1) : t('boutique.noRating', 'Pas encore noté')}
          </Text>
        </View>
        {vendeur.ville && (
          <View style={styles.metaRow}>
            <MapPin color={colors.textTertiary} size={12} />
            <Text numberOfLines={1} style={[styles.metaText, { color: colors.textSecondary }]}>{vendeur.ville}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function BoutiquesByTypeScreen() {
  const { type: rawType } = useLocalSearchParams<{ type: string }>();
  const type = decodeURIComponent(rawType || '');
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [search, setSearch] = useState('');
  const [vendeurs, setVendeurs] = useState<ApiVendeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  // Hors ligne, seule la liste "de base" (sans recherche) de ce type est mise en cache — une
  // recherche saisie pendant qu'on est hors ligne filtre localement cette liste déjà en mémoire
  // plutôt que d'essayer de mettre en cache chaque combinaison possible de recherche.
  const load = useCallback(async (searchTerm: string) => {
    setLoading(true);
    const cacheKey = BOUTIQUES_BY_TYPE_CACHE_PREFIX + type;
    try {
      const list = await fetchVendeurs({ type, search: searchTerm || undefined });
      setVendeurs(list);
      setOffline(false);
      if (!searchTerm) {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(list)).catch(() => {});
      }
    } catch {
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        const cached: ApiVendeur[] = raw ? JSON.parse(raw) : [];
        const filtered = searchTerm
          ? cached.filter((v) => v.nom_commerce?.toLowerCase().includes(searchTerm.toLowerCase()))
          : cached;
        setVendeurs(filtered);
        setOffline(cached.length > 0);
      } catch {
        setVendeurs([]);
      }
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>{type}</Text>
      </Animated.View>

      {offline && (
        <Animated.View entering={FadeInDown.duration(300)} style={[styles.offlineBanner, { backgroundColor: colors.warning + '1A', borderColor: colors.warning + '40' }]}>
          <WifiOff color={colors.warning} size={15} />
          <Text style={[styles.offlineBannerText, { color: colors.warning }]}>
            {t('home.offlineBanner', 'Hors ligne — affichage des dernières données enregistrées')}
          </Text>
        </Animated.View>
      )}

      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search color={colors.textTertiary} size={18} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('boutiques.searchPlaceholder', 'Rechercher une boutique')}
          placeholderTextColor={colors.textTertiary}
          style={[styles.searchInput, { color: colors.text }]}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <X color={colors.textTertiary} size={16} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.centerLoader}><ActivityIndicator color={colors.primary} /></View>
      ) : vendeurs.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Store color={colors.textTertiary} size={52} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('boutiques.emptyTitle', 'Aucune boutique trouvée')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {vendeurs.map((v, index) => (
              <BoutiqueCard key={v.id} vendeur={v} index={index} />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingTop: 16, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 21, fontWeight: '900', textTransform: 'capitalize' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, height: 48,
    borderRadius: 14, borderWidth: 1, marginHorizontal: 20, marginTop: 14, paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600' },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14,
    marginHorizontal: 20, marginTop: 14,
  },
  offlineBannerText: { fontSize: 12.5, fontWeight: '700', flex: 1 },
  centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  cardShell: { width: '48.3%' },
  card: { borderRadius: 18, borderWidth: 1, padding: 14 },
  avatar: { width: '100%', height: 96, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 10 },
  avatarImage: { width: '100%', height: '100%' },
  name: { fontSize: 15, fontWeight: '900' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  metaText: { fontSize: 12, fontWeight: '600' },
  metaDot: { fontSize: 12 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '900' },
});
