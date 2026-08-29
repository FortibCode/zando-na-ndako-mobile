import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { ArrowLeft, Search, ChevronRight, Store, ShoppingBasket } from 'lucide-react-native';
import { useClient, type BoutiqueTypeItem } from '@/contexts/client-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { Palette, Spacing, Radii, Shadows } from '@/design/tokens';

const COLORS = ['#EAF4FF', '#FFF0EA', '#FFF5D9', '#EAF8EF', '#FFF0F4', '#F0ECFF', '#EAF9FA', '#FFF5E8'];

// Carte "type de boutique" (parcours boutique d'abord) : le vrai logo envoyé par l'admin
// (/admin/types-boutique) quand il existe, sinon un emoji dérivé du libellé — jamais une icône
// générique unique pour tous les types (voir BoutiqueTypeItem dans client-context.tsx).
function BoutiqueTypeCard({ item, index }: { item: BoutiqueTypeItem; index: number }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <Animated.View entering={ZoomIn.duration(380).delay(index * 45).springify()} style={styles.cardShell}>
      <Pressable onPress={() => router.push(`/client/boutiques/${encodeURIComponent(item.type)}` as any)} style={[styles.card, { backgroundColor: COLORS[index % COLORS.length], borderColor: colors.border }]}>
        <View style={styles.imageFrame}>
          {item.logoUrl ? (
            <Image source={{ uri: item.logoUrl }} style={styles.logoImage} resizeMode="cover" />
          ) : (
            <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBottom}>
          <View style={styles.cardCopy}>
            <Text numberOfLines={1} style={[styles.name, { color: colors.text, textTransform: 'capitalize' }]}>{item.type}</Text>
            <Text style={[styles.count, { color: colors.textSecondary }]}>{t('categories.seeBoutiques', 'Voir les boutiques')}</Text>
          </View>
          <View style={[styles.arrowCircle, { backgroundColor: colors.surface }]}><ChevronRight color={colors.primary} size={18} strokeWidth={2.5} /></View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CategoriesScreen() {
  const { boutiqueTypes } = useClient();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(350).springify()} style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><ArrowLeft color={colors.primary} size={22} /></Pressable>
          <View style={styles.headerCopy}><Text style={[styles.eyebrow, { color: colors.primary }]}>ZANDO NA NDAKO</Text><Text style={[styles.title, { color: colors.text }]}>{t('categories.headerTitleBoutiques', 'Les boutiques, par type')}</Text></View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(380).delay(100).springify()} style={styles.intro}>
          <View style={styles.introCopy}><Text style={styles.introTitle}>{t('categories.introBoutiques', 'Quelle boutique cherchez-vous aujourd’hui ?')}</Text><Text style={styles.introText}>{t('categories.introSub', 'Des produits frais sélectionnés près de chez vous.')}</Text></View>
          <View style={styles.introIcon}><View style={styles.introIconInner}><ShoppingBasket color="#FFF" size={32} /></View></View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(350).delay(160).springify()}>
          <Pressable onPress={() => router.push('/client/search' as any)} style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search color={colors.textTertiary} size={19} /><Text style={[styles.searchText, { color: colors.textSecondary }]}>{t('categories.searchPlaceholderBoutiques', 'Rechercher une boutique')}</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.sectionHeader}><View><Text style={[styles.sectionTitle, { color: colors.text }]}>{t('categories.exploreBoutiques', 'Explorer par type de boutique')}</Text><Text style={[styles.sectionSub, { color: colors.textSecondary }]}>{boutiqueTypes.length} {t('categories.typesAvailable', 'types disponibles')}</Text></View><View style={styles.redLine} /></View>

        {boutiqueTypes.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Store color={colors.textTertiary} size={48} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('categories.emptyBoutiques', 'Aucune boutique disponible pour le moment.')}</Text>
          </View>
        ) : (
          <View style={styles.grid}>{boutiqueTypes.map((item, index) => (
            <BoutiqueTypeCard key={item.type} item={item} index={index} />
          ))}</View>
        )}
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
  introIconInner: { transform: [{ rotate: '-8deg' }] },
  searchBox: { height: 52, borderRadius: Radii.md, paddingHorizontal: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1 },
  searchText: { fontSize: 14, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 25, marginBottom: 13 },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  sectionSub: { fontSize: 12, marginTop: 4 },
  redLine: { width: 34, height: 5, borderRadius: 3, backgroundColor: Palette.coral, marginRight: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Radii.md },
  cardShell: { width: '48.3%' },
  card: { borderRadius: Radii.lg, padding: Spacing.sm, borderWidth: 1, ...Shadows.soft },
  imageFrame: { height: 132, borderRadius: Radii.md, overflow: 'hidden', backgroundColor: Palette.canvasAlt, alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: '100%', height: '100%' },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 30 },
  cardBottom: { minHeight: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingTop: Spacing.sm, paddingBottom: 2 },
  cardCopy: { flex: 1, paddingRight: 4 },
  name: { fontSize: 15, fontWeight: '900' },
  count: { fontSize: 10.5, marginTop: 4 },
  arrowCircle: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
