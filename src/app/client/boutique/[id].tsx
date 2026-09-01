import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  FadeInDown, FadeInUp, SlideInDown,
} from 'react-native-reanimated';
import { ArrowLeft, Filter, ArrowUpDown, Check, X, Search, Star, MapPin, Clock, AlertTriangle, WifiOff } from 'lucide-react-native';
import { useClient, mapApiProduitToProduct, type Product } from '@/contexts/client-context';
import { fetchVendeurDetail, fetchProduitsBoutique, resolveMediaUrl, type ApiVendeur } from '@/services/api';
import { ProductCard } from '@/components/client-ui';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { SafeAreaView } from 'react-native-safe-area-context';

const BOUTIQUE_DETAIL_CACHE_PREFIX = '@zando_client_boutique_detail_cache:';
const BOUTIQUE_PRODUCTS_CACHE_PREFIX = '@zando_client_boutique_products_cache:';

type SortMode = 'relevance' | 'price_asc' | 'price_desc' | 'rating';
type PriceBand = 'all' | 'under1000' | '1000to3000' | 'over3000';
type AvailMode = 'all' | 'inStock' | 'outOfStock';
type FraicheurMode = 'all' | 'frais' | 'fume' | 'congele';

// Filtre/tri d'un catalogue (prix, disponibilité, fraîcheur, tri) — porté depuis
// client/category/[category].tsx (route supprimée : sa logique vit désormais uniquement ici,
// scopée aux produits d'UNE boutique, conformément au parcours "boutique d'abord").
function FilterModal({
  visible, onClose, category, setCategory, categories,
  priceBand, setPriceBand, avail, setAvail, fraicheur, setFraicheur, sort, setSort, onApply,
}: {
  visible: boolean;
  onClose: () => void;
  category: string;
  setCategory: (c: string) => void;
  categories: string[];
  priceBand: PriceBand;
  setPriceBand: (p: PriceBand) => void;
  avail: AvailMode;
  setAvail: (a: AvailMode) => void;
  fraicheur: FraicheurMode;
  setFraicheur: (f: FraicheurMode) => void;
  sort: SortMode;
  setSort: (s: SortMode) => void;
  onApply: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const priceBands: { id: PriceBand; label: string }[] = [
    { id: 'all', label: t('catalogFilter.priceAll', 'Tous les prix') },
    { id: 'under1000', label: t('catalogFilter.priceUnder1000', 'Moins de 1 000 FCFA') },
    { id: '1000to3000', label: t('catalogFilter.price1000to3000', '1 000 – 3 000 FCFA') },
    { id: 'over3000', label: t('catalogFilter.priceOver3000', 'Plus de 3 000 FCFA') },
  ];

  const availOptions: { id: AvailMode; label: string }[] = [
    { id: 'all', label: t('catalogFilter.availAll', 'Tous') },
    { id: 'inStock', label: t('catalogFilter.availInStock', 'En stock') },
    { id: 'outOfStock', label: t('catalogFilter.availOutOfStock', 'En rupture') },
  ];

  const fraicheurOptions: { id: FraicheurMode; label: string }[] = [
    { id: 'all', label: t('catalogFilter.fraicheurAll', 'Toutes') },
    { id: 'frais', label: t('catalogFilter.fraicheurFrais', 'Frais') },
    { id: 'fume', label: t('catalogFilter.fraicheurFume', 'Fumé') },
    { id: 'congele', label: t('catalogFilter.fraicheurCongele', 'Congelé') },
  ];

  const sortOptions: { id: SortMode; label: string }[] = [
    { id: 'relevance', label: t('catalogFilter.sortRelevance', 'Pertinence') },
    { id: 'price_asc', label: t('catalogFilter.sortPriceAsc', 'Prix croissant') },
    { id: 'price_desc', label: t('catalogFilter.sortPriceDesc', 'Prix décroissant') },
    { id: 'rating', label: t('catalogFilter.sortRating', 'Meilleures notes') },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Animated.View entering={FadeInDown.duration(200)} style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View entering={SlideInDown.duration(300).springify()} style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('catalogFilter.title', 'Filtrer & trier')}</Text>
            <Pressable onPress={onClose} hitSlop={10}><X color={colors.textTertiary} size={22} /></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {categories.length > 0 && (
              <>
                <Text style={[styles.modalSection, { color: colors.textTertiary }]}>{t('catalogFilter.category', 'CATÉGORIE')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {categories.map((c) => {
                    const selected = category === c;
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setCategory(c)}
                        style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surface }, selected && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
                      >
                        <Text style={[styles.chipText, { color: colors.text }, selected && { color: colors.primary, fontWeight: '800' }]}>{c}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <Text style={[styles.modalSection, { color: colors.textTertiary }]}>{t('catalogFilter.price', 'PRIX')}</Text>
            <View style={styles.modalOptions}>
              {priceBands.map((b) => {
                const selected = priceBand === b.id;
                return (
                  <Pressable key={b.id} onPress={() => setPriceBand(b.id)} style={[styles.optionRow, { borderColor: colors.border }, selected && { borderColor: colors.primary }]}>
                    <Text style={[styles.optionText, { color: colors.text }, selected && { color: colors.primary, fontWeight: '800' }]}>{b.label}</Text>
                    {selected && <Check color={colors.primary} size={18} />}
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.modalSection, { color: colors.textTertiary }]}>{t('catalogFilter.availability', 'DISPONIBILITÉ')}</Text>
            <View style={styles.modalOptions}>
              {availOptions.map((a) => {
                const selected = avail === a.id;
                return (
                  <Pressable key={a.id} onPress={() => setAvail(a.id)} style={[styles.optionRow, { borderColor: colors.border }, selected && { borderColor: colors.primary }]}>
                    <Text style={[styles.optionText, { color: colors.text }, selected && { color: colors.primary, fontWeight: '800' }]}>{a.label}</Text>
                    {selected && <Check color={colors.primary} size={18} />}
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.modalSection, { color: colors.textTertiary }]}>{t('catalogFilter.fraicheur', 'FRAÎCHEUR')}</Text>
            <View style={styles.modalOptions}>
              {fraicheurOptions.map((f) => {
                const selected = fraicheur === f.id;
                return (
                  <Pressable key={f.id} onPress={() => setFraicheur(f.id)} style={[styles.optionRow, { borderColor: colors.border }, selected && { borderColor: colors.primary }]}>
                    <Text style={[styles.optionText, { color: colors.text }, selected && { color: colors.primary, fontWeight: '800' }]}>{f.label}</Text>
                    {selected && <Check color={colors.primary} size={18} />}
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.modalSection, { color: colors.textTertiary }]}>{t('catalogFilter.sortBy', 'TRIER PAR')}</Text>
            <View style={styles.modalOptions}>
              {sortOptions.map((s) => {
                const selected = sort === s.id;
                return (
                  <Pressable key={s.id} onPress={() => setSort(s.id)} style={[styles.optionRow, { borderColor: colors.border }, selected && { borderColor: colors.primary }]}>
                    <Text style={[styles.optionText, { color: colors.text }, selected && { color: colors.primary, fontWeight: '800' }]}>{s.label}</Text>
                    {selected && <Check color={colors.primary} size={18} />}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <Pressable onPress={onApply} style={[styles.applyBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.applyBtnText}>{t('catalogFilter.apply', 'Appliquer les filtres')}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function BoutiqueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToCart } = useClient();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [vendeur, setVendeur] = useState<ApiVendeur | null>(null);
  const [loadingVendeur, setLoadingVendeur] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [offline, setOffline] = useState(false);

  const [category, setCategory] = useState('all');
  const [priceBand, setPriceBand] = useState<PriceBand>('all');
  const [avail, setAvail] = useState<AvailMode>('all');
  const [fraicheur, setFraicheur] = useState<FraicheurMode>('all');
  const [sort, setSort] = useState<SortMode>('relevance');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!id) return;
    const detailCacheKey = BOUTIQUE_DETAIL_CACHE_PREFIX + id;
    const productsCacheKey = BOUTIQUE_PRODUCTS_CACHE_PREFIX + id;

    setLoadingVendeur(true);
    fetchVendeurDetail(id)
      .then((v) => {
        setVendeur(v);
        setOffline(false);
        AsyncStorage.setItem(detailCacheKey, JSON.stringify(v)).catch(() => {});
      })
      .catch(async () => {
        try {
          const raw = await AsyncStorage.getItem(detailCacheKey);
          if (raw) { setVendeur(JSON.parse(raw)); setOffline(true); }
          else setVendeur(null);
        } catch { setVendeur(null); }
      })
      .finally(() => setLoadingVendeur(false));

    setLoadingProducts(true);
    fetchProduitsBoutique(id)
      .then((list) => {
        const mapped = list.map(mapApiProduitToProduct);
        setProducts(mapped);
        AsyncStorage.setItem(productsCacheKey, JSON.stringify(mapped)).catch(() => {});
      })
      .catch(async () => {
        try {
          const raw = await AsyncStorage.getItem(productsCacheKey);
          if (raw) { setProducts(JSON.parse(raw)); setOffline(true); }
          else setProducts([]);
        } catch { setProducts([]); }
      })
      .finally(() => setLoadingProducts(false));
  }, [id]);

  // Catégories produit disponibles DANS cette boutique — remplace le rayon-catégorie global : ici
  // c'est juste un filtre à l'intérieur du menu de la boutique (comme les sections d'un menu Uber Eats).
  const productCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))),
    [products]
  );

  const list = useMemo(() => {
    let result = [...products];
    if (category !== 'all') result = result.filter((p) => p.category === category);
    if (priceBand !== 'all') {
      result = result.filter((p) => {
        if (priceBand === 'under1000') return p.price < 1000;
        if (priceBand === '1000to3000') return p.price >= 1000 && p.price <= 3000;
        return p.price > 3000;
      });
    }
    if (avail === 'inStock') result = result.filter((p) => p.stock !== false);
    if (avail === 'outOfStock') result = result.filter((p) => p.stock === false);
    if (fraicheur !== 'all') result = result.filter((p) => p.fraicheur === fraicheur);
    if (sort === 'price_asc') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') result.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [products, category, priceBand, avail, fraicheur, sort]);

  const hasActiveFilters = category !== 'all' || priceBand !== 'all' || avail !== 'all' || fraicheur !== 'all' || sort !== 'relevance';
  const resetFilters = () => {
    setCategory('all');
    setPriceBand('all');
    setAvail('all');
    setFraicheur('all');
    setSort('relevance');
  };

  const isClosed = vendeur?.statut_boutique === 'fermee';
  const isPaused = vendeur?.statut_boutique === 'pause';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>
          {loadingVendeur ? t('boutique.loading', 'Chargement…') : vendeur?.nom_commerce || t('boutique.notFound', 'Boutique introuvable')}
        </Text>
        <Pressable onPress={() => setModalVisible(true)} hitSlop={8} style={[styles.filterBtn, { backgroundColor: colors.primarySoft }]}>
          <Filter color={colors.primary} size={20} />
        </Pressable>
      </Animated.View>

      {offline && (
        <Animated.View entering={FadeInDown.duration(300)} style={[styles.offlineBanner, { backgroundColor: colors.warning + '1A', borderColor: colors.warning + '40' }]}>
          <WifiOff color={colors.warning} size={15} />
          <Text style={[styles.offlineBannerText, { color: colors.warning }]}>
            {t('home.offlineBanner', 'Hors ligne — affichage des dernières données enregistrées')}
          </Text>
        </Animated.View>
      )}

      {loadingVendeur ? (
        <View style={styles.centerLoader}><ActivityIndicator color={colors.primary} /></View>
      ) : !vendeur ? (
        <View style={styles.emptyWrap}>
          <Search color={colors.textTertiary} size={52} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('boutique.notFound', 'Boutique introuvable')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInUp.duration(350).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardTop}>
              <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
                {vendeur.photo_boutique ? (
                  <Image accessibilityLabel={vendeur.nom_commerce} contentFit="cover" source={{ uri: resolveMediaUrl(vendeur.photo_boutique) }} style={styles.avatarImage} />
                ) : (
                  <Text style={[styles.avatarInitial, { color: colors.primary }]}>{vendeur.nom_commerce?.[0]?.toUpperCase()}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.boutiqueName, { color: colors.text }]}>{vendeur.nom_commerce}</Text>
                <View style={styles.metaRow}>
                  <Star color={colors.gold} size={14} fill={vendeur.note_moyenne > 0 ? colors.gold : 'transparent'} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {vendeur.note_moyenne > 0 ? vendeur.note_moyenne.toFixed(1) : t('boutique.noRating', 'Pas encore noté')}
                  </Text>
                  {vendeur.ville && (
                    <>
                      <Text style={[styles.metaDot, { color: colors.textTertiary }]}>·</Text>
                      <MapPin color={colors.textTertiary} size={13} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>{vendeur.ville}</Text>
                    </>
                  )}
                </View>
                {!!vendeur.horaires_ouverture && (
                  <View style={styles.metaRow}>
                    <Clock color={colors.textTertiary} size={13} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{vendeur.horaires_ouverture}</Text>
                  </View>
                )}
              </View>
            </View>
            {!!vendeur.message_boutique && (
              <Text style={[styles.messageBoutique, { color: colors.textSecondary }]}>{vendeur.message_boutique}</Text>
            )}
          </Animated.View>

          {(isClosed || isPaused) && (
            <Animated.View entering={FadeInUp.duration(350).delay(60).springify()} style={[styles.banner, { backgroundColor: colors.error + '14', borderColor: colors.error + '40' }]}>
              <AlertTriangle color={colors.error} size={18} />
              <Text style={[styles.bannerText, { color: colors.error }]}>
                {isClosed
                  ? t('boutique.closedBanner', 'Cette boutique est fermée pour le moment.')
                  : t('boutique.pausedBanner', 'Cette boutique ne prend pas de nouvelles commandes pour le moment.')}
              </Text>
            </Animated.View>
          )}

          {hasActiveFilters && (
            <Pressable onPress={resetFilters} style={styles.clearFilterRow}>
              <Text style={[styles.clearFilterText, { color: colors.error }]}>{t('catalogFilter.reset', 'Réinitialiser les filtres')}</Text>
            </Pressable>
          )}

          {loadingProducts ? (
            <View style={styles.centerLoader}><ActivityIndicator color={colors.primary} /></View>
          ) : list.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Search color={colors.textTertiary} size={52} strokeWidth={1.5} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('boutique.emptyTitle', 'Aucun produit disponible')}</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                {products.length === 0
                  ? t('boutique.emptyDesc', 'Cette boutique n’a pas encore ajouté de produits.')
                  : t('catalogFilter.emptyDesc', 'Essayez de modifier vos filtres.')}
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {list.map((product) => (
                <View key={product.id} style={styles.cardWrap}>
                  <ProductCard product={product} onAdd={() => addToCart(product.id)} />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <FilterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        category={category}
        setCategory={setCategory}
        categories={productCategories}
        priceBand={priceBand}
        setPriceBand={setPriceBand}
        avail={avail}
        setAvail={setAvail}
        fraicheur={fraicheur}
        setFraicheur={setFraicheur}
        sort={sort}
        setSort={setSort}
        onApply={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, paddingTop: 16, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  filterBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 19, fontWeight: '900' },
  content: { padding: 16, paddingBottom: 30 },
  centerLoader: { paddingVertical: 60, alignItems: 'center' },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14,
    marginHorizontal: 16, marginTop: 14,
  },
  offlineBannerText: { fontSize: 12.5, fontWeight: '700', flex: 1 },

  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
  cardTop: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  avatar: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 22, fontWeight: '900' },
  boutiqueName: { fontSize: 19, fontWeight: '900' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  metaText: { fontSize: 12.5, fontWeight: '600' },
  metaDot: { fontSize: 12 },
  messageBoutique: { fontSize: 13, lineHeight: 19, marginTop: 12 },

  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 12 },
  bannerText: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },

  clearFilterRow: { alignSelf: 'flex-end', marginTop: 14 },
  clearFilterText: { fontSize: 12, fontWeight: '800' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 16 },
  cardWrap: { width: '48%', marginBottom: 8 },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '900' },
  emptySub: { fontSize: 14, textAlign: 'center' },

  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  modalContent: { padding: 20, gap: 6 },
  modalSection: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 14, marginBottom: 8 },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: '600' },
  modalOptions: { gap: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5 },
  optionText: { fontSize: 15 },
  modalFooter: { padding: 20, borderTopWidth: 1 },
  applyBtn: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
