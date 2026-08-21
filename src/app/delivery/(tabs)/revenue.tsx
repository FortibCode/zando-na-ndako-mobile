import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowUpRight, Banknote, Bike, History, TrendingUp, Wallet } from 'lucide-react-native';
import { Card, D, DeliveryScreen, deliveryStyles, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { RevenueSkeleton } from '@/components/delivery/skeleton-loader';
import { EmptyRevenue } from '@/components/delivery/empty-states';
import { DeliveryErrorState } from '@/components/delivery/error-boundary';

export default function Revenue() {
  const { revenue, revenueLoading, revenueError, fetchRevenue } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const PERIODS = [
    t('deliveryRevenueTab.periodDay', 'Jour'),
    t('deliveryRevenueTab.periodWeek', 'Semaine'),
    t('deliveryRevenueTab.periodMonth', 'Mois'),
  ];

  const [period, setPeriod] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRevenue();
    setRefreshing(false);
  }, [fetchRevenue]);

  if (revenueLoading && !revenue && !refreshing) {
    return (
      <DeliveryScreen>
        <RevenueSkeleton />
      </DeliveryScreen>
    );
  }

  if (revenueError && !revenue) {
    return (
      <DeliveryScreen>
        <DeliveryErrorState message={revenueError} onRetry={() => fetchRevenue()} />
      </DeliveryScreen>
    );
  }

const historique = revenue?.historique ?? [];

  // Les 3 périodes sont réellement renvoyées par le backend (revenus par jour/semaine/mois) —
  // on n'invente plus de chiffres statiques pour "Jour" et "Semaine".
  const periodStats = [
    { remuneration: revenue?.jour?.remuneration ?? 0, nb_livraisons: revenue?.jour?.nb_livraisons ?? 0, distance_totale_km: revenue?.jour?.distance_totale_km ?? 0 },
    { remuneration: revenue?.semaine?.remuneration ?? 0, nb_livraisons: revenue?.semaine?.nb_livraisons ?? 0, distance_totale_km: revenue?.semaine?.distance_totale_km ?? 0 },
    { remuneration: revenue?.mois_stat?.remuneration ?? revenue?.remuneration ?? 0, nb_livraisons: revenue?.mois_stat?.nb_livraisons ?? revenue?.nb_livraisons ?? 0, distance_totale_km: revenue?.mois_stat?.distance_totale_km ?? revenue?.distance_totale_km ?? 0 },
  ];
  const current = periodStats[period];
  const solde = current.remuneration;
  const nbLivraisons = current.nb_livraisons;
  const gainMoyen = nbLivraisons > 0 ? Math.round(solde / nbLivraisons) : 0;

  const revenus7Jours = revenue?.revenus_7_jours ?? [];
  const max7JoursRevenue = Math.max(...revenus7Jours.map((d) => d.montant), 1);

  return (
    <DeliveryScreen refreshing={refreshing} onRefresh={onRefresh}>
      <Animated.View entering={FadeInDown.duration(350).springify()} style={{ marginTop: 12, marginBottom: 16 }}>
        <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>{t('deliveryRevenueTab.eyebrow', 'VOTRE PERFORMANCE')}</Text>
        <Text style={[styles.headerTitle, { fontSize: 22, marginTop: 2, color: colors.text }]}>{t('deliveryRevenueTab.title', 'Mes revenus')}</Text>
        <Text style={[styles.muted, { fontSize: 13, marginTop: 4, color: colors.textSecondary }]}>{t('deliveryRevenueTab.subtitle', 'Une vue claire de vos gains.')}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(30).springify()}>
        <Pressable
          onPress={() => router.push('/delivery/withdraw' as any)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.freshSoft, borderRadius: 16, padding: 14, marginBottom: 14 }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: colors.fresh, alignItems: 'center', justifyContent: 'center' }}>
            <Wallet color="#FFF" size={19} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: colors.fresh, letterSpacing: .4 }}>{t('deliveryRevenueTab.availableBalance', 'SOLDE DISPONIBLE')}</Text>
            <Text style={[styles.sectionTitle, { fontSize: 18, marginTop: 2, color: colors.text }]}>{(revenue?.solde_disponible ?? 0).toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <Text style={{ color: colors.fresh, fontSize: 12, fontWeight: '900' }}>{t('deliveryRevenueTab.withdraw', 'Retirer ›')}</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(60).springify()} style={{ flexDirection: 'row', gap: 8 }}>
        {PERIODS.map((x, i) => (
          <Pressable
            key={x}
            onPress={() => setPeriod(i)}
            style={[deliveryStyles.filter, { flex: 1, borderColor: colors.border }, i === period && [deliveryStyles.filterActive, { backgroundColor: colors.primary, borderColor: colors.primary }]]}
          >
            <Text style={[deliveryStyles.filterText, { color: i === period ? '#FFF' : colors.textSecondary }, i === period && deliveryStyles.filterTextActive]}>{x}</Text>
          </Pressable>
        ))}
      </Animated.View>

      <Card index={1} style={{ marginTop: 16, backgroundColor: D.blue, borderColor: D.blue, padding: 18, borderRadius: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#BBD0FF', fontSize: 11, fontWeight: '900', letterSpacing: .7 }}>{t('deliveryRevenueTab.revenueOfPrefix', 'REVENU DU')} {PERIODS[period].toUpperCase()}</Text>
          <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center' }}>
            <Banknote color="#FFF" size={18} />
          </View>
        </View>
        <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 12 }}>{solde.toLocaleString('fr-FR')} FCFA</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
          <TrendingUp color="#9BE7B7" size={15} />
          <Text style={{ color: '#C9F4D8', fontWeight: '800', fontSize: 12 }}>{nbLivraisons} {nbLivraisons > 1 ? t('deliveryRevenueTab.deliveryWordPlural', 'livraisons') : t('deliveryRevenueTab.deliveryWord', 'livraison')} {t('deliveryRevenueTab.thisPeriodSuffix', 'cette période')}</Text>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Card index={2} style={{ flex: 1, padding: 15 }}>
          <Bike color={colors.primary} size={20} />
          <Text style={[styles.big, { fontSize: 25, marginTop: 12, color: colors.text }]}>{nbLivraisons}</Text>
          <Text style={[styles.muted, { fontSize: 12, color: colors.textSecondary }]}>{t('deliveryRevenueTab.deliveries', 'Livraisons')}</Text>
        </Card>
        <Card index={2} style={{ flex: 1, padding: 15 }}>
          <ArrowUpRight color={colors.fresh} size={20} />
          <Text style={[styles.big, { fontSize: 25, marginTop: 12, color: colors.text }]}>
            {current.distance_totale_km ? `${Math.round(current.distance_totale_km)}km` : '--'}
          </Text>
          <Text style={[styles.muted, { fontSize: 12, color: colors.textSecondary }]}>{t('deliveryRevenueTab.distance', 'Distance')}</Text>
        </Card>
        <Card index={2} style={{ flex: 1, padding: 15 }}>
          <Banknote color={colors.primary} size={20} />
          <Text style={[styles.big, { fontSize: 25, marginTop: 12, color: colors.text }]}>{gainMoyen.toLocaleString('fr-FR')}</Text>
          <Text style={[styles.muted, { fontSize: 12, color: colors.textSecondary }]}>{t('deliveryRevenueTab.avgGain', 'Gain moyen')}</Text>
        </Card>
      </View>

      {/* Graphique des 7 derniers jours — un point par jour, données réelles */}
      <Text style={[styles.sectionTitle, { marginTop: 32, marginBottom: 14, color: colors.text }]}>{t('deliveryRevenueTab.last7Days', '7 derniers jours')}</Text>
      <Card index={3} style={{ padding: 18 }}>
        {revenus7Jours.length > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 130 }}>
            {revenus7Jours.map((day, i) => {
              const barHeight = Math.max(Math.round((day.montant / max7JoursRevenue) * 90), day.montant > 0 ? 6 : 2);
              const isToday = i === revenus7Jours.length - 1;
              return (
                <View key={`${day.jour}-${i}`} style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', marginBottom: 6 }}>
                    {day.montant >= 1000 ? `${Math.round(day.montant / 1000)}k` : day.montant}
                  </Text>
                  <View style={{ height: 90, justifyContent: 'flex-end', width: '60%' }}>
                    <View style={{ height: barHeight, borderRadius: 6, backgroundColor: isToday ? colors.primary : colors.primarySoft }} />
                  </View>
                  <Text style={{ color: isToday ? colors.primary : colors.textSecondary, fontSize: 11, fontWeight: '800', marginTop: 8 }}>{day.jour}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.muted, { textAlign: 'center', color: colors.textSecondary }]}>{t('deliveryRevenueTab.noWeekData', 'Pas encore de livraisons cette semaine.')}</Text>
        )}
      </Card>

      <Text style={[styles.sectionTitle, { marginTop: 32, marginBottom: 14, color: colors.text }]}>{t('deliveryRevenueTab.recentHistory', 'Historique récent')}</Text>

      {historique.length === 0 ? (
        <EmptyRevenue />
      ) : (
        historique.slice(0, 10).map((item, i) => (
          <Card key={item.id} index={Math.min(i, 5)} style={{ marginBottom: 10, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{item.numero_commande}</Text>
              <Text style={[styles.muted, { marginTop: 6, fontSize: 13, color: colors.textSecondary }]}>
                {new Date(item.date_livraison ?? item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}  •  {t('deliveryRevenueTab.deliverySuffix', 'Livraison')} {item.statut === 'terminee' ? t('deliveryRevenueTab.deliveredWord', 'terminée') : t('deliveryRevenueTab.ongoingWord', 'en cours')}
              </Text>
            </View>
            <Text style={{ color: colors.fresh, fontSize: 17, fontWeight: '900' }}>
              +{item.montant.toLocaleString('fr-FR')} FCFA
            </Text>
          </Card>
        ))
      )}

      <Pressable
        onPress={() => router.push('/delivery/history' as any)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface }}
      >
        <History color={colors.primary} size={20} />
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '900' }}>{t('deliveryRevenueTab.viewFullHistory', "Voir tout l'historique")}</Text>
      </Pressable>
    </DeliveryScreen>
  );
}
