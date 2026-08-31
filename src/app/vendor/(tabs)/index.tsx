import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Bell, Wallet, Star, Plus, ClipboardList } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { Palette, Radii } from '@/design/tokens';
import { ThemeToggle, LanguageToggle } from '@/design/components';
import { VendorMenu } from '@/components/vendor-ui';
import { clearAuthToken } from '@/services/api';
import { alert, confirmLogout } from '@/contexts/alert-context';

export default function VendorHomeScreen() {
  const { boutique, vendorFirstName, orders, products, unreadNotificationsCount, stats, documents } = useVendor();
  const boutiquePhotoUrl = documents.find((d) => d.id === 'photo_boutique')?.url;
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const enAttente = orders.filter((o) => o.statut === 'en_attente').length;
  const enPreparation = orders.filter((o) => o.statut === 'preparation').length;
  const produitsDisponibles = products.filter((p) => p.disponible).length;
  const ruptureStock = products.filter((p) => !p.disponible || p.stock === 0).length;
  const revenuJour = stats.revenuJour;

  const fullStars = Math.floor(boutique.note);
  const isOpen = boutique.statut === 'ouverte';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <Animated.View entering={FadeInDown.duration(350).springify()} style={styles.top}>
          <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <VendorMenu />
            <Text style={[styles.greeting, { color: colors.text, flexShrink: 1 }]} numberOfLines={1}>{t('vendorHome.greeting', 'Bonjour')}, {vendorFirstName}</Text>
          </View>

          {/* Largeur naturelle (pas flex:1) : avec 4 éléments ici, un partage strict en tiers avec la
              colonne salutation (nom de longueur variable) écrasait le texte sur un espace trop étroit. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <LanguageToggle />
            <ThemeToggle />
            <View style={[styles.statusPill, { backgroundColor: colors.freshSoft }, !isOpen && { backgroundColor: colors.error + '1A' }]}>
              <Text style={[styles.statusPillText, { color: colors.fresh }, !isOpen && { color: colors.error }]}>
                {isOpen ? t('vendorHome.online', 'En ligne') : boutique.statut === 'pause' ? t('vendorHome.paused', 'En pause') : t('vendorHome.closed', 'Fermée')}
              </Text>
            </View>
            <Pressable onPress={() => router.push('/vendor/notifications' as any)} style={[styles.bellBtn, { backgroundColor: colors.error + '1A' }]}>
              <Bell color={colors.error} size={22} />
              {unreadNotificationsCount > 0 && (
                <View style={[styles.bellBadge, { backgroundColor: colors.error, borderColor: colors.background }]}>
                  <Text style={styles.bellBadgeText}>{unreadNotificationsCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={{ marginLeft: 10 }}>
            <Pressable
              accessibilityLabel="Mon compte"
              onPress={() => alert(
                'Mon compte',
                undefined,
                [
                  { text: 'Voir mon profil', onPress: () => router.push('/vendor/(tabs)/profile' as any) },
                  { text: 'Se déconnecter', style: 'destructive', onPress: () => confirmLogout(() => { clearAuthToken(); router.replace('/auth' as any); }) },
                  { text: 'Annuler', style: 'cancel' },
                ],
              )}
              style={[styles.avatarBtn, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}
            >
              {boutiquePhotoUrl ? (
                <Image source={{ uri: boutiquePhotoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Text style={{ fontSize: 18 }}>{boutique.emoji}</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* Revenu du jour */}
        <Animated.View entering={FadeInUp.duration(400).delay(80).springify()} style={[styles.revenueCard, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={[styles.revenueLabel, { color: colors.primaryMuted }]}>{t('vendorHome.todayRevenue', 'Revenus du jour')}</Text>
            <Text style={styles.revenueValue}>{revenuJour.toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <View style={[styles.revenueIcon, { backgroundColor: colors.surface }]}>
            <Wallet color={colors.primary} size={26} />
          </View>
        </Animated.View>

        {/* Stats grid */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <Animated.View entering={FadeInUp.duration(400).delay(140).springify()} style={[styles.gridCell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>{t('vendorHome.pendingOrders', 'Commandes\nen attente')}</Text>
              <Text style={[styles.gridValue, { color: colors.text }]}>{enAttente}</Text>
            </Animated.View>
            <Animated.View entering={FadeInUp.duration(400).delay(180).springify()} style={[styles.gridCell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>{t('vendorHome.preparing', 'En préparation')}</Text>
              <Text style={[styles.gridValue, { color: colors.text }]}>{enPreparation || '-'}</Text>
            </Animated.View>
          </View>
          <View style={styles.gridRow}>
            <Animated.View entering={FadeInUp.duration(400).delay(220).springify()} style={[styles.gridCell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>{t('vendorHome.availableProducts', 'Produits\ndisponibles')}</Text>
              <Text style={[styles.gridValue, { color: colors.text }]}>{produitsDisponibles}</Text>
            </Animated.View>
            <Animated.View entering={FadeInUp.duration(400).delay(260).springify()} style={[styles.gridCell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>{t('vendorHome.outOfStock', 'Rupture de stock')}</Text>
              <Text style={[styles.gridValue, { color: colors.text }]}>{ruptureStock || '-'}</Text>
            </Animated.View>
          </View>
        </View>

        {/* Note boutique */}
        <Animated.View entering={FadeInUp.duration(400).delay(320).springify()} style={[styles.ratingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.ratingTitle, { color: colors.text }]}>{t('vendorHome.storeRating', 'Note de la boutique')}</Text>
          <View style={styles.ratingRow}>
            <Text style={[styles.ratingValue, { color: colors.text }]}>{boutique.note.toFixed(1).replace('.', ',')}</Text>
            <View style={styles.stars}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  color={colors.gold}
                  fill={i < fullStars ? colors.gold : (i === fullStars && boutique.note % 1 >= 0.5 ? colors.gold : 'none')}
                  size={20}
                />
              ))}
            </View>
          </View>
          <Text style={[styles.ratingSub, { color: colors.textSecondary }]}>({boutique.avisCount} {t('vendorHome.reviewsSuffix', 'avis')})</Text>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInUp.duration(400).delay(380).springify()} style={styles.actionsRow}>
          <Pressable onPress={() => router.push('/vendor/(tabs)/orders' as any)} style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
            <ClipboardList color={colors.white} size={18} />
            <Text style={styles.primaryBtnText}>{t('vendorHome.viewOrders', 'Voir les commandes')}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/vendor/products/add' as any)} style={[styles.outlineBtn, { borderColor: colors.borderStrong, backgroundColor: colors.surface }]}>
            <Plus color={colors.primary} size={18} />
            <Text style={[styles.outlineBtnText, { color: colors.primary }]}>{t('vendorHome.addProduct', 'Ajouter un produit')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 30, gap: 14 },

  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { fontSize: 19, fontWeight: '900', flex: 1 },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusPill: { borderRadius: Radii.md, paddingHorizontal: 10, paddingVertical: 6 },
  statusPillText: { fontSize: 12, fontWeight: '800' },
  bellBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  bellBadge: {
    position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  bellBadgeText: { color: Palette.white, fontSize: 9, fontWeight: '900' },

  revenueCard: {
    borderRadius: Radii.lg, padding: 22,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: Palette.orangeBright, shadowOpacity: 0.22, shadowRadius: 14, elevation: 5,
  },
  revenueLabel: { fontSize: 14, fontWeight: '700' },
  revenueValue: { color: Palette.white, fontSize: 28, fontWeight: '900', marginTop: 8 },
  revenueIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  grid: { flexDirection: 'column', gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
  gridCell: {
    flex: 1, borderRadius: Radii.lg, padding: 18,
    borderWidth: 1,
    shadowColor: Palette.navyDeep, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  gridLabel: { fontSize: 13.5, fontWeight: '700', lineHeight: 18 },
  gridValue: { fontSize: 30, fontWeight: '900', marginTop: 10 },

  ratingCard: {
    borderRadius: Radii.lg, padding: 18,
    borderWidth: 1,
    shadowColor: Palette.navyDeep, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  ratingTitle: { fontSize: 14.5, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  ratingValue: { fontSize: 26, fontWeight: '900' },
  stars: { flexDirection: 'row', gap: 2 },
  ratingSub: { fontSize: 12.5, marginTop: 6 },

  actionsRow: { flexDirection: 'row', gap: 12 },
  primaryBtn: {
    flex: 1, height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: Palette.orange, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  primaryBtnText: { color: Palette.white, fontSize: 13.5, fontWeight: '800' },
  outlineBtn: {
    flex: 1, height: 56, borderRadius: 16, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
outlineBtnText: { fontSize: 13.5, fontWeight: '800' },
});

