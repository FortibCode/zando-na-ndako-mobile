import { router } from 'expo-router';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Linking, Modal, Platform, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet as RNStyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import * as React from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Bell, CheckCircle2, ChevronRight, Clock3, Headphones, Home, ListChecks, LogOut, MapPin, Menu, Navigation2, Package, Phone, Settings, Store, UserRound, Wallet, X, XCircle } from 'lucide-react-native';
import Animated, { FadeIn, SlideInLeft } from 'react-native-reanimated';
import { PremiumButton, PremiumCard, PremiumPressable } from '@/components/premium-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { resolveMediaUrl } from '@/services/api';
import { Palette } from '@/design/tokens';
import { ThemeToggle, LanguageToggle } from '@/design/components';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

const StyleSheet = { ...RNStyleSheet, absoluteFillObject: RNStyleSheet.absoluteFill };

export const D = { blue: Palette.navy, ink: Palette.ink, green: Palette.fresh, greenSoft: Palette.freshSoft, red: Palette.coral, border: Palette.border, muted: Palette.muted, orange: Palette.orange };

export function DeliveryScreen({ children, scroll = true, dark = false, refreshing = false, onRefresh }: { children: ReactNode; scroll?: boolean; dark?: boolean; refreshing?: boolean; onRefresh?: () => void }) {
  const { colors, isDark } = useTheme();
  return <SafeAreaView style={[styles.screen, { backgroundColor: dark ? colors.primaryDeep : colors.background }]}><StatusBar style={dark || isDark ? 'light' : 'dark'} />{scroll ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined}>{children}</ScrollView> : children}</SafeAreaView>;
}

export function Header({ title, back = true, action, showStatus = false }: { title: string; back?: boolean; action?: ReactNode; showStatus?: boolean }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { driver } = useDelivery();
  const isOnline = driver?.statut_disponibilite === 'disponible';
  return (
    <View style={styles.header}>
      {back ? (
        <Pressable
          accessibilityLabel={t('deliveryUi.back', 'Retour')}
          onPress={() => router.back()}
          hitSlop={12}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <ArrowLeft color={colors.text} size={20} strokeWidth={2.4} />
        </Pressable>
      ) : (
        <View style={{ width: 40 }} />
      )}
      <Text style={[styles.headerTitle, { color: colors.text, flex: 1, marginLeft: 14 }]} numberOfLines={1}>{title}</Text>
      {action || (showStatus ? (
        <View style={[styles.badge, { backgroundColor: isOnline ? colors.freshSoft : colors.backgroundAlt }]}>
          <View style={[styles.onlineDot, { backgroundColor: isOnline ? colors.fresh : colors.textTertiary }]} />
          <Text style={[styles.badgeText, { color: isOnline ? colors.fresh : colors.textTertiary }]}>{isOnline ? t('deliveryUi.online', 'En ligne') : t('deliveryUi.offline', 'Hors ligne')}</Text>
        </View>
      ) : (
        <View style={{ width: 40 }} />
      ))}
    </View>
  );
}

export function Card({ children, style, index = 0 }: { children: ReactNode; style?: any; index?: number }) { return <PremiumCard style={style} index={index}>{children}</PremiumCard>; }
export function PrimaryButton({ children, onPress, red = false }: { children: ReactNode; onPress?: () => void; red?: boolean }) { return <PremiumButton onPress={onPress} tone={red ? 'danger' : 'primary'}>{children}</PremiumButton>; }
export function OutlineButton({ children, onPress, red = false }: { children: ReactNode; onPress?: () => void; red?: boolean }) {
  const { colors } = useTheme();
  const content = React.Children.map(children, (child) =>
    typeof child === 'string' ? <Text style={[styles.outlineText, { color: red ? colors.error : colors.primary }]}>{child}</Text> : child
  );

  return <PremiumPressable onPress={onPress} style={[styles.outline, { borderColor: red ? colors.error : colors.primary, backgroundColor: colors.surface }]}><View style={deliveryStyles.buttonContent}>{content}</View></PremiumPressable>;
}

export function BottomNav({ active }: { active: 'home' | 'missions' | 'revenue' | 'profile' }) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const items = [{ key: 'home', label: t('deliveryUi.home', 'Accueil'), icon: Home, path: '/delivery/(tabs)' }, { key: 'missions', label: t('deliveryUi.navMissions', 'Missions'), icon: ListChecks, path: '/delivery/(tabs)/missions' }, { key: 'revenue', label: t('deliveryUi.navRevenue', 'Revenus'), icon: Wallet, path: '/delivery/(tabs)/revenue' }, { key: 'profile', label: t('vendorNav.profileShort', 'Profil'), icon: UserRound, path: '/delivery/(tabs)/profile' }] as const;
  const renderItem = ({ key, label, icon: Icon, path }: typeof items[number]) => <Pressable key={key} accessibilityLabel={label} style={styles.navItem} onPress={() => router.push(path as any)}><Icon size={25} color={active === key ? colors.primary : colors.textTertiary} strokeWidth={active === key ? 2.6 : 2} /><Text style={[styles.navLabel, { color: active === key ? colors.primary : colors.textTertiary }]}>{label}</Text>{active === key && <View style={[deliveryStyles.navIndicator, { backgroundColor: colors.primary, opacity: 1 }]} />}</Pressable>;
  return <View style={[styles.nav, { backgroundColor: isDark ? 'rgba(18, 22, 32, 0.96)' : 'rgba(255, 255, 255, 0.94)', borderTopColor: colors.border }]}><View style={deliveryStyles.navGroup}>{items.slice(0, 2).map(renderItem)}</View><PremiumPressable onPress={() => router.push('/delivery/mission' as any)} style={[deliveryStyles.centerFab, { backgroundColor: colors.primary, borderColor: colors.background, shadowColor: colors.primary }]}><Package color={colors.white} size={25} strokeWidth={2.4} /></PremiumPressable><View style={deliveryStyles.navGroup}>{items.slice(2).map(renderItem)}</View></View>;
}

const SUPPORT_PHONE = '+242060000000';

export function SupportActions({ label }: { label?: string }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const resolvedLabel = label ?? t('deliveryUi.contactSupport', 'Contacter le support');
  return (
    <View style={styles.actionRow}>
      <Pressable accessibilityLabel={t('deliveryUi.callSupportAria', 'Appeler le support')} style={styles.actionButton} onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {})}>
        <Phone color={colors.fresh} size={25} />
        <Text style={[styles.actionText, { color: colors.text }]}>{t('deliveryUi.call', 'Appeler')}</Text>
      </Pressable>
      <Pressable accessibilityLabel={t('deliveryUi.contactSupport', 'Contacter le support')} style={styles.actionButton} onPress={() => router.push('/delivery/support' as any)}>
        <Headphones color={colors.primary} size={25} />
        <Text style={[styles.actionText, { color: colors.text }]}>{resolvedLabel}</Text>
      </Pressable>
    </View>
  );
}

// ─── Aperçu d'itinéraire : distance/durée réelles renvoyées par le backend, présentées
// dans une carte lisible plutôt qu'une fausse carte routière dessinée à la main.
export function RouteCard({
  originLabel,
  originSub,
  destinationLabel,
  destinationSub,
  distanceLabel,
  durationLabel,
}: {
  originLabel: string;
  originSub?: string;
  destinationLabel: string;
  destinationSub?: string;
  distanceLabel: string;
  durationLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[deliveryStyles.routeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[deliveryStyles.routeBanner, { backgroundColor: colors.primary }]}>
        <View style={deliveryStyles.routeBannerIcon}>
          <Navigation2 color="#FFF" size={24} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={deliveryStyles.routeBannerValue}>{distanceLabel}</Text>
          {durationLabel ? <Text style={deliveryStyles.routeBannerSub}>≈ {durationLabel}</Text> : null}
        </View>
        <ArrowRight color="#FFF" size={22} />
      </View>
      <View style={{ padding: 18, flexDirection: 'row' }}>
        <View style={{ alignItems: 'center', width: 30 }}>
          <View style={deliveryStyles.timelineDotBlue} />
          <View style={[deliveryStyles.timelineLine, { backgroundColor: colors.border, height: 34 }]} />
          <View style={deliveryStyles.timelineDotGreen} />
        </View>
        <View style={{ flex: 1, marginLeft: 10, gap: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Store color={D.blue} size={18} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { fontSize: 15, color: colors.text }]} numberOfLines={1}>{originLabel}</Text>
              {originSub ? <Text style={[styles.muted, { fontSize: 12, marginTop: 2, color: colors.textSecondary }]} numberOfLines={1}>{originSub}</Text> : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <MapPin color={D.green} size={18} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { fontSize: 15, color: colors.text }]} numberOfLines={1}>{destinationLabel}</Text>
              {destinationSub ? <Text style={[styles.muted, { fontSize: 12, marginTop: 2, color: colors.textSecondary }]} numberOfLines={1}>{destinationSub}</Text> : null}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Statut d'une course passée (terminée / en cours / échouée) : logique de couleur+icône
// centralisée ici pour ne pas la retaper à chaque écran qui liste des missions.
const MISSION_STATUS_ICON = {
  terminee: CheckCircle2,
  en_cours: Clock3,
  echouee: XCircle,
} as const;

export function StatusPill({ statut, size = 13 }: { statut: 'terminee' | 'en_cours' | 'echouee'; size?: number }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const label = statut === 'terminee' ? t('deliveryUi.statusDelivered', 'Livrée')
    : statut === 'en_cours' ? t('deliveryUi.statusOngoing', 'En cours')
    : t('deliveryUi.statusCancelled', 'Annulée');
  const color = statut === 'echouee' ? colors.error : statut === 'terminee' ? colors.fresh : colors.primary;
  const Icon = MISSION_STATUS_ICON[statut];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Icon color={color} size={size} />
      <Text style={{ color, fontSize: 11.5, fontWeight: '900' }}>{label}</Text>
    </View>
  );
}

// Codes de commande / repères opérationnels affichés en monospace — lisibilité et registre
// "précision" cohérents avec la direction de design validée.
export const monoLabel = {
  fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  fontWeight: '700' as const,
};

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  darkScreen: { backgroundColor: Palette.canvasAlt },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  header: { height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
  eyebrow: { fontSize: 10, letterSpacing: 1.2, fontWeight: '900', marginBottom: 2 },
  sectionTitle: { fontSize: 22, fontWeight: '900' },
  outline: { borderWidth: 1.5, borderRadius: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 10 },
  outlineText: { fontSize: 15, fontWeight: '800' },
  nav: { height: 72, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 4 },
  navItem: { alignItems: 'center', gap: 3, minWidth: 65 },
  navLabel: { fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  actionText: { fontSize: 14, fontWeight: '700' },
  missionCard: { marginTop: 18 },
  muted: { fontSize: 15 },
  big: { fontSize: 28, fontWeight: '900' },
  divider: { height: 1, marginVertical: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { fontWeight: '800', fontSize: 12 },
  bell: { padding: 8 },
  menuButton: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  drawerRoot: { flex: 1, flexDirection: 'row' },
  drawerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5, 20, 52, .48)' },
  drawer: { width: '82%', maxWidth: 340, paddingHorizontal: 18, paddingTop: 30, paddingBottom: 20, shadowOpacity: .2, shadowRadius: 20, elevation: 12 },
  drawerBrand: { minHeight: 76, borderRadius: 20, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  drawerBrandMark: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  drawerBrandMarkText: { fontSize: 22, fontWeight: '900' },
  drawerBrandTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  drawerBrandSub: { color: '#FFF', opacity: 0.85, fontSize: 11, marginTop: 2, fontWeight: '700' },
  drawerClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' },
  drawerProfile: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  drawerAvatar: { width: 46, height: 46, borderRadius: 16 },
  drawerAvatarFallback: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  drawerAvatarText: { fontSize: 16, fontWeight: '900' },
  drawerName: { fontSize: 16, fontWeight: '900', marginLeft: 12 },
  drawerOnline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 12, marginTop: 4 },
  drawerOnlineText: { fontSize: 12, fontWeight: '800' },
  drawerSection: { paddingTop: 16 },
  drawerSectionLabel: { fontSize: 10, letterSpacing: 1.2, fontWeight: '900', marginBottom: 6 },
  drawerItem: { minHeight: 46, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  drawerItemText: { fontSize: 14, fontWeight: '800', flex: 1 },
  drawerFooter: { marginTop: 'auto', paddingTop: 14, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  drawerFooterText: { fontSize: 11, fontWeight: '600' },
});

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function DeliveryDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { driver } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const driverName = driver ? `${driver.prenom ?? ''} ${driver.nom ?? ''}`.trim() || t('deliveryUi.defaultDriverName', 'Livreur') : t('deliveryUi.defaultDriverName', 'Livreur');
  const resolvedPhoto = resolveMediaUrl(driver?.photo_profil);
  const initials = getInitials(driverName) || 'LV';
  const isOnline = driver?.statut_disponibilite === 'disponible';

  const items = [
    { label: t('deliveryUi.home', 'Accueil'), icon: Home, path: '/delivery/(tabs)' },
    { label: t('deliveryUi.myMissions', 'Mes missions'), icon: ListChecks, path: '/delivery/(tabs)/missions' },
    { label: t('deliveryUi.myRevenueDrawer', 'Mes revenus'), icon: Wallet, path: '/delivery/(tabs)/revenue' },
    { label: t('deliveryUi.myProfileDrawer', 'Mon profil'), icon: UserRound, path: '/delivery/(tabs)/profile' },
    { label: t('deliveryUi.helpSupport', 'Aide et support'), icon: Headphones, path: '/delivery/support' },
  ] as const;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.drawerRoot}>
        <Animated.View entering={FadeIn.duration(180)} style={styles.drawerBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View entering={SlideInLeft.duration(280).springify()} style={[styles.drawer, { backgroundColor: colors.surface }]}>
          <View style={[styles.drawerBrand, { backgroundColor: colors.primary }]}>
            <View style={styles.drawerBrandMark}><Text style={[styles.drawerBrandMarkText, { color: colors.primary }]}>Z</Text></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.drawerBrandTitle}>Zando na Ndako</Text>
              <Text style={styles.drawerBrandSub}>{t('deliveryUi.driverSpace', 'Espace livreur')}</Text>
            </View>
            <Pressable accessibilityLabel={t('deliveryUi.closeMenu', 'Fermer le menu')} onPress={onClose} style={styles.drawerClose}>
              <X color="#FFF" size={20} />
            </Pressable>
          </View>
          <View style={[styles.drawerProfile, { borderBottomColor: colors.border }]}>
            {resolvedPhoto ? (
              <Image source={{ uri: resolvedPhoto }} contentFit="cover" style={[styles.drawerAvatar, { backgroundColor: colors.primarySoft }]} />
            ) : (
              <View style={[styles.drawerAvatarFallback, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.drawerAvatarText, { color: colors.primary }]}>{initials}</Text>
              </View>
            )}
            <View>
              <Text style={[styles.drawerName, { color: colors.text }]}>{driverName}</Text>
              <View style={styles.drawerOnline}>
                <View style={[styles.onlineDot, { backgroundColor: isOnline ? colors.fresh : colors.textTertiary }]} />
                <Text style={[styles.drawerOnlineText, { color: isOnline ? colors.fresh : colors.textTertiary }]}>{isOnline ? t('deliveryUi.online', 'En ligne') : t('deliveryUi.offline', 'Hors ligne')}</Text>
              </View>
            </View>
          </View>
          <View style={styles.drawerSection}>
            <Text style={[styles.drawerSectionLabel, { color: colors.textTertiary }]}>{t('deliveryUi.navigationSection', 'NAVIGATION')}</Text>
            {items.map(({ label, icon: Icon, path }) => (
              <Pressable key={label} accessibilityLabel={label} onPress={() => { onClose(); router.push(path as any); }} style={styles.drawerItem}>
                <Icon color={colors.primary} size={21} strokeWidth={2.3} />
                <Text style={[styles.drawerItemText, { color: colors.text }]}>{label}</Text>
                <ChevronRight color={colors.textTertiary} size={18} />
              </Pressable>
            ))}
          </View>
          <View style={styles.drawerSection}>
            <Text style={[styles.drawerSectionLabel, { color: colors.textTertiary }]}>{t('deliveryUi.actionsSection', 'ACTIONS')}</Text>
            <Pressable accessibilityLabel={t('deliveryUi.reportProblem', 'Signaler un problème')} onPress={() => { onClose(); router.push('/delivery/problem' as any); }} style={styles.drawerItem}>
              <AlertTriangle color={colors.error} size={21} />
              <Text style={[styles.drawerItemText, { color: colors.text }]}>{t('deliveryUi.reportProblem', 'Signaler un problème')}</Text>
              <ChevronRight color={colors.textTertiary} size={18} />
            </Pressable>
            <Pressable accessibilityLabel={t('deliveryUi.logout', 'Se déconnecter')} onPress={() => { onClose(); router.push('/delivery/logout' as any); }} style={styles.drawerItem}>
              <LogOut color={colors.error} size={21} />
              <Text style={[styles.drawerItemText, { color: colors.error }]}>{t('deliveryUi.logout', 'Se déconnecter')}</Text>
            </Pressable>
          </View>
          <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
            <Settings color={colors.textTertiary} size={16} />
            <Text style={[styles.drawerFooterText, { color: colors.textTertiary }]}>{t('deliveryUi.versionPrefix', 'Version')} 1.0.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function DriverTop({ onBell, showThemeToggle = false }: { onBell?: () => void; showThemeToggle?: boolean }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { driver } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const driverName = driver ? `${driver.prenom ?? ''} ${driver.nom ?? ''}`.trim() || t('deliveryUi.defaultDriverName', 'Livreur') : t('deliveryUi.defaultDriverName', 'Livreur');
  const isOnline = driver?.statut_disponibilite === 'disponible';

  return (
    <>
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('deliveryUi.openMenu', 'Ouvrir le menu livreur')} onPress={() => setDrawerOpen(true)} style={[styles.menuButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Menu color={colors.primary} size={24} strokeWidth={2.4} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>{t('deliveryUi.dashboardEyebrow', 'TABLEAU DE BORD')}</Text>
          <Text style={[styles.headerTitle, { fontSize: 20, color: colors.text }]} numberOfLines={1}>{t('deliveryUi.greeting', 'Bonjour')}, {driverName}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: isOnline ? colors.freshSoft : colors.backgroundAlt }]}>
          <View style={[styles.onlineDot, { backgroundColor: isOnline ? colors.fresh : colors.textTertiary }]} />
          <Text style={[styles.badgeText, { color: isOnline ? colors.fresh : colors.textTertiary }]}>{isOnline ? t('deliveryUi.online', 'En ligne') : t('deliveryUi.offline', 'Hors ligne')}</Text>
        </View>
        {showThemeToggle ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <LanguageToggle />
            <ThemeToggle />
          </View>
        ) : null}
        <Pressable onPress={onBell ?? (() => router.push('/delivery/notifications' as any))} style={styles.bell} hitSlop={8}>
          <Bell color={colors.primary} size={24} />
        </Pressable>
      </View>
      <DeliveryDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

// ─── Availability Toggle (En ligne / Hors ligne) ───
export function AvailabilityToggle() {
  const { isAvailable, availabilityLoading, toggleAvailability } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={isAvailable ? t('deliveryUi.goOfflineAria', 'Passer hors ligne') : t('deliveryUi.goOnlineAria', 'Passer en ligne')}
      onPress={toggleAvailability}
      disabled={availabilityLoading}
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 999, paddingLeft: 12, paddingRight: 5, paddingVertical: 5, borderWidth: 1.5 },
        isAvailable
          ? { backgroundColor: colors.freshSoft, borderColor: colors.fresh + '66' }
          : { backgroundColor: colors.backgroundAlt, borderColor: colors.border },
      ]}
    >
      <View style={[styles.onlineDot, { width: 10, height: 10, borderRadius: 5, backgroundColor: isAvailable ? colors.fresh : colors.textTertiary }]} />
      <Text style={{ color: isAvailable ? colors.fresh : colors.textTertiary, fontSize: 13, fontWeight: '900' }}>
        {isAvailable ? t('deliveryUi.online', 'En ligne') : t('deliveryUi.offline', 'Hors ligne')}
      </Text>
      <View
        style={{
          width: 38, height: 26, borderRadius: 13,
          backgroundColor: isAvailable ? colors.fresh : colors.borderStrong,
          alignItems: isAvailable ? 'flex-end' : 'flex-start', justifyContent: 'center', paddingHorizontal: 3,
        }}
      >
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' }} />
      </View>
    </Pressable>
  );
}

export const deliveryStyles = StyleSheet.create({
  routeCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  routeBanner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  routeBannerIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.18)', alignItems: 'center', justifyContent: 'center' },
  routeBannerValue: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  routeBannerSub: { color: 'rgba(255,255,255,.85)', fontSize: 12, fontWeight: '700', marginTop: 2 },
  filter: { flex: 1, minHeight: 45, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterActive: { borderColor: D.orange },
  filterText: { fontSize: 13, fontWeight: '800' },
  filterTextActive: { color: '#FFF' },
  listIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  timelineDotBlue: { width: 12, height: 12, borderRadius: 6, backgroundColor: Palette.navy },
  timelineDotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: Palette.fresh },
  timelineLine: { width: 2, height: 54 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  navGroup: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  navIndicator: { position: 'absolute', bottom: -8, width: 6, height: 6, borderRadius: 3 },
  centerFab: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginTop: -26, borderWidth: 5, shadowOpacity: .28, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 8 },
  trendPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 11, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  trendText: { fontSize: 10, fontWeight: '900' },
  quickTitle: { fontSize: 13, fontWeight: '900', marginTop: 22 },
  quickAction: { width: '18.5%', minHeight: 80, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, shadowOpacity: .045, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  quickLabel: { textAlign: 'center', fontSize: 10, lineHeight: 13, fontWeight: '800', marginTop: 7 },
});
