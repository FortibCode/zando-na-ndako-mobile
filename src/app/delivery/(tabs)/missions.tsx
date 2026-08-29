import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { Card, DeliveryScreen, StatusPill, TAB_BAR_CLEARANCE, deliveryStyles, monoLabel, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import type { RevenueTransaction } from '@/types/delivery';
import { MissionsSkeleton } from '@/components/delivery/skeleton-loader';
import { EmptyMissions } from '@/components/delivery/empty-states';
import { DeliveryErrorState } from '@/components/delivery/error-boundary';

export default function Missions() {
  // "Mes missions" recense les missions du livreur lui-même (acceptées / en cours / terminées /
  // échouées) — ça n'a rien à voir avec le pool des missions disponibles à accepter, qui vient de
  // `missions`/`fetchMissions`. On source donc cet écran depuis l'historique réel (`revenue`).
  const { revenue, revenueLoading, revenueError, fetchRevenue, currentMission } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const FILTER_KEYS = ['toutes', 'en_cours', 'terminee', 'echouee'] as const;
  const FILTER_LABELS: Record<typeof FILTER_KEYS[number], string> = {
    toutes: t('deliveryMissions.filterAll', 'Toutes'),
    en_cours: t('deliveryMissions.filterOngoing', 'En cours'),
    terminee: t('deliveryMissions.filterDone', 'Terminées'),
    echouee: t('deliveryMissions.filterCancelled', 'Annulées'),
  };

  const [filter, setFilter] = useState<typeof FILTER_KEYS[number]>('toutes');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRevenue();
    setRefreshing(false);
  }, [fetchRevenue]);

  const items: RevenueTransaction[] = useMemo(() => {
    const historique = revenue?.historique ?? [];
    // La mission en cours peut ne pas encore figurer dans l'historique (rafraîchi séparément) :
    // on l'ajoute en tête si elle n'y est pas déjà, pour ne jamais perdre la mission active de vue.
    if (currentMission?.livraison_id && !historique.some((h) => h.id === currentMission.livraison_id)) {
      return [
        {
          id: currentMission.livraison_id,
          numero_commande: currentMission.numero_commande,
          montant: currentMission.montant_livraison ?? 0,
          statut: 'en_cours' as const,
          created_at: currentMission.created_at,
          client_nom: currentMission.beneficiaire_nom ?? currentMission.client_nom,
          vendeur_nom: currentMission.vendeur_nom,
          distance_parcourue: currentMission.distance_km,
        },
        ...historique,
      ];
    }
    return historique;
  }, [revenue?.historique, currentMission]);

  const visibleMissions = items.filter((m) => {
    if (filter === 'toutes') return true;
    return m.statut === filter;
  });

  const renderMission = useCallback(({ item, index }: { item: RevenueTransaction; index: number }) => {
    const isEnCours = item.statut === 'en_cours';
    const date = item.date_livraison ?? item.created_at;

    const cardContent = (
      <Card index={Math.min(index, 5)} style={{ marginBottom: 10, padding: 14, borderRadius: 18, opacity: isEnCours ? 1 : 0.9 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[deliveryStyles.listIcon, { backgroundColor: isEnCours ? colors.primarySoft : colors.backgroundAlt }]}>
            <Package color={isEnCours ? colors.primary : colors.textSecondary} size={20} strokeWidth={2.2} />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[monoLabel, { fontSize: 14.5, color: colors.text }]}>{item.numero_commande}</Text>
            </View>
            <Text style={[styles.muted, { marginTop: 4, fontSize: 12, color: colors.textSecondary }]} numberOfLines={1}>
              {item.vendeur_nom ? `${item.vendeur_nom} • ` : ''}
              {date ? `${new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à ${new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : '—'}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <StatusPill statut={item.statut} />
            <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text }}>
              {item.montant.toLocaleString('fr-FR')} <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.textSecondary }}>FCFA</Text>
            </Text>
          </View>
        </View>
      </Card>
    );

    // Seule la mission active mène vers l'écran de détail
    if (!isEnCours || item.id !== currentMission?.livraison_id) return cardContent;
    return (
      <Pressable key={item.id} onPress={() => router.push('/delivery/mission' as any)}>
        {cardContent}
      </Pressable>
    );
  }, [colors, currentMission]);

  if (revenueLoading && items.length === 0 && !refreshing) {
    return (
      <DeliveryScreen>
        <MissionsSkeleton />
      </DeliveryScreen>
    );
  }

  if (revenueError && items.length === 0) {
    return (
      <DeliveryScreen>
        <DeliveryErrorState message={revenueError} onRetry={fetchRevenue} />
      </DeliveryScreen>
    );
  }

  const ListHeader = (
    <>
      <View style={{ marginTop: 10, marginBottom: 14 }}>
        <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>{t('deliveryMissions.eyebrow', 'VOTRE ACTIVITÉ')}</Text>
        <Text style={[styles.headerTitle, { fontSize: 22, marginTop: 2, color: colors.text }]}>{t('deliveryMissions.title', 'Mes missions')}</Text>
        <Text style={[styles.muted, { fontSize: 13, marginTop: 3, color: colors.textSecondary }]}>{t('deliveryMissions.subtitle', "Suivez chaque livraison en un coup d'œil.")}</Text>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTER_KEYS}
        keyExtractor={(x) => x}
        contentContainerStyle={{ gap: 8, marginBottom: 14 }}
        renderItem={({ item: x }) => (
          <Pressable
            onPress={() => setFilter(x)}
            style={[
              deliveryStyles.filter,
              { minWidth: 84, paddingHorizontal: 14, borderRadius: 999, borderColor: colors.border },
              filter === x && [deliveryStyles.filterActive, { borderColor: colors.primary, backgroundColor: colors.primary }],
            ]}
          >
            <Text style={[deliveryStyles.filterText, { color: filter === x ? '#FFF' : colors.textSecondary }, filter === x && deliveryStyles.filterTextActive]}>{FILTER_LABELS[x]}</Text>
          </Pressable>
        )}
      />
    </>
  );

  return (
    <DeliveryScreen scroll={false}>
      <FlatList
        data={visibleMissions}
        keyExtractor={(item) => item.id}
        renderItem={renderMission}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={<EmptyMissions />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_CLEARANCE, flexGrow: 1 }]}
      />
    </DeliveryScreen>
  );
}
