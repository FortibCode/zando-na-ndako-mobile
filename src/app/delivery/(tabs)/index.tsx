import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowUpRight, Bike, CheckCircle2, ChevronRight, Headphones, History, FileText, Navigation, Package, ShieldAlert, Power } from 'lucide-react-native';
import { Card, DeliveryScreen, DriverTop, PrimaryButton, deliveryStyles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { DashboardSkeleton } from '@/components/delivery/skeleton-loader';
import { DeliveryErrorState } from '@/components/delivery/error-boundary';

const driverImage = require('@/assets/images/onboarding-delivery.png');

export default function DeliveryHome() {
  const { driver, dashboard, dashboardLoading, dashboardError, fetchDashboard, missions, fetchMissions, isAvailable, availabilityLoading, toggleAvailability } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchMissions();
  }, [fetchDashboard, fetchMissions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboard(), fetchMissions()]);
    setRefreshing(false);
  }, [fetchDashboard, fetchMissions]);

  const quickActions = [
    { label: t('deliveryHome.navGps', 'Itinéraire\nGPS'), icon: Navigation, path: '/delivery/navigation' },
    { label: t('deliveryHome.navMissions', 'Mes\nmissions'), icon: Bike, path: '/delivery/(tabs)/missions' },
    { label: t('deliveryHome.navHistory', 'Historique'), icon: History, path: '/delivery/history' },
    { label: t('deliveryHome.navDocuments', 'Mes\ndocuments'), icon: FileText, path: '/delivery/documents' },
    { label: t('deliveryHome.navSupport', 'Support\n24/7'), icon: Headphones, path: '/delivery/support' },
  ];

  if (dashboardLoading && !dashboard && !refreshing) {
    return (
      <DeliveryScreen>
        <DriverTop onBell={() => router.push('/delivery/notifications' as any)} showThemeToggle />
        <DashboardSkeleton />
      </DeliveryScreen>
    );
  }

  if (dashboardError && !dashboard) {
    return (
      <DeliveryScreen>
        <DriverTop onBell={() => router.push('/delivery/notifications' as any)} showThemeToggle />
        <DeliveryErrorState message={dashboardError} onRetry={fetchDashboard} />
      </DeliveryScreen>
    );
  }

  const revenuJour = dashboard?.revenu_jour ?? 0;
  const missionsEnCours = dashboard?.missions_en_cours ?? 0;
  const missionsLivrees = dashboard?.missions_livrees ?? 0;
  const missionsAujourdhui = dashboard?.missions_aujourd_hui ?? 0;
  const isValide = driver?.statut_validation === 'valide';
  const missionsDisponibles = missions.length;

  return (
    <DeliveryScreen refreshing={refreshing} onRefresh={onRefresh}>
      <DriverTop onBell={() => router.push('/delivery/notifications' as any)} showThemeToggle />

      {/* Availability Toggle */}
      <Animated.View entering={FadeInDown.duration(350).springify()}>
        <Pressable
          onPress={toggleAvailability}
          disabled={availabilityLoading}
          style={[
            styles.availBar,
            { backgroundColor: isAvailable ? colors.freshSoft : colors.backgroundAlt },
          ]}
        >
          <View style={[styles.availDot, { backgroundColor: isAvailable ? colors.fresh : colors.textTertiary }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.availTitle, { color: colors.text }]}>
              {isAvailable ? t('deliveryHome.onlineTitle', 'Vous êtes en ligne') : t('deliveryHome.offlineTitle', 'Vous êtes hors ligne')}
            </Text>
            <Text style={[styles.availSub, { color: colors.textSecondary }]}>
              {isAvailable ? t('deliveryHome.onlineSub', 'Vous recevez les nouvelles missions en temps réel') : t('deliveryHome.offlineSub', 'Activez pour recevoir des missions')}
            </Text>
          </View>
          <View style={[styles.availBtn, { backgroundColor: isAvailable ? colors.fresh : colors.textTertiary }]}>
            <Power color="#FFF" size={18} />
          </View>
        </Pressable>
      </Animated.View>

      {/* Hero Banner */}
      <Animated.View entering={FadeInUp.duration(400).delay(60).springify()} style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.heroCopy}>
          <View style={styles.heroPill}>
            <Text style={styles.heroPillText}>{t('deliveryHome.performancesPill', 'VOS PERFORMANCES')}</Text>
          </View>
          <Text style={styles.heroTitle}>
            {t('deliveryHome.heroTitle', 'Une belle journée\npour livrer.')}
          </Text>
          <View style={styles.heroVerified}>
            {isValide ? <CheckCircle2 color="#B4F1C9" size={18} /> : <ShieldAlert color="#FFD18A" size={18} />}
            <View>
              <Text style={styles.heroVerifiedTitle}>{isValide ? t('deliveryHome.verifiedProfile', 'Profil vérifié') : t('deliveryHome.pendingValidation', 'Validation en attente')}</Text>
              <Text style={styles.heroVerifiedSub}>{missionsLivrees} {missionsLivrees > 1 ? t('deliveryHome.deliveryWordPlural', 'livraisons') : t('deliveryHome.deliveryWord', 'livraison')} {missionsLivrees > 1 ? t('deliveryHome.doneWordPlural', 'effectuées') : t('deliveryHome.doneWord', 'effectuée')}</Text>
            </View>
          </View>
        </View>
        <Image source={driverImage} contentFit="cover" style={styles.heroImage} />
      </Animated.View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <Card index={1} style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('deliveryHome.revenueTodayLabel', 'REVENU DU JOUR')}</Text>
            <ArrowUpRight color={colors.fresh} size={18} />
          </View>
          <Text style={[styles.big, { color: colors.text, fontSize: 29, marginTop: 13 }]}>{revenuJour.toLocaleString('fr-FR')}</Text>
          <Text style={[styles.muted, { color: colors.textSecondary, fontSize: 13, marginTop: 2 }]}>FCFA</Text>
          <View style={deliveryStyles.trendPill}>
            <ArrowUpRight color={colors.primary} size={15} strokeWidth={3} />
            <Text style={[deliveryStyles.trendText, { color: colors.primary }]}>{missionsAujourdhui} {t('deliveryHome.todaySuffix', "aujourd'hui")}</Text>
          </View>
        </Card>
        <Card index={2} style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('deliveryHome.ongoingLabel', 'EN COURS')}</Text>
            <Bike color={colors.fresh} size={18} />
          </View>
          <Text style={[styles.big, { color: colors.text, fontSize: 29, marginTop: 13 }]}>{missionsEnCours}</Text>
          <Text style={[styles.muted, { color: colors.textSecondary, fontSize: 13, marginTop: 2 }]}>{missionsEnCours > 1 ? t('deliveryHome.missionWordPlural', 'missions') : t('deliveryHome.missionWord', 'mission')}</Text>
          <View style={[deliveryStyles.trendPill, { backgroundColor: colors.freshSoft }]}>
            <CheckCircle2 color={colors.fresh} size={15} strokeWidth={3} />
            <Text style={[deliveryStyles.trendText, { color: colors.fresh }]}>{missionsLivrees} {t('deliveryHome.deliveredThisMonth', 'livrées ce mois')}</Text>
          </View>
        </Card>
      </View>

      {/* Missions disponibles */}
      <Card index={3} style={[styles.missionCard, { backgroundColor: colors.surface }]}>
        <View style={styles.missionHead}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('deliveryHome.missionsAvailableLabel', 'MISSIONS DISPONIBLES')}</Text>
            <Text style={[styles.muted, { color: colors.textSecondary, fontSize: 14, marginTop: 5 }]}>
              {missionsDisponibles > 0
                ? `${missionsDisponibles} ${missionsDisponibles > 1 ? t('deliveryHome.orderWordPlural', 'commandes') : t('deliveryHome.orderWord', 'commande')} ${t('deliveryHome.waitingForDriverSuffix', "en attente d'un livreur")}`
                : isAvailable ? t('deliveryHome.noMissionsNow', 'Aucune mission pour le moment') : t('deliveryHome.goOnlineToReceive', 'Passez en ligne pour recevoir des missions')}
            </Text>
          </View>
          <View style={[styles.missionPill, { backgroundColor: missionsDisponibles > 0 ? colors.freshSoft : colors.backgroundAlt }]}>
            <Package color={missionsDisponibles > 0 ? colors.fresh : colors.textTertiary} size={16} />
            <Text style={[styles.missionPillText, { color: missionsDisponibles > 0 ? colors.fresh : colors.textTertiary }]}>{missionsDisponibles}</Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
          <PrimaryButton onPress={() => router.push(missionsDisponibles > 0 ? '/delivery/mission' as any : '/delivery/(tabs)/missions' as any)}>
            {missionsDisponibles > 0 ? t('deliveryHome.viewAvailableMission', 'Voir la mission disponible') : t('deliveryHome.viewMyMissions', 'Voir mes missions')} <ChevronRight color="#FFF" size={18} />
          </PrimaryButton>
        </View>
      </Card>

      {/* Quick Actions */}
      <Animated.View entering={FadeInUp.duration(400).delay(220).springify()}>
        <Text style={[deliveryStyles.quickTitle, { color: colors.text }]}>{t('deliveryHome.quickActionsTitle', 'ACTIONS RAPIDES')}</Text>
        <View style={styles.quickRow}>
          {quickActions.map(({ label, icon: Icon, path }) => (
            <Pressable
              key={label}
              onPress={() => router.push(path as any)}
              style={[deliveryStyles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Icon color={colors.primary} size={22} />
              <Text style={[deliveryStyles.quickLabel, { color: colors.text }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </DeliveryScreen>
  );
}

const styles = StyleSheet.create({
  availBar: { borderRadius: 18, padding: 16, marginTop: 14, flexDirection: 'row', alignItems: 'center' },
  availDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  availTitle: { fontSize: 16, fontWeight: '900' },
  availSub: { fontSize: 12, marginTop: 3, fontWeight: '600' },
  availBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  hero: { height: 226, borderRadius: 28, overflow: 'hidden', marginTop: 10, flexDirection: 'row' },
  heroCopy: { padding: 21, flex: 1, zIndex: 2 },
  heroPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,.15)', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 },
  heroPillText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.7 },
  heroTitle: { color: '#FFF', fontSize: 27, lineHeight: 32, fontWeight: '900', marginTop: 15 },
  heroVerified: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 7 },
  heroVerifiedTitle: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  heroVerifiedSub: { color: '#C8DBFF', fontSize: 11, marginTop: 2 },
  heroImage: { position: 'absolute', right: -17, bottom: -48, width: 285, height: 300, opacity: 0.96 },

  statsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statCard: { flex: 1, padding: 16 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 11, fontWeight: '900' },
  big: { fontWeight: '900' },
  muted: { fontWeight: '600' },

  missionCard: { marginTop: 16, padding: 0, overflow: 'hidden' },
  missionHead: { padding: 18, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  missionPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  missionPillText: { fontWeight: '900', fontSize: 13 },

  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 },
});
