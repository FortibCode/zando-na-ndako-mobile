import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable, SafeAreaView, ScrollView, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeInDown, FadeInUp, FadeInLeft, FadeInRight, ZoomIn,
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import {
  Search, Bell, ShoppingCart, MapPin, ChevronDown,
  Tag, Globe2, ChevronRight, ChevronLeft, Scooter, WifiOff,
} from 'lucide-react-native';
import { useClient } from '@/contexts/client-context';
import { ClientMenu, ProductCard, SectionTitle, BLUE } from '@/components/client-ui';
import { useScalePress } from '@/hooks/use-animation';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { Palette, Spacing, Radii, Shadows } from '@/design/tokens';
import { ThemeToggle, LanguageToggle } from '@/design/components';
import { clearAuthToken, resolveMediaUrl, FALLBACK_DELIVERY_FEE } from '@/services/api';
import { alert, confirmLogout } from '@/contexts/alert-context';
import { Store, Star } from 'lucide-react-native';

const CATEGORY_COLORS = ['#EAF4FF', '#FFEDE8', '#FFF6E8', '#E8F9EE', '#FFF0E8', '#F3EEFF'];
const HOME_SECTION_PAGE_SIZE = 5;

// Découpe une page (5 éléments) en colonnes de 2 empilées, pour un carrousel horizontal sur 2
// rangées plutôt qu'une seule ligne — avec une seule ligne, une bonne partie de la page n'est
// jamais visible à l'écran et changer de page ne se voit presque pas.
function chunkPairs<T>(items: T[]): T[][] {
  return Array.from({ length: Math.ceil(items.length / 2) }, (_, i) => items.slice(i * 2, i * 2 + 2));
}

export default function ClientHomeScreen() {
  const { products, promotedProduct, boutiqueTypes, boutiques, addToCart, cartCount, favorites, isFavorite, userFirstName, isDiaspora, refreshUser, zones, selectedAddress, currentUser, catalogOffline } = useClient();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { animatedStyle: promoStyle, onPressIn, onPressOut } = useScalePress(0.98);
  const fish = useMemo(
    () => products.find((product) => product.category === 'Poissons & Viandes') || products[0],
    [products]
  );
  const favProducts = useMemo(
    () => products.filter((p) => isFavorite(p.id)).slice(0, 4),
    [products, favorites]
  );
  const [productsPage, setProductsPage] = useState(1);
  const totalProductsPages = Math.max(1, Math.ceil(products.length / HOME_SECTION_PAGE_SIZE));
  const safeProductsPage = Math.min(productsPage, totalProductsPages);
  const pagedProductColumns = chunkPairs(
    products.slice((safeProductsPage - 1) * HOME_SECTION_PAGE_SIZE, safeProductsPage * HOME_SECTION_PAGE_SIZE)
  );

  // Rafraîchit le profil connecté (détecte correctement le client diaspora)
  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchScale = useSharedValue(1);
  const searchAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: searchScale.value }] }));

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Bar ─────────────────────────────────── */}
<Animated.View entering={FadeInDown.duration(350).springify()} style={styles.top}>
          <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.locationRow, { flexShrink: 1, minWidth: 0 }]}>
              <ClientMenu />
              <Pressable style={styles.location} onPress={() => router.push('/client/checkout/address' as any)}>
                <MapPin color={colors.primary} size={18} />
                <Text numberOfLines={1} style={[styles.city, { color: colors.text }]}>{selectedAddress?.ville || t('homeExtra.city', 'Brazzaville')}</Text>
                <ChevronDown color={colors.textSecondary} size={15} />
              </Pressable>
            </View>
          </View>

          {/* Groupes du milieu et de droite en largeur naturelle (pas flex:1) : avec 4 éléments ici,
              un partage strict en tiers égaux avec la colonne adresse (qui doit accueillir des noms
              de ville de longueur variable) écrasait le texte de la ville sur un espace bien trop
              étroit. */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            <LanguageToggle />
            <ThemeToggle />
            <Pressable
              onPress={() => router.push('/client/notifications' as any)}
              style={[styles.actionBtn, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}
            >
              <Bell color={colors.primary} size={22} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/client/(tabs)/cart' as any)}
              style={[styles.actionBtn, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}
            >
              <ShoppingCart color={colors.primary} size={22} />
              {cartCount > 0 && (
                <View style={[styles.badge, { borderColor: colors.background }]}>
                  <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={{ marginLeft: Spacing.sm }}>
            <Pressable
              accessibilityLabel="Mon compte"
              onPress={() => alert(
                'Mon compte',
                undefined,
                [
                  { text: 'Voir mon profil', onPress: () => router.push('/client/(tabs)/profile' as any) },
                  { text: 'Se déconnecter', style: 'destructive', onPress: () => confirmLogout(() => { clearAuthToken(); router.replace('/auth' as any); }) },
                  { text: 'Annuler', style: 'cancel' },
                ],
              )}
              style={[styles.avatarBtn, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}
            >
              {resolveMediaUrl(currentUser?.photo_profil) ? (
                <Image source={{ uri: resolveMediaUrl(currentUser?.photo_profil)! }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 16 }}>{(userFirstName || 'C').slice(0, 1).toUpperCase()}</Text>
              )}
            </Pressable>
          </View>
        </Animated.View>

        {catalogOffline && (
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.offlineBanner, { backgroundColor: colors.warning + '1A', borderColor: colors.warning + '40' }]}>
            <WifiOff color={colors.warning} size={15} />
            <Text style={[styles.offlineBannerText, { color: colors.warning }]}>
              {t('home.offlineBanner', 'Hors ligne — affichage des dernières données enregistrées')}
            </Text>
          </Animated.View>
        )}

        {/* ── Greeting ─────────────────────────────────── */}
<Animated.View entering={FadeInDown.duration(380).delay(60).springify()} style={styles.greeting}>
          <View>
            <Text style={[styles.greetEyebrow, { color: colors.text }]}>
              {t('home.greeting', 'Bonjour')} {userFirstName} <Text style={[styles.greetDot, { color: colors.textTertiary }]}>·</Text>{' '}
              <Text style={styles.greetStatus}>{t('home.open', 'Ouvert')}</Text>
            </Text>
            <Text style={[styles.greetTitle, { color: colors.text }]}>{t('home.tagline', 'Le marché frais, livré chez vous')}</Text>
          </View>
        </Animated.View>

        {/* ── Search Bar ──────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(120).springify()}
          style={searchAnimStyle}
        >
<Pressable
            onPressIn={() => { searchScale.value = withSpring(0.98); }}
            onPressOut={() => { searchScale.value = withSpring(1); }}
            onPress={() => router.push('/client/search' as any)}
            style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Search color={colors.textTertiary} size={18} />
            <Text style={[styles.searchPlaceholder, { color: colors.textTertiary }]}>{t('home.searchPlaceholder', 'Rechercher un produit, un marché…')}</Text>
          </Pressable>
        </Animated.View>

        {/* ── Promo Banner ─────────────────────────────── */}
        <View style={styles.promoHeading}>
          <Text style={[styles.promoSectionTitle, { color: colors.text }]}>{t('homeExtra.promoOfDay', 'Promo du jour')} </Text>
        </View>

        <Animated.View entering={FadeInUp.duration(450).delay(150).springify()}>
          <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={() => router.push(
              (promotedProduct ? `/client/product/${promotedProduct.id}` : fish ? `/client/product/${fish.id}` : '/client/search') as any
            )}
            style={[styles.promo, promoStyle as any]}
          >
            {/* Copy */}
            <View style={styles.promoCopyWrap}>
              <View style={styles.promoPill}>
                <Tag color={BLUE} size={10} strokeWidth={2.5} />
                <Text style={styles.promoPillText}>{promotedProduct ? t('homeExtra.offerNow', 'OFFRE DU MOMENT') : t('homeExtra.freshOffer', 'OFFRE FRAÎCHE')}</Text>
              </View>
              <Text style={styles.promoTitle}>{promotedProduct?.name || t('home.promoTitle', 'Poisson frais')}</Text>
              <Text style={styles.promoCopy}>
                {promotedProduct ? promotedProduct.promoTitre : t('home.promoCopy', 'Découvrez notre sélection de poissons frais du jour')}
              </Text>
              <View style={styles.promoButton}>
                <Text style={styles.promoButtonText}>{t('home.promoBtn', "Découvrir l'offre")}  ›</Text>
              </View>
            </View>
            {/* Image */}
            <View style={styles.promoImageFrame}>
              <Image
                accessibilityLabel={promotedProduct?.name || 'Poisson frais'}
                contentFit="cover"
                source={{ uri: promotedProduct?.image || fish?.image }}
                style={styles.promoImage}
              />
            </View>
          </Pressable>
        </Animated.View>

        {/* ── Types de boutique ────────────────────────── */}
        <Animated.View entering={FadeInLeft.duration(400).delay(200).springify()}>
          <SectionTitle
            title={t('home.sections.boutiqueTypes', 'Types de boutique')}
            onSeeAll={() => router.push('/client/(tabs)/categories' as any)}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(400).delay(220).springify()}
          style={styles.categoryRow}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 20 }}>
            {boutiqueTypes.slice(0, 6).map((item, index) => (
              <Animated.View
                key={item.type}
                entering={ZoomIn.duration(350).delay(250 + index * 70).springify()}
              >
                <Pressable
                  onPress={() => router.push(`/client/boutiques/${encodeURIComponent(item.type)}` as any)}
                  style={styles.category}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }]}>
                    {item.logoUrl ? (
                      <Image source={{ uri: item.logoUrl }} style={styles.categoryLogo} contentFit="cover" />
                    ) : (
                      <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                    )}
                  </View>
                  <Text numberOfLines={2} style={[styles.categoryText, { color: colors.text, textTransform: 'capitalize' }]}>{item.type}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Vos boutiques ─────────────────────────────── */}
        <Animated.View entering={FadeInRight.duration(400).delay(320).springify()}>
          <SectionTitle
            title={t('home.sections.boutiques', 'Vos boutiques')}
            onSeeAll={() => router.push('/client/(tabs)/categories' as any)}
          />
        </Animated.View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, gap: 12 }}>
          {boutiques.map((v, index) => (
            <Animated.View key={v.id} entering={FadeInUp.duration(350).delay(320 + index * 60).springify()}>
              <Pressable
                onPress={() => router.push(`/client/boutique/${v.id}` as any)}
                style={[styles.boutiqueCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.boutiqueAvatar, { backgroundColor: colors.primarySoft }]}>
                  {v.photo_boutique ? (
                    <Image accessibilityLabel={v.nom_commerce} contentFit="cover" source={{ uri: resolveMediaUrl(v.photo_boutique) }} style={styles.boutiqueAvatarImage} />
                  ) : (
                    <Store color={colors.primary} size={22} />
                  )}
                </View>
                <Text numberOfLines={1} style={[styles.boutiqueName, { color: colors.text }]}>{v.nom_commerce}</Text>
                <View style={styles.boutiqueMeta}>
                  <Star color={colors.gold} size={12} fill={v.note_moyenne > 0 ? colors.gold : 'transparent'} />
                  <Text style={[styles.boutiqueMetaText, { color: colors.textSecondary }]}>{v.note_moyenne > 0 ? v.note_moyenne.toFixed(1) : '—'}</Text>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>

        {/* ── Produits ────────────────────────────────── */}
        {products.length > 0 && (
          <>
            <Animated.View entering={FadeInLeft.duration(400).delay(340).springify()}>
              <SectionTitle
                title={t('home.sections.products', 'Nos produits')}
                onSeeAll={() => router.push('/client/search' as any)}
              />
            </Animated.View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, gap: 12 }}>
              {pagedProductColumns.map((column, i) => (
                <View key={i} style={{ gap: 12 }}>
                  {column.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      compact
                      onAdd={() => addToCart(product.id)}
                    />
                  ))}
                </View>
              ))}
            </ScrollView>
            {totalProductsPages > 1 && (
              <View style={styles.productsPager}>
                <Pressable
                  onPress={() => setProductsPage((p) => Math.max(1, p - 1))}
                  disabled={safeProductsPage <= 1}
                  style={[styles.pagerBtn, { backgroundColor: colors.surface, borderColor: colors.border }, safeProductsPage <= 1 && { opacity: 0.4 }]}
                >
                  <ChevronLeft color={colors.primary} size={16} />
                </Pressable>
                <Text style={[styles.pagerText, { color: colors.textSecondary }]}>{safeProductsPage} / {totalProductsPages}</Text>
                <Pressable
                  onPress={() => setProductsPage((p) => Math.min(totalProductsPages, p + 1))}
                  disabled={safeProductsPage >= totalProductsPages}
                  style={[styles.pagerBtn, { backgroundColor: colors.surface, borderColor: colors.border }, safeProductsPage >= totalProductsPages && { opacity: 0.4 }]}
                >
                  <ChevronRight color={colors.primary} size={16} />
                </Pressable>
              </View>
            )}
          </>
        )}

        {/* ── Favoris ─────────────────────────────────── */}
        {favProducts.length > 0 && (
          <>
            <Animated.View entering={FadeInLeft.duration(400).delay(380).springify()}>
              <SectionTitle
                title={t('home.sections.favorites', 'Mes favoris')}
                onSeeAll={() => router.push('/client/favorites' as any)}
              />
            </Animated.View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, gap: 12 }}>
              {favProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  compact
                  onAdd={() => addToCart(product.id)}
                />
              ))}
            </ScrollView>
          </>
        )}

{/* ── Livraison rapide promo ──────────────────── */}
        <Animated.View entering={FadeInUp.duration(400).delay(400).springify()} style={[styles.deliverBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.deliverIcon, { backgroundColor: colors.goldSoft }]}>
            <Scooter color={Palette.gold} size={24} />
          </View>
          <View style={styles.deliverCopy}>
            <Text style={[styles.deliverTitle, { color: colors.text }]}>{t('home.sections.delivery', 'Livraison express à Brazzaville')}</Text>
            <Text style={[styles.deliverSub, { color: colors.textSecondary }]}>
              En 30–60 min · dès {(Number(zones[0]?.frais_livraison_base) || FALLBACK_DELIVERY_FEE).toLocaleString('fr-FR')} FCFA
            </Text>
          </View>
          <View style={styles.deliverBadge}>
            <Text style={styles.deliverBadgeText}>{t('home.sections.deliveryBadge', 'RAPIDE')}</Text>
          </View>
        </Animated.View>

{/* ── Mode Diaspora (réservé aux clients diaspora) ── */}
        {isDiaspora && (
          <Animated.View entering={FadeInUp.duration(400).delay(450).springify()}>
            <Pressable
              onPress={() => router.push('/client/diaspora' as any)}
              style={[styles.diasporaBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.diasporaIcon}>
                <Globe2 color={colors.primary} size={22} />
              </View>
              <View style={styles.diasporaCopy}>
                <Text style={[styles.diasporaTitle, { color: colors.text }]}>{t('homeExtra.diasporaCta', "Commander pour quelqu'un au Congo")}</Text>
                <Text style={[styles.diasporaSub, { color: colors.primary }]}>{t('menu.diasporaMode', 'Mode Diaspora')}</Text>
              </View>
              <ChevronRight color={colors.primary} size={20} />
            </Pressable>
          </Animated.View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.canvas },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: 32, paddingTop: 4 },

  // Top bar
  top: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingTop: Spacing.sm, paddingBottom: Spacing.md,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  location: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  city: { color: Palette.navy, fontSize: 18, fontWeight: '800', flexShrink: 1 },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    width: 40, height: 40, borderRadius: Radii.sm,
    backgroundColor: Palette.navySoft, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Palette.borderStrong,
  },
  badge: {
    position: 'absolute', right: -5, top: -5,
    backgroundColor: Palette.coral, minWidth: 18, height: 18,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Palette.canvas,
  },
  badgeText: { color: '#FFF', fontSize: 9.5, fontWeight: '900' },
  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: Radii.md, paddingVertical: 10, paddingHorizontal: 14,
    marginBottom: 12,
  },
  offlineBannerText: { fontSize: 12.5, fontWeight: '700', flex: 1 },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },

  // Greeting
  greeting: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: Spacing.md,
  },
  greetEyebrow: { color: Palette.navy, fontSize: 15, fontWeight: '800', marginBottom: 2 },
  greetDot: { color: Palette.faint, fontSize: 15 },
  greetStatus: { color: Palette.fresh, fontSize: 15, fontWeight: '800' },
  greetTitle: { color: Palette.navy, fontSize: 17, fontWeight: '900', lineHeight: 21 },

  // Search
  search: {
    height: 54, borderRadius: Radii.md,
    backgroundColor: Palette.surface, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: Spacing.lg, gap: Spacing.sm,
    borderWidth: 1, borderColor: Palette.border,
    ...Shadows.soft,
    marginBottom: 4,
  },
  searchPlaceholder: { color: Palette.faint, fontSize: 14, fontWeight: '500' },

  // Promo section label
  promoHeading: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
  promoSectionTitle: { color: Palette.navy, fontSize: 19, fontWeight: '900' },

  // Promo card
  promo: {
    minHeight: 165, borderRadius: Radii.xl,
    backgroundColor: Palette.navy,
    paddingLeft: Spacing.xl, paddingRight: Spacing.sm, paddingVertical: Spacing.xl,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', overflow: 'hidden',
    ...Shadows.elevated,
    marginBottom: 4,
  },
  promoCopyWrap: { flex: 1, paddingRight: Spacing.sm },
  promoPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', backgroundColor: Palette.gold,
    borderRadius: Spacing.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  promoPillText: { color: Palette.navy, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  promoTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', marginTop: Spacing.sm, lineHeight: 30 },
  promoCopy: { color: '#C7D8FF', fontSize: 13, marginTop: 6 },
  promoHighlight: { color: Palette.gold, fontWeight: '900' },
  promoButton: {
    alignSelf: 'flex-start', backgroundColor: '#FFF',
    borderRadius: Radii.full, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, marginTop: Spacing.md,
  },
  promoButtonText: { color: Palette.navy, fontWeight: '800', fontSize: 12 },
  promoImageFrame: {
    width: 134, height: 134, borderRadius: Radii.md,
    overflow: 'hidden', backgroundColor: Palette.navySoft, position: 'relative',
  },
  promoImage: { width: '100%', height: '100%' },

  // Categories row
  categoryRow: { paddingTop: 4, paddingBottom: 6 },
  category: { alignItems: 'center', width: 96 },
  categoryIcon: {
    width: 84, height: 84, borderRadius: Radii.xl,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.soft,
    marginBottom: 8,
  },
  categoryImage: { width: 56, height: 50, borderRadius: Radii.sm },
  categoryLogo: { width: '100%', height: '100%', borderRadius: Radii.xl },
  categoryEmoji: { fontSize: 34 },
  categoryText: { color: Palette.navy, fontSize: 12.5, fontWeight: '800', textAlign: 'center' },

  boutiqueCard: { width: 140, borderRadius: Radii.md, borderWidth: 1, padding: Spacing.md, ...Shadows.soft },
  boutiqueAvatar: { width: 44, height: 44, borderRadius: Radii.sm, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8 },
  boutiqueAvatarImage: { width: '100%', height: '100%' },
  boutiqueName: { fontSize: 13, fontWeight: '800' },
  boutiqueMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  boutiqueMetaText: { fontSize: 11.5, fontWeight: '600' },

  productsPager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 10 },
  pagerBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  pagerText: { fontSize: 12.5, fontWeight: '700' },

  // Delivery banner
  deliverBanner: {
    marginTop: 22, borderRadius: Radii.md,
    backgroundColor: Palette.surface, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderWidth: 1, borderColor: Palette.border,
    ...Shadows.soft,
  },
  deliverIcon: {
    width: 46, height: 46, borderRadius: Radii.md,
    backgroundColor: Palette.goldSoft, alignItems: 'center', justifyContent: 'center',
  },
  deliverCopy: { flex: 1 },
  deliverTitle: { color: Palette.navy, fontSize: 14, fontWeight: '800' },
  deliverSub: { color: Palette.muted, fontSize: 12, marginTop: 3 },
  deliverBadge: {
    backgroundColor: Palette.freshSoft, borderRadius: Spacing.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  deliverBadgeText: { color: Palette.fresh, fontSize: 10, fontWeight: '900' },

  // Diaspora banner
  diasporaBanner: {
    marginTop: Spacing.md, borderRadius: Radii.md,
    backgroundColor: Palette.surface, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderWidth: 1, borderColor: Palette.border,
    ...Shadows.soft,
  },
  diasporaIcon: {
    width: 46, height: 46, borderRadius: Radii.md,
    backgroundColor: Palette.navy, alignItems: 'center', justifyContent: 'center',
  },
  diasporaCopy: { flex: 1 },
  diasporaTitle: { color: Palette.navy, fontSize: 14, fontWeight: '800' },
  diasporaSub: { color: Palette.coral, fontSize: 12, marginTop: 3, fontWeight: '800' },
});
