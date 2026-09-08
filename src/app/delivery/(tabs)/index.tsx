import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowUpRight, Bike, CheckCircle2, ChevronRight, Headphones, History, FileText, Navigation, Package, Power, ShieldAlert, Star, Store, UserRound, Wallet } from 'lucide-react-native';
import { Card, DeliveryScreen, DriverTopSmart, PrimaryButton, StatusPill, deliveryStyles, monoLabel, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { alert } from '@/contexts/alert-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { DashboardSkeleton } from '@/components/delivery/skeleton-loader';
import { DeliveryErrorState } from '@/components/delivery/error-boundary';
import { resolveMediaUrl } from '@/services/api';

export default function DeliveryHome() {
  const { driver, dashboard, dashboardLoading, dashboardError, fetchDashboard, missions, fetchMissions, isAvailable, availabilityLoading, toggleAvailability, acceptMission, currentMission } = useDelivery();
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

  const handleToggleAvailability = useCallback(async () => {
    try {
      await toggleAvailability();
    } catch (err: any) {
      alert('Erreur', err?.message || 'Impossible de mettre à jour votre disponibilité. Vérifiez votre connexion.');
    }
  }, [toggleAvailability]);

  if (dashboardLoading && !dashboard && !refreshing) {
    return (
      <DeliveryScreen>
        <DashboardSkeleton />
      </DeliveryScreen>
    );
  }

  if (dashboardError && !dashboard) {
    return (
      <DeliveryScreen>
        <DeliveryErrorState message={dashboardError} onRetry={fetchDashboard} />
      </DeliveryScreen>
    );
  }

  const driverName = driver ? `${driver.prenom ?? ''} ${driver.nom ?? ''}`.trim() || 'Livreur' : 'Livreur';
  const avatarUrl = resolveMediaUrl(driver?.photo_profil);
  const revenuJour = dashboard?.revenu_jour ?? 0;
  const missionsEnCours = dashboard?.missions_en_cours ?? 0;
  const missionsLivrees = dashboard?.missions_livrees ?? 0;
  const missionsAujourdhui = dashboard?.missions_aujourd_hui ?? 0;
  const isValide = driver?.statut_validation === 'valide';
  const missionsDisponibles = missions.length;
  const noteLivraison = driver?.note_moyenne ? String(driver.note_moyenne) : '4.9';

  const quickActions = [
    { label: t('deliveryHome.navGps', 'GPS Navigation'), icon: Navigation, path: '/delivery/navigation', color: '#0EA5E9', bg: '#E0F2FE' },
    { label: t('deliveryHome.navMissions', 'Mes missions'), icon: Bike, path: '/delivery/missions', color: '#6366F1', bg: '#EEF2FF' },
    { label: t('deliveryHome.navHistory', 'Historique'), icon: History, path: '/delivery/history', color: '#10B981', bg: '#D1FAE5' },
    { label: t('deliveryHome.navSupport', 'Support 24/7'), icon: Headphones, path: '/delivery/support', color: '#EC4899', bg: '#FCE7F3' },
  ];

  const handleQuickAction = useCallback((path: string) => {
    if (path === '/delivery/navigation' && !currentMission) {
      router.push('/delivery/missions' as any);
      return;
    }
    router.push(path as any);
  }, [currentMission]);

  return (
    <DeliveryScreen refreshing={refreshing} onRefresh={onRefresh} tabBar>
      {/* 1. En-tête Équilibré (Avatar + Greeting + Statut En Ligne + Cloche) */}
      <DriverTopSmart
        driverName={driverName}
        avatarUrl={avatarUrl}
        isOnline={isAvailable}
        onToggleOnline={toggleAvailability}
      />

      {/* 2. Hero Card Principal (Bleu Nuit Deep Zando) */}
      <Animated.View entering={FadeInUp.duration(400).delay(40).springify()} style={{ backgroundColor: colors.primaryDeep, borderRadius: 20, padding: 18, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,.16)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }}>ESPACE LIVREUR ZANDO</Text>
          </View>

          {isValide ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(52, 211, 153, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
              <CheckCircle2 color="#34D399" size={13} strokeWidth={2.5} />
              <Text style={{ color: '#A7F3D0', fontSize: 11, fontWeight: '800' }}>Vérifié</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
              <ShieldAlert color="#FBBF24" size={13} strokeWidth={2.5} />
              <Text style={{ color: '#FDE68A', fontSize: 11, fontWeight: '800' }}>Validation</Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 10 }}>
          <Text style={{ flex: 1, color: '#FFF', fontSize: 19, fontWeight: '900', lineHeight: 25 }}>
            {isAvailable ? 'Prêt pour recevoir des courses.' : 'Vous êtes actuellement hors ligne.'}
          </Text>

          <Pressable
            onPress={handleToggleAvailability}
            disabled={availabilityLoading}
            style={{
              borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12, flexDirection: 'row',
              alignItems: 'center', justifyContent: 'center', gap: 5, opacity: availabilityLoading ? 0.7 : 1,
              backgroundColor: isAvailable ? 'rgba(255,255,255,0.14)' : colors.fresh,
            }}
          >
            {availabilityLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Power color="#FFF" size={12} strokeWidth={2.6} />
            )}
            <Text style={{ color: '#FFF', fontSize: 11.5, fontWeight: '900' }}>
              {availabilityLoading ? '…' : isAvailable ? 'Hors ligne' : 'En ligne'}
            </Text>
          </Pressable>
        </View>

        {/* 3 Colonnes de Performances */}
        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', marginTop: 14, paddingTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#C8DBFF', fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase' }}>Revenu du jour</Text>
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900', marginTop: 2 }}>{revenuJour.toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <View style={{ width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: '#C8DBFF', fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase' }}>Courses</Text>
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900', marginTop: 2 }}>{missionsAujourdhui > 0 ? missionsAujourdhui : missionsLivrees}</Text>
          </View>
          <View style={{ width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ color: '#C8DBFF', fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase' }}>Note</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Star color="#FBBF24" fill="#FBBF24" size={13} />
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900' }}>{noteLivraison}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* 3. Section Missions Disponibles (Cartes de livraison complètes) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>
            Missions en attente
          </Text>
          <View style={{ backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900' }}>{missionsDisponibles}</Text>
          </View>
        </View>

        <Pressable onPress={() => router.push('/delivery/missions' as any)}>
          <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.primary }}>Voir tout ›</Text>
        </Pressable>
      </View>

      <Animated.View entering={FadeInUp.duration(400).delay(80).springify()}>
        {missionsDisponibles === 0 ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 22, alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 50, height: 50, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Bike color={colors.primary} size={26} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text, textAlign: 'center' }}>Aucune mission disponible</Text>
            <Text style={{ fontSize: 12.5, color: colors.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 18 }}>
              {isAvailable ? 'De nouvelles propositions de livraison apparaîtront automatiquement.' : 'Passez en ligne pour recevoir des courses dans votre zone.'}
            </Text>
          </View>
        ) : (
          missions.slice(0, 3).map((mission) => (
            <Card key={mission.id} style={{ marginBottom: 12, padding: 14, borderRadius: 18, backgroundColor: colors.surface }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[monoLabel, { fontSize: 14, color: colors.text }]}>
                  {mission.numero_commande || `#ZN${mission.id.slice(0, 6)}`}
                </Text>
                <StatusPill statut="disponible" />
              </View>

              {/* Chronologie Itinéraire Vendeur -> Client */}
              <View style={{ marginTop: 12, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Store color={colors.primary} size={15} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>Retrait (Vendeur)</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                      {mission.vendeur_nom || mission.vendeur_zone || 'Marché Zando'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.freshSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <UserRound color={colors.fresh} size={15} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: '600' }}>Livraison (Client)</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                      {mission.beneficiaire_nom || mission.client_nom || 'Client Zando'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Pied de carte avec distance et gain */}
              <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12, paddingTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  {mission.distance_km != null && (
                    <Text style={{ fontSize: 10.5, color: colors.textSecondary, fontWeight: '600' }}>Distance : {mission.distance_km} km</Text>
                  )}
                  <Text style={{ fontSize: 16, fontWeight: '900', color: colors.fresh, marginTop: 1 }}>
                    +{(mission.montant_livraison ?? mission.gain ?? 0).toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>

                <Pressable
                  onPress={() => acceptMission(mission.id).then(() => router.push('/delivery/mission' as any))}
                  style={{ backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}
                >
                  <Text style={{ color: '#FFF', fontSize: 12.5, fontWeight: '900' }}>Accepter ›</Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </Animated.View>

      {/* 4. Actions Rapides à 2 Colonnes */}
      <Animated.View entering={FadeInUp.duration(400).delay(120).springify()} style={{ marginTop: 6, marginBottom: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text, marginBottom: 10 }}>
          Raccourcis rapides
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {quickActions.map(({ label, icon: Icon, path, color, bg }) => (
            <Pressable
              key={label}
              onPress={() => handleQuickAction(path)}
              style={{
                width: '48.5%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon color={color} size={18} strokeWidth={2.2} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text, flex: 1 }} numberOfLines={1}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </DeliveryScreen>
  );
}

