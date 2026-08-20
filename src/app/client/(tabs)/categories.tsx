import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { ArrowLeft, Search, ChevronRight } from 'lucide-react-native';
import { useClient } from '@/contexts/client-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { Palette, Spacing, Radii, Shadows } from '@/design/tokens';

const COLORS = ['#EAF4FF', '#FFF0EA', '#FFF5D9', '#EAF8EF', '#FFF0F4', '#F0ECFF', '#EAF9FA', '#FFF5E8'];
// Les clés doivent correspondre exactement aux catégories réelles créées par CategoriesSeeder (backend).
const CATEGORY_IMAGES: Record<string, string> = {
  'Légumes & Feuilles': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=85',
  'Poissons & Viandes': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=85',
  'Tubercules & Féculents': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=85',
  'Épices & Condiments': 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?auto=format&fit=crop&w=600&q=85',
  'Fruits Frais': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=600&q=85',
  'Céréales & Grains': 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=85',
};

function CategoryCard({ category, index, count }: { category: string; index: number; count: number }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <Animated.View entering={ZoomIn.duration(380).delay(index * 45).springify()} style={styles.cardShell}>
      <Pressable onPress={() => router.push(`/client/category/${category}` as any)} style={[styles.card, { backgroundColor: COLORS[index % COLORS.length], borderColor: colors.border }]}>
        <View style={styles.imageFrame}>
          <Image accessibilityLabel={category} contentFit="cover" source={{ uri: CATEGORY_IMAGES[category] }} style={styles.categoryImage} />
          <View style={styles.imageShade} />
          <View style={styles.numberBadge}><Text style={[styles.numberText, { color: colors.primary }]}>{String(index + 1).padStart(2, '0')}</Text></View>
        </View>
        <View style={styles.cardBottom}>
          <View style={styles.cardCopy}>
            <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>{category}</Text>
            <Text style={[styles.count, { color: colors.textSecondary }]}>{count} {t('categories.productsAvailable', 'produits disponibles')}</Text>
          </View>
          <View style={[styles.arrowCircle, { backgroundColor: colors.surface }]}><ChevronRight color={colors.primary} size={18} strokeWidth={2.5} /></View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CategoriesScreen() {
  const { products, categories } = useClient();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(350).springify()} style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><ArrowLeft color={colors.primary} size={22} /></Pressable>
          <View style={styles.headerCopy}><Text style={[styles.eyebrow, { color: colors.primary }]}>ZANDO NA NDAKO</Text><Text style={[styles.title, { color: colors.text }]}>{t('categories.headerTitle', 'Le marché, par univers')}</Text></View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(380).delay(100).springify()} style={styles.intro}>
          <View style={styles.introCopy}><Text style={styles.introTitle}>{t('categories.intro', 'Qu’est-ce qui vous ferait plaisir aujourd’hui ?')}</Text><Text style={styles.introText}>{t('categories.introSub', 'Des produits frais sélectionnés près de chez vous.')}</Text></View>
          <View style={styles.introIcon}><Text style={styles.introEmoji}>🧺</Text></View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(350).delay(160).springify()}>
          <Pressable onPress={() => router.push('/client/search' as any)} style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search color={colors.textTertiary} size={19} /><Text style={[styles.searchText, { color: colors.textSecondary }]}>{t('categories.searchPlaceholder', 'Rechercher une catégorie')}</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.sectionHeader}><View><Text style={[styles.sectionTitle, { color: colors.text }]}>{t('categories.explore', 'Explorer nos rayons')}</Text><Text style={[styles.sectionSub, { color: colors.textSecondary }]}>{categories.length} {t('categories.universesAvailable', 'univers frais disponibles')}</Text></View><View style={styles.redLine} /></View>

        <View style={styles.grid}>{categories.map((category, index) => (
          <CategoryCard
            key={category}
            category={category}
            index={index}
            count={products.filter((product) => product.category === category).length}
          />
        ))}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: Spacing.sm },
  backButton: { width: 42, height: 42, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.25 },
  title: { fontSize: 25, fontWeight: '900', marginTop: 3 },
  intro: { minHeight: 126, borderRadius: Radii.xl, backgroundColor: Palette.navy, padding: Spacing.xl, marginTop: Spacing.md, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', ...Shadows.elevated },
  introCopy: { flex: 1, paddingRight: Spacing.sm },
  introTitle: { color: '#FFF', fontSize: 21, fontWeight: '900', lineHeight: 26 },
  introText: { color: '#D9E5FF', fontSize: 13, lineHeight: 18, marginTop: Spacing.sm },
  introIcon: { width: 68, height: 68, borderRadius: Radii.xl, backgroundColor: Palette.gold, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
  introEmoji: { fontSize: 35, transform: [{ rotate: '-8deg' }] },
  searchBox: { height: 52, borderRadius: Radii.md, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1 },
  searchText: { fontSize: 14, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 13 },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  sectionSub: { fontSize: 12, marginTop: 4 },
  redLine: { width: 34, height: 5, borderRadius: 3, backgroundColor: Palette.coral, marginRight: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Radii.md },
  cardShell: { width: '48.3%' },
  card: { borderRadius: Radii.lg, padding: Spacing.sm, borderWidth: 1, ...Shadows.soft },
  imageFrame: { height: 132, borderRadius: Radii.md, overflow: 'hidden', backgroundColor: Palette.canvasAlt, position: 'relative' },
  categoryImage: { width: '100%', height: '100%' },
  imageShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4,22,56,.08)' },
  numberBadge: { position: 'absolute', top: 9, left: 9, height: 25, minWidth: 27, borderRadius: 9, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.88)' },
  numberText: { fontSize: 10, fontWeight: '900' },
  cardBottom: { minHeight: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingTop: Spacing.sm, paddingBottom: 2 },
  cardCopy: { flex: 1, paddingRight: 4 },
  name: { fontSize: 15, fontWeight: '900' },
  count: { fontSize: 10.5, marginTop: 4 },
  arrowCircle: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
