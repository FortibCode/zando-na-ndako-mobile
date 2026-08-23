import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import Animated, { FadeIn, SlideInLeft } from 'react-native-reanimated';
import {
  ArrowLeft, Home, ClipboardList, Tag, Gem, User, Menu, X,
  Star, Percent, FileCheck, Headset, LogOut, ShieldAlert,
} from 'lucide-react-native';
import { BLUE, RED, GOLD, GREEN } from '@/components/client-ui';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { GlassSurface } from '@/design/components';
import { clearAuthToken } from '@/services/api';

export { BLUE, RED, GOLD, GREEN };

export function VendorMenu() {
  const [open, setOpen] = useState(false);
  const { boutique, documents } = useVendor();
  const { colors } = useTheme();
  const { t } = useLanguage();
  // Même correctif que vendor/(tabs)/profile.tsx : affiche la vraie photo de la boutique si le
  // vendeur en a envoyé une, sinon l'emoji dérivé du type de commerce en repli.
  const boutiquePhotoUrl = documents.find((d) => d.id === 'photo_boutique')?.url;

  const MENU_ITEMS = [
    [t('vendorNav.home', 'Accueil'), Home, '/vendor/(tabs)'],
    [t('vendorNav.orders', 'Commandes'), ClipboardList, '/vendor/(tabs)/orders'],
    [t('vendorNav.products', 'Produits'), Tag, '/vendor/(tabs)/products'],
    [t('vendorNav.revenue', 'Revenus'), Gem, '/vendor/(tabs)/revenue'],
    [t('vendorNav.reviews', 'Avis clients'), Star, '/vendor/reviews'],
    [t('vendorNav.promotions', 'Mes promotions'), Percent, '/vendor/promotions'],
    [t('vendorNav.documents', 'Documents'), FileCheck, '/vendor/documents'],
    [t('vendorNav.support', 'Support Zando na Ndako'), Headset, '/vendor/support'],
    [t('vendorNav.disputes', 'Litiges'), ShieldAlert, '/vendor/disputes'],
    [t('vendorNav.profile', 'Mon profil'), User, '/vendor/(tabs)/profile'],
  ] as const;

  return (
    <>
      <Pressable
        accessibilityLabel={t('vendorNav.openMenu', 'Ouvrir le menu')}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        hitSlop={10}
        style={[styles.menuButton, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}
      >
        <Menu color={colors.primary} size={22} />
      </Pressable>
      <Modal animationType="none" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Animated.View entering={FadeIn.duration(220)} style={styles.backdrop}>
            <Pressable
              accessibilityLabel={t('vendorNav.closeMenu', 'Fermer le menu')}
              style={{ flex: 1 }}
              onPress={() => setOpen(false)}
            />
          </Animated.View>
          <Animated.View entering={SlideInLeft.duration(280).springify()} style={[styles.drawer, { backgroundColor: colors.surface }]}>
            <View style={[styles.drawerBrand, { backgroundColor: colors.primary }]}>
              <Image
                accessibilityLabel="Logo Zando na Ndako"
                contentFit="contain"
                source={require('../../assets/images/zando-logo.jpeg')}
                style={styles.drawerLogo}
              />
              <Pressable
                accessibilityLabel={t('vendorNav.closeMenu', 'Fermer le menu')}
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <X color="#FFF" size={20} />
              </Pressable>
            </View>

            <View style={[styles.drawerProfile, { borderBottomColor: colors.border }]}>
              <View style={[styles.drawerAvatarWrap, { backgroundColor: colors.primarySoft }]}>
                {boutiquePhotoUrl ? (
                  <Image source={{ uri: boutiquePhotoUrl }} style={styles.drawerAvatarImg} contentFit="cover" />
                ) : (
                  <Text style={styles.drawerAvatarEmoji}>{boutique.emoji}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.drawerName, { color: colors.text }]}>{boutique.nom}</Text>
                <Text style={[styles.drawerSub, { color: colors.textSecondary }]}>{t('vendorNav.vendorRole', 'Vendeur')}</Text>
              </View>
            </View>

            <ScrollView style={styles.drawerList} showsVerticalScrollIndicator={false}>
              {MENU_ITEMS.map(([label, Icon, route]) => (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  onPress={() => { setOpen(false); router.push(route as any); }}
                  style={styles.drawerItem}
                >
                  <View style={[styles.drawerItemIcon, { backgroundColor: colors.primarySoft }]}>
                    <Icon color={colors.primary} size={18} />
                  </View>
                  <Text style={[styles.drawerItemText, { color: colors.text }]}>{label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              onPress={() => { setOpen(false); clearAuthToken(); router.replace('/auth'); }}
              style={[styles.drawerLogout, { borderTopColor: colors.border }]}
            >
              <LogOut color={colors.error} size={20} />
              <Text style={[styles.drawerLogoutText, { color: colors.error }]}>{t('vendorNav.logout', 'Se déconnecter')}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

export function VendorScreen({ children, scroll = true, contentStyle }: { children: ReactNode; scroll?: boolean; contentStyle?: ViewStyle }) {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, contentStyle]}>
          {children}
        </ScrollView>
      ) : children}
    </SafeAreaView>
  );
}

export function VendorHeader({ title, subtitle, back = true, right }: {
  title: string; subtitle?: string; back?: boolean; right?: ReactNode;
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {back ? (
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}
          accessibilityLabel={t('vendorNav.back', 'Retour')}
        >
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
      ) : <View style={{ width: 40 }} />}
      <View style={{ flex: 1 }}>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {right || <View style={{ width: 40 }} />}
    </View>
  );
}

const TAB_KEYS = [
  { key: 'home', icon: Home, path: '/vendor/(tabs)' },
  { key: 'orders', icon: ClipboardList, path: '/vendor/(tabs)/orders' },
  { key: 'products', icon: Tag, path: '/vendor/(tabs)/products' },
  { key: 'revenue', icon: Gem, path: '/vendor/(tabs)/revenue' },
  { key: 'profile', icon: User, path: '/vendor/(tabs)/profile' },
] as const;

export type VendorTabKey = typeof TAB_KEYS[number]['key'];

export function VendorBottomNav({ active }: { active: VendorTabKey }) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const TABS = TAB_KEYS.map((tab) => ({
    ...tab,
    label: tab.key === 'home' ? t('vendorNav.home', 'Accueil')
      : tab.key === 'orders' ? t('vendorNav.orders', 'Commandes')
      : tab.key === 'products' ? t('vendorNav.products', 'Produits')
      : tab.key === 'revenue' ? t('vendorNav.revenue', 'Revenus')
      : t('vendorNav.profileShort', 'Profil'),
  }));

  return (
    <View style={[styles.nav, { backgroundColor: isDark ? 'rgba(18, 22, 32, 0.96)' : 'rgba(255, 255, 255, 0.94)', borderTopColor: colors.border }]}>
      {TABS.map(({ key, label, icon: Icon, path }) => {
        const isActive = active === key;
        return (
          <Pressable
            key={key}
            accessibilityLabel={label}
            style={styles.navItem}
            onPress={() => router.push(path as any)}
          >
            <Icon color={isActive ? colors.primary : colors.textTertiary} size={23} strokeWidth={isActive ? 2.4 : 2} />
            <Text style={[styles.navLabel, { color: isActive ? colors.primary : colors.textTertiary }, isActive && styles.navLabelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function StatCard({ label, value, sub, style }: { label: string; value: string; sub?: string; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <GlassSurface style={[styles.statCard, style]}>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      {sub ? <Text style={[styles.statSub, { color: colors.textTertiary }]}>{sub}</Text> : null}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 30 },

  menuButton: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  modalRoot: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)' },
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
    width: 40, height: 40, borderRadius: 20, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  drawerAvatarImg: { width: 40, height: 40 },
  drawerAvatarEmoji: { fontSize: 18 },
  drawerName: { fontSize: 13.5, fontWeight: '800' },
  drawerSub: { fontSize: 11.5, marginTop: 1 },
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

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 19, fontWeight: '900' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },

  nav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    height: 78, borderTopWidth: 1, paddingBottom: 6,
  },
  navItem: { alignItems: 'center', gap: 4, minWidth: 60 },
  navLabel: { fontSize: 11, fontWeight: '700' },
  navLabelActive: { fontWeight: '900' },

  statCard: {
    flex: 1, borderRadius: 18, padding: 16,
  },
  statLabel: { fontSize: 13.5, fontWeight: '700' },
  statValue: { fontSize: 26, fontWeight: '900', marginTop: 8 },
  statSub: { fontSize: 12, marginTop: 4 },
});
