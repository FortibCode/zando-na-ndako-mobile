import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState, type ReactNode } from 'react';
import type { Product } from '@/contexts/client-context';
import { useClient } from '@/contexts/client-context';
import { useTheme } from '@/contexts/theme-context';
import { useDiaspora, formatEur, formatUsd } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';
import { ClientIcon } from '@/components/client-icon';
import Animated, {
  FadeIn, SlideInLeft,
  useAnimatedStyle, useSharedValue, withSpring, withSequence,
} from 'react-native-reanimated';
import { PremiumPressable } from '@/components/premium-ui';
import { Heart, Star, Plus } from 'lucide-react-native';
import { Palette } from '@/design/tokens';
import { clearAuthToken } from '@/services/api';

export const BLUE = Palette.navy;
export const RED = Palette.coral;
export const GOLD = Palette.gold;
export const GREEN = Palette.fresh;

const MENU_ITEMS = [
  ['menu.home', 'Accueil', 'home', '/client'],
  ['menu.categories', 'Catégories', 'grid', '/client/(tabs)/categories'],
  ['menu.cart', 'Mon panier', 'cart', '/client/(tabs)/cart'],
  ['menu.orders', 'Mes commandes', 'receipt', '/client/(tabs)/orders'],
  ['menu.disputes', 'Mes litiges', 'shield', '/client/disputes'],
  ['menu.addresses', 'Adresses de livraison', 'location', '/client/checkout/address'],
  ['menu.paymentMethods', 'Moyens de paiement', 'creditCard', '/client/checkout/payment'],
  ['menu.favorites', 'Mes favoris', 'star', '/client/favorites'],
  ['menu.rateSellerDriver', 'Noter vendeur / livreur', 'star', '/client/rating'],
  ['menu.notifications', 'Notifications', 'bell', '/client/notifications'],
  ['menu.diasporaMode', 'Mode Diaspora', 'globe', '/client/diaspora'],
  ['menu.myProfile', 'Mon profil', 'user', '/client/(tabs)/profile'],
] as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function ClientMenu() {
  const [open, setOpen] = useState(false);
  const { cartCount, isDiaspora, currentUser } = useClient();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const visibleMenu = MENU_ITEMS.filter(([key]) =>
    key !== 'menu.diasporaMode' || isDiaspora
  );

  const displayName = currentUser?.nom_complet || t('menu.guest', 'Invité');
  const displayCity = currentUser?.ville || '—';
  const initials = currentUser ? getInitials(displayName) : 'IN';

  return (
    <>
      <Pressable
        accessibilityLabel={t('menu.openMenu', 'Ouvrir le menu')}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        hitSlop={10}
        style={[styles.menuButton, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}
      >
        <ClientIcon color={colors.primary} name="menu" size={24} />
      </Pressable>
      <Modal animationType="none" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Animated.View entering={FadeIn.duration(220)} style={styles.backdrop}>
            <Pressable
              accessibilityLabel={t('menu.closeMenu', 'Fermer le menu')}
              style={StyleSheet.absoluteFill}
              onPress={() => setOpen(false)}
            />
          </Animated.View>
          <Animated.View entering={SlideInLeft.duration(280).springify()} style={[styles.drawer, { backgroundColor: colors.surface }]}>
            {/* Brand Header */}
            <View style={[styles.drawerBrand, { backgroundColor: colors.primary }]}>
              <Image
                accessibilityLabel="Logo Zando na Ndako"
                contentFit="contain"
                source={require('../../assets/images/zando-logo.jpeg')}
                style={styles.drawerLogo}
              />
              <Pressable
                accessibilityLabel="Fermer le menu"
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <ClientIcon color="#FFF" name="close" size={20} />
              </Pressable>
            </View>

            {/* Profile mini */}
            <View style={[styles.drawerProfile, { borderBottomColor: colors.border }]}>
              <View style={[styles.drawerAvatarWrap, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.drawerAvatarText, { color: colors.primary }]}>{initials}</Text>
              </View>
              <View>
                <Text numberOfLines={1} style={[styles.drawerName, { color: colors.text }]}>{displayName}</Text>
                <Text style={[styles.drawerEmail, { color: colors.textSecondary }]}>{t('profile.client', 'Client')} · {displayCity}</Text>
              </View>
              <View style={[styles.drawerCartBadge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.drawerCartBadgeText, { color: colors.primary }]}>{cartCount}</Text>
                <Text style={[styles.drawerCartLabel, { color: colors.textSecondary }]}>{t('menu.inCart', 'au panier')}</Text>
              </View>
            </View>

            {/* Menu items */}
            <View style={styles.drawerList}>
              {visibleMenu.map(([key, fallback, icon, route]) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  onPress={() => {
                    setOpen(false);
                    router.push(route as any);
                  }}
                  style={styles.drawerItem}
                >
                  <View style={[styles.drawerItemIcon, { backgroundColor: colors.primarySoft }]}>
                    <ClientIcon color={colors.primary} name={icon as any} size={18} />
                  </View>
                  <Text style={[styles.drawerItemText, { color: colors.text }]}>{t(key, fallback)}</Text>
                  <ClientIcon color={colors.textTertiary} name="chevronForward" size={16} />
                </Pressable>
              ))}
            </View>

            {/* Logout */}
            <Pressable
              accessibilityRole="button"
              onPress={() => { setOpen(false); clearAuthToken(); router.replace('/auth'); }}
              style={[styles.drawerLogout, { borderTopColor: colors.border }]}
            >
              <ClientIcon color={colors.error} name="logout" size={20} />
              <Text style={[styles.drawerLogoutText, { color: colors.error }]}>{t('menu.logout', 'Se déconnecter')}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

export function ProductCard({ product, onAdd, compact = false }: { product: Product; onAdd: () => void; compact?: boolean }) {
  const { isFavorite, toggleFavorite } = useClient();
  const { colors, isDark } = useTheme();
  const { diasporaModeActive } = useDiaspora();
  const { t } = useLanguage();
  const favorite = isFavorite(product.id);
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const heartAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  const handleFavorite = () => {
    heartScale.value = withSequence(
      withSpring(1.3, { damping: 4, stiffness: 200 }),
      withSpring(1, { damping: 6, stiffness: 200 }),
    );
    toggleFavorite(product.id);
  };

  const unitLabel = product.unit.replace(/^FCFA\/?/, '');

  return (
    <Animated.View
      style={[
        styles.productCard,
        compact && styles.productCardCompact,
        {
          backgroundColor: isDark ? 'rgba(18, 22, 32, 0.88)' : 'rgba(255, 255, 255, 0.92)',
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
        animStyle,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={product.name}
        onPress={() => router.push(`/client/product/${product.id}` as any)}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <View style={[styles.productImage, { backgroundColor: colors.backgroundAlt }]}>
          <Image
            accessibilityLabel={product.name}
            contentFit="cover"
            source={{ uri: product.image }}
            style={styles.productPhoto}
          />
          <View style={[styles.freshBadge, { backgroundColor: colors.freshSoft }]}>
            <Text style={[styles.freshBadgeText, { color: colors.fresh }]}>FRAIS</Text>
          </View>
          <Pressable
            onPress={handleFavorite}
            hitSlop={8}
            style={[styles.favoriteButton, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.85)' }]}
            accessibilityLabel={favorite ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
          >
            <Animated.View style={heartAnimStyle}>
              <Heart
                color={favorite ? colors.primary : colors.textTertiary}
                fill={favorite ? colors.primary : 'none'}
                size={15}
              />
            </Animated.View>
          </Pressable>
        </View>

        <Text numberOfLines={1} style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
        {product.reviews > 0 ? (
          <View style={styles.ratingRow}>
            <Star color={GOLD} fill={GOLD} size={12} />
            <Text style={[styles.productRating, { color: colors.gold }]}>
              {product.rating.toFixed(1)} <Text style={{ color: colors.textSecondary }}>({product.reviews})</Text>
            </Text>
          </View>
        ) : (
          <Text style={[styles.productRating, { color: colors.textSecondary, marginTop: 4 }]}>{t('productExtra.new', 'Nouveau')}</Text>
        )}
        <Text style={[styles.productPrice, { color: colors.primary }]}>
          {product.price.toLocaleString('fr-FR')} FCFA
          {unitLabel ? <Text style={[styles.unit, { color: colors.textSecondary }]}> /{unitLabel}</Text> : null}
        </Text>
        {diasporaModeActive && (
          <Text numberOfLines={1} style={[styles.unit, { color: colors.textSecondary, marginTop: 2 }]}>
            {formatEur(product.price)} · {formatUsd(product.price)}
          </Text>
        )}
      </Pressable>

      <PremiumPressable
        accessibilityLabel={`Ajouter ${product.name} au panier`}
        onPress={onAdd}
        style={[styles.add, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
      >
        <Plus color="#FFF" size={17} strokeWidth={3} />
      </PremiumPressable>
    </Animated.View>
  );
}

export function Header({ title, back = false, right }: { title: string; back?: boolean; right?: ReactNode }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <View style={styles.header}>
      {back && (
        <Pressable
          accessibilityLabel={t('common.back', 'Retour')}
          onPress={() => router.back()}
          hitSlop={10}
          style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}
        >
          <ClientIcon color={colors.primary} name="arrowBack" size={22} />
        </Pressable>
      )}
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function SectionTitle({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <View style={styles.sectionTitle}>
      <Text style={[styles.sectionText, { color: colors.text }]}>{title}</Text>
      {onSeeAll && (
        <Pressable accessibilityRole="button" onPress={onSeeAll} style={styles.seeAllBtn}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>{t('menu.seeAll', 'Voir tout ›')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },

  modalRoot: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: Palette.overlay },
  drawer: {
    width: '82%', maxWidth: 340,
    paddingHorizontal: 16, paddingTop: 28, paddingBottom: 20,
    shadowOpacity: 0.25, shadowRadius: 22, elevation: 14,
  },
  drawerBrand: {
    height: 80, borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    overflow: 'hidden', marginBottom: 14,
  },
  drawerLogo: { width: 170, height: 60, borderRadius: 8, backgroundColor: '#FFF' },
  closeButton: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  drawerProfile: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderBottomWidth: 1,
    paddingBottom: 14, marginBottom: 8,
  },
  drawerAvatarWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  drawerAvatarText: { fontSize: 14, fontWeight: '900' },
  drawerName: { fontSize: 13.5, fontWeight: '800' },
  drawerEmail: { fontSize: 11.5, marginTop: 1 },
  drawerCartBadge: {
    marginLeft: 'auto',
    borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5,
    alignItems: 'center',
  },
  drawerCartBadgeText: { fontSize: 16, fontWeight: '900' },
  drawerCartLabel: { fontSize: 10, marginTop: 1 },
  drawerList: { flex: 1 },
  drawerItem: {
    minHeight: 46, borderRadius: 12, paddingHorizontal: 8,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  drawerItemIcon: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  drawerItemText: { fontSize: 13.5, fontWeight: '600', flex: 1 },
  drawerLogout: {
    borderTopWidth: 1,
    paddingTop: 14, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  drawerLogoutText: { fontWeight: '800', fontSize: 14 },

  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900' },
  headerRight: { marginLeft: 'auto' },

  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 12 },
  sectionText: { fontSize: 19, fontWeight: '900' },
  seeAllBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  seeAll: { fontSize: 13, fontWeight: '800' },

  productCard: {
    width: '100%', minHeight: 230,
    borderRadius: 20, borderWidth: 1,
    padding: 10, marginRight: 14,
    shadowOpacity: 0.10, shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
    position: 'relative',
  },
  productCardCompact: { width: 158, minHeight: 230 },
  productImage: {
    height: 118, borderRadius: 16,
    overflow: 'hidden', position: 'relative',
  },
  productPhoto: { width: '100%', height: '100%' },
  freshBadge: {
    position: 'absolute', top: 8, left: 8,
    borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  freshBadgeText: { fontSize: 8.5, fontWeight: '900', letterSpacing: 0.5 },
  favoriteButton: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    elevation: 2,
  },
  productName: { fontSize: 13.5, fontWeight: '800', marginTop: 9 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  productRating: { fontSize: 11, fontWeight: '800' },
  productPrice: { fontSize: 14, fontWeight: '900', marginTop: 5 },
  unit: { fontSize: 10, fontWeight: '500' },
  add: {
    position: 'absolute', right: 10, bottom: 10,
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
});
