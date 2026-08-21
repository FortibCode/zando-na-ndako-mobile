import { router } from 'expo-router';
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

      {/* Hero Banner avec statut de disponibilité et performances */}
      <Animated.View entering={FadeInUp.duration(400).delay(60).springify()} style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.heroCopy}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>{t('deliveryHome.performancesPill', 'ESPACE LIVREUR ZANDO')}</Text>
            </View>
            <Pressable
              onPress={toggleAvailability}
              disabled={availabilityLoading}
              style={[styles.miniAvailBtn, { backgroundColor: isAvailable ? '#B4F1C9' : 'rgba(255,255,255,0.2)' }]}
            >
              <View style={[styles.availDot, { backgroundColor: isAvailable ? '#059669' : '#FFF' }]} />
              <Text style={[styles.miniAvailText, { color: isAvailable ? '#065F46' : '#FFF' }]}>
                {isAvailable ? t('deliveryHome.onlineShort', 'En ligne') : t('deliveryHome.offlineShort', 'Hors ligne')}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.heroTitle}>
            {t('deliveryHome.heroTitle', 'Prêt pour vos livraisons.')}
          </Text>

          <View style={styles.heroVerified}>
            {isValide ? <CheckCircle2 color="#B4F1C9" size={16} /> : <ShieldAlert color="#FFD18A" size={16} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.heroVerifiedTitle}>{isValide ? t('deliveryHome.verifiedProfile', 'Profil vérifié') : t('deliveryHome.pendingValidation', 'Validation en attente')}</Text>
              <Text style={styles.heroVerifiedSub}>{missionsLivrees} {missionsLivrees > 1 ? t('deliveryHome.deliveryWordPlural', 'livraisons') : t('deliveryHome.deliveryWord', 'livraison')} {t('deliveryHome.doneWordPlural', 'effectuées')}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <Card index={1} style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('deliveryHome.revenueTodayLabel', 'REVENU DU JOUR')}</Text>
            <ArrowUpRight color={colors.fresh} size={16} />
          </View>
          <Text style={[styles.big, { color: colors.text, fontSize: 22, marginTop: 8 }]}>{revenuJour.toLocaleString('fr-FR')} <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>FCFA</Text></Text>
          <View style={deliveryStyles.trendPill}>
            <ArrowUpRight color={colors.primary} size={13} strokeWidth={3} />
            <Text style={[deliveryStyles.trendText, { color: colors.primary }]}>{missionsAujourdhui} {t('deliveryHome.todaySuffix', "aujourd'hui")}</Text>
          </View>
        </Card>
        <Card index={2} style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statHeader}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('deliveryHome.ongoingLabel', 'EN COURS')}</Text>
            <Bike color={colors.fresh} size={16} />
          </View>
          <Text style={[styles.big, { color: colors.text, fontSize: 22, marginTop: 8 }]}>{missionsEnCours} <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>{missionsEnCours > 1 ? t('deliveryHome.missionWordPlural', 'missions') : t('deliveryHome.missionWord', 'mission')}</Text></Text>
          <View style={[deliveryStyles.trendPill, { backgroundColor: colors.freshSoft }]}>
            <CheckCircle2 color={colors.fresh} size={13} strokeWidth={3} />
            <Text style={[deliveryStyles.trendText, { color: colors.fresh }]}>{missionsLivrees} {t('deliveryHome.deliveredThisMonth', 'ce mois')}</Text>
          </View>
        </Card>
      </View>

      {/* Missions disponibles */}
      <Card index={3} style={[styles.missionCard, { backgroundColor: colors.surface }]}>
        <View style={styles.missionHead}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('deliveryHome.missionsAvailableLabel', 'MISSIONS DISPONIBLES')}</Text>
            <Text style={[styles.muted, { color: colors.textSecondary, fontSize: 13, marginTop: 3 }]}>
              {missionsDisponibles > 0
                ? `${missionsDisponibles} ${missionsDisponibles > 1 ? t('deliveryHome.orderWordPlural', 'commandes') : t('deliveryHome.orderWord', 'commande')} ${t('deliveryHome.waitingForDriverSuffix', "en attente")}`
                : isAvailable ? t('deliveryHome.noMissionsNow', 'Aucune mission pour le moment') : t('deliveryHome.goOnlineToReceive', 'Passez en ligne pour recevoir des missions')}
            </Text>
          </View>
          <View style={[styles.missionPill, { backgroundColor: missionsDisponibles > 0 ? colors.freshSoft : colors.backgroundAlt }]}>
            <Package color={missionsDisponibles > 0 ? colors.fresh : colors.textTertiary} size={15} />
            <Text style={[styles.missionPillText, { color: missionsDisponibles > 0 ? colors.fresh : colors.textTertiary }]}>{missionsDisponibles}</Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <PrimaryButton onPress={() => router.push(missionsDisponibles > 0 ? '/delivery/mission' as any : '/delivery/(tabs)/missions' as any)}>
            {missionsDisponibles > 0 ? t('deliveryHome.viewAvailableMission', 'Voir la mission disponible') : t('deliveryHome.viewMyMissions', 'Voir mes missions')} <ChevronRight color="#FFF" size={16} />
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
              <Icon color={colors.primary} size={20} />
              <Text style={[deliveryStyles.quickLabel, { color: colors.text }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </DeliveryScreen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, overflow: 'hidden', marginTop: 12, padding: 18 },
  heroCopy: { flex: 1 },
  heroPill: { backgroundColor: 'rgba(255,255,255,.18)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  heroPillText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  miniAvailBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  availDot: { width: 7, height: 7, borderRadius: 4 },
  miniAvailText: { fontSize: 11, fontWeight: '900' },
  heroTitle: { color: '#FFF', fontSize: 21, lineHeight: 26, fontWeight: '900', marginTop: 12 },
  heroVerified: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  heroVerifiedTitle: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  heroVerifiedSub: { color: '#C8DBFF', fontSize: 11, marginTop: 1 },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statCard: { flex: 1, padding: 14 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  big: { fontWeight: '900' },
  muted: { fontWeight: '600' },

  missionCard: { marginTop: 12, padding: 0, overflow: 'hidden' },
  missionHead: { padding: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '900', letterSpacing: 0.2 },
  missionPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  missionPillText: { fontWeight: '900', fontSize: 12 },

  quickRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
});
