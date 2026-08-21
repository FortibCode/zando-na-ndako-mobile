import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, Modal } from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, ZoomIn, SlideInDown,
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { ArrowLeft, Filter, ArrowUpDown, ChevronDown, Check, X } from 'lucide-react-native';
import { useClient } from '@/contexts/client-context';
import { ProductCard } from '@/components/client-ui';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

type SortMode = 'relevance' | 'price_asc' | 'price_desc' | 'rating';
type PriceBand = 'all' | 'under1000' | '1000to3000' | 'over3000';
type AvailMode = 'all' | 'inStock' | 'outOfStock';
type FraicheurMode = 'all' | 'frais' | 'fume' | 'congele';

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
  const { colors, isDark } = useTheme();
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
            {/* Catégorie */}
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

            {/* Prix */}
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

            {/* Disponibilité */}
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

            {/* Fraîcheur */}
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

            {/* Tri */}
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

export default function CategoryProductsScreen() {
  const { category: rawCategory } = useLocalSearchParams<{ category: string }>();
  const { products, categories, addToCart } = useClient();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const title = decodeURIComponent(rawCategory || 'Produits');

  const [category, setCategory] = useState(title === 'Populaires' ? 'all' : title);
  const [priceBand, setPriceBand] = useState<PriceBand>('all');
  const [avail, setAvail] = useState<AvailMode>('all');
  const [fraicheur, setFraicheur] = useState<FraicheurMode>('all');
  const [sort, setSort] = useState<SortMode>('relevance');
  const [modalVisible, setModalVisible] = useState(false);

  const list = useMemo(() => {
    let result = [...products];
    if (title === 'Populaires') {
      result = result.sort((a, b) => b.reviews - a.reviews);
    } else if (category && category !== 'all') {
      result = result.filter((p) => p.category === category);
    }

    // Prix
    if (priceBand !== 'all') {
      result = result.filter((p) => {
        if (priceBand === 'under1000') return p.price < 1000;
        if (priceBand === '1000to3000') return p.price >= 1000 && p.price <= 3000;
        return p.price > 3000;
      });
    }

    // Disponibilité
    if (avail === 'inStock') result = result.filter((p) => p.stock !== false);
    if (avail === 'outOfStock') result = result.filter((p) => p.stock === false);

    // Fraîcheur
    if (fraicheur !== 'all') result = result.filter((p) => p.fraicheur === fraicheur);

    // Tri
    if (sort === 'price_asc') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') result.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);

    return result;
  }, [products, title, category, priceBand, avail, fraicheur, sort]);

  const hasActiveFilters = priceBand !== 'all' || avail !== 'all' || fraicheur !== 'all' || sort !== 'relevance' || (category !== 'all' && category !== title);

  const resetFilters = () => {
    setCategory(title === 'Populaires' ? 'all' : title);
    setPriceBand('all');
    setAvail('all');
    setFraicheur('all');
    setSort('relevance');
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.count, { color: colors.textSecondary }]}>{list.length} {t('catalogFilter.productsCount', 'produit(s)')}</Text>
        </View>
        <Pressable onPress={() => setModalVisible(true)} hitSlop={8} style={[styles.ellipsisBtn, { backgroundColor: colors.primarySoft }]}>
          <Filter color={colors.primary} size={20} />
        </Pressable>
      </Animated.View>

      {/* Filtres actifs */}
      <Animated.View
        entering={FadeInDown.duration(350).delay(100).springify()}
        style={[styles.filters, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <Pressable onPress={() => setModalVisible(true)} style={[styles.filter, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Filter color={colors.primary} size={16} />
          <Text style={[styles.filterText, { color: colors.primary }]}>{t('catalogFilter.filter', 'Filtrer')}</Text>
        </Pressable>
        <Pressable onPress={() => setModalVisible(true)} style={[styles.filter, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <ArrowUpDown color={colors.primary} size={16} />
          <Text style={[styles.filterText, { color: colors.primary }]}>{t('catalogFilter.sort', 'Trier')}</Text>
        </Pressable>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={[styles.filter, styles.filterActive, { backgroundColor: colors.primary, borderColor: colors.primary }]}
        >
          <Text style={[styles.filterText, styles.filterTextActive]}>{t('catalogFilter.availability', 'DISPONIBILITÉ')}</Text>
        </Pressable>
        {hasActiveFilters && (
          <Pressable onPress={resetFilters} style={styles.clearFilter}>
            <Text style={[styles.clearFilterText, { color: colors.error }]}>{t('catalogFilter.reset', 'Réinitialiser')}</Text>
          </Pressable>
        )}
      </Animated.View>

      {/* Produits */}
      {list.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('catalogFilter.emptyTitle', 'Aucun produit trouvé')}</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{t('catalogFilter.emptyDesc', 'Essayez de modifier vos filtres.')}</Text>
          <Pressable onPress={resetFilters} style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.emptyBtnText}>{t('catalogFilter.resetFilters', 'Réinitialiser les filtres')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {list.map((product) => (
            <View key={product.id} style={styles.cardWrap}>
              <ProductCard
                product={product}
                onAdd={() => addToCart(product.id)}
              />
            </View>
          ))}
        </ScrollView>
      )}

      <FilterModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        category={category}
        setCategory={setCategory}
        categories={categories}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ellipsisBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 25, fontWeight: '800' },
  count: { fontSize: 15, marginTop: 3 },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  filter: {
    height: 44,
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  filterActive: {},
  filterText: { fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#FFF', fontWeight: '800' },
  clearFilter: { paddingHorizontal: 4 },
  clearFilterText: { fontSize: 12, fontWeight: '800' },
  list: {
    padding: 16,
    paddingTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardWrap: {
    width: '48%',
    marginBottom: 8,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 10,
  },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '900' },
  emptySub: { fontSize: 14, textAlign: 'center' },
  emptyBtn: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  // Modal
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  modalContent: { padding: 20, gap: 6 },
  modalSection: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 14, marginBottom: 8 },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  modalOptions: { gap: 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionText: { fontSize: 15 },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  applyBtn: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
