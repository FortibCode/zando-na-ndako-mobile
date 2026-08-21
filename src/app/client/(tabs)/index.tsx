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
  Tag, Globe2, ChevronRight,
} from 'lucide-react-native';
import { useClient } from '@/contexts/client-context';
import { ClientMenu, ProductCard, SectionTitle, BLUE } from '@/components/client-ui';
import { useScalePress } from '@/hooks/use-animation';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { Palette, Spacing, Radii, Shadows } from '@/design/tokens';
import { ThemeToggle, LanguageToggle } from '@/design/components';

const CATEGORY_COLORS = ['#EAF4FF', '#FFEDE8', '#FFF6E8', '#E8F9EE', '#FFF0E8', '#F3EEFF'];

export default function ClientHomeScreen() {
  const { products, popularProducts, promotedProduct, categories, categoryIcons, addToCart, cartCount, favorites, isFavorite, userFirstName, isDiaspora, refreshUser, zones } = useClient();
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
          <View style={styles.locationRow}>
            <ClientMenu />
            <Pressable style={styles.location}>
              <MapPin color={colors.primary} size={18} />
              <Text style={[styles.city, { color: colors.text }]}>{t('homeExtra.city', 'Brazzaville')}</Text>
              <ChevronDown color={colors.textSecondary} size={15} />
            </Pressable>
          </View>
          <View style={styles.actions}>
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
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Greeting ─────────────────────────────────── */}
<Animated.View entering={FadeInDown.duration(380).delay(60).springify()} style={styles.greeting}>
          <View>
            <Text style={[styles.greetEyebrow, { color: colors.text }]}>
              {t('home.greeting', 'Bonjour')} {userFirstName} <Text style={styles.greetDot}>·</Text>{' '}
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
              promotedProduct
                ? `/client/product/${promotedProduct.id}`
                : `/client/category/${encodeURIComponent(fish?.category || '')}` as any
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

        {/* ── Quick Categories ────────────────────────── */}
        <Animated.View entering={FadeInLeft.duration(400).delay(200).springify()}>
          <SectionTitle
            title={t('home.sections.rays', 'Vos rayons')}
            onSeeAll={() => router.push('/client/search' as any)}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(400).delay(220).springify()}
          style={styles.categoryRow}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
            {categories.slice(0, 6).map((category, index) => (
              <Animated.View
                key={category}
                entering={ZoomIn.duration(350).delay(250 + index * 70).springify()}
              >
                <Pressable
                  onPress={() => router.push(`/client/category/${category}` as any)}
                  style={styles.category}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }]}>
                    <Image
                      accessibilityLabel={category}
                      contentFit="cover"
                      source={{ uri: categoryIcons[category] || products.find((product) => product.category === category)?.image }}
                      style={styles.categoryImage}
                    />
                  </View>
<Text numberOfLines={2} style={[styles.categoryText, { color: colors.text }]}>{category}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Produits populaires ─────────────────────── */}
        <Animated.View entering={FadeInRight.duration(400).delay(320).springify()}>
          <SectionTitle
            title={t('home.sections.popular', 'Produits populaires')}
            onSeeAll={() => router.push('/client/search' as any)}
          />
        </Animated.View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20, gap: 12 }}>
          {(popularProducts.length > 0 ? popularProducts : products.slice(0, 5)).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              compact
              onAdd={() => addToCart(product.id)}
            />
          ))}
        </ScrollView>

        {/* ── Favoris ─────────────────────────────────── */}
        {favProducts.length > 0 && (
          <>
            <Animated.View entering={FadeInLeft.duration(400).delay(380).springify()}>
              <SectionTitle
                title={`${t('home.sections.favorites', 'Mes favoris')} ❤️`}
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
          <View style={styles.deliverIcon}>
            <Text style={styles.deliverEmoji}>🛵</Text>
          </View>
          <View style={styles.deliverCopy}>
            <Text style={[styles.deliverTitle, { color: colors.text }]}>{t('home.sections.delivery', 'Livraison express à Brazzaville')}</Text>
            <Text style={[styles.deliverSub, { color: colors.textSecondary }]}>
              En 30–60 min · dès {(Number(zones[0]?.frais_livraison_base) || 800).toLocaleString('fr-FR')} FCFA
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
  location: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  city: { color: Palette.navy, fontSize: 18, fontWeight: '800' },
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
    height: 52, borderRadius: Radii.md,
    backgroundColor: Palette.surface, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: Spacing.lg, gap: Spacing.sm,
    borderWidth: 1, borderColor: Palette.border,
    ...Shadows.soft,
    marginBottom: 2,
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
  categoryRow: { paddingTop: 2, paddingBottom: 4 },
  category: { alignItems: 'center', width: 80 },
  categoryIcon: {
    width: 68, height: 68, borderRadius: Radii.lg,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.soft,
    marginBottom: 6,
  },
  categoryImage: { width: 56, height: 50, borderRadius: Radii.sm },
  categoryText: { color: Palette.navy, fontSize: 11.5, fontWeight: '700', textAlign: 'center' },

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
  deliverEmoji: { fontSize: 24 },
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
