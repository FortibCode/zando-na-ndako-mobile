import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Search, Store, UserRound } from 'lucide-react-native';
import { Card, DeliveryScreen, Header, StatusPill, monoLabel, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { EmptyHistory } from '@/components/delivery/empty-states';
import { LoadingState } from '@/components/lottie-animations';

export default function DeliveryHistory() {
  const { revenue, revenueLoading, fetchRevenue } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const FILTER_KEYS = ['toutes', 'terminee', 'en_cours', 'echouee'] as const;
  const FILTER_LABELS: Record<typeof FILTER_KEYS[number], string> = {
    toutes: t('deliveryHistory.filterAll', 'Toutes'),
    terminee: t('deliveryHistory.filterDone', 'Terminées'),
    en_cours: t('deliveryHistory.filterOngoing', 'En cours'),
    echouee: t('deliveryHistory.filterCancelled', 'Annulées'),
  };

  const [filter, setFilter] = useState<typeof FILTER_KEYS[number]>('toutes');
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const historique = revenue?.historique ?? [];

  const filtered = historique.filter((h) => {
    if (filter !== 'toutes' && h.statut !== filter) return false;
    if (query.trim() && !h.numero_commande.toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <DeliveryScreen scroll={false}>
      <Header title={t('deliveryHistory.title', 'Historique')} />

      <View style={{ marginBottom: 18 }}>
        <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>{t('deliveryHistory.eyebrow', 'VOS LIVRAISONS')}</Text>
        <Text style={[styles.headerTitle, { marginTop: 3, color: colors.text }]}>{t('deliveryHistory.fullTitle', 'Historique complet')}</Text>
        <Text style={[styles.muted, { fontSize: 14, marginTop: 6, color: colors.textSecondary }]}>
          {t('deliveryHistory.subtitle', 'Retrouvez toutes vos missions passées.')}
        </Text>
      </View>

      <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 14, backgroundColor: colors.surface }}>
        <Search color={colors.textTertiary} size={20} />
        <TextInput
          placeholder={t('deliveryHistory.searchPlaceholder', 'Rechercher une commande…')}
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.text }}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 18 }}>
        {FILTER_KEYS.map((x) => (
          <Pressable
            key={x}
            onPress={() => setFilter(x)}
            style={[{
              flex: 1, minHeight: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
              borderColor: filter === x ? colors.primary : colors.border,
              backgroundColor: filter === x ? colors.primary : colors.surface,
            }]}
          >
            <Text style={{ fontSize: 11.5, fontWeight: '800', color: filter === x ? '#FFF' : colors.textSecondary }}>{FILTER_LABELS[x]}</Text>
          </Pressable>
        ))}
      </View>

      {revenueLoading && historique.length === 0 ? (
        <LoadingState message={t('deliveryHistory.loading', 'Chargement de votre historique…')} size={90} />
      ) : filtered.length === 0 ? (
        <EmptyHistory />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {filtered.map((item, i) => {
            const date = new Date(item.date_livraison ?? item.created_at);
            return (
              <Card key={item.id} index={Math.min(i, 5)} style={{ marginBottom: 12, padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[monoLabel, { fontSize: 15, color: colors.text }]}>{item.numero_commande}</Text>
                  <StatusPill statut={item.statut} />
                </View>
                <Text style={[styles.muted, { marginTop: 8, fontSize: 13, color: colors.textSecondary }]}>
                  {date.toLocaleDateString('fr-FR')} • {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <Store color={colors.primary} size={16} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                    {t('deliveryHistory.vendorPrefix', 'Vendeur :')} {item.vendeur_nom ?? t('deliveryHistory.notProvided', 'Non renseigné')}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 }}>
                  <UserRound color={colors.fresh} size={16} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                    {t('deliveryHistory.clientPrefix', 'Client :')} {item.client_nom ?? t('deliveryHistory.notProvided', 'Non renseigné')}
                  </Text>
                </View>

                <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 14, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.muted, { fontSize: 13, color: colors.textSecondary }]}>{item.statut === 'echouee' ? t('deliveryHistory.expectedAmount', 'Montant prévu') : t('deliveryHistory.earnedAmount', 'Montant gagné')}</Text>
                  <Text style={{ color: item.statut === 'echouee' ? colors.textTertiary : colors.fresh, fontSize: 17, fontWeight: '900' }}>
                    {item.statut === 'echouee' ? '' : '+'}{item.montant.toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      )}
    </DeliveryScreen>
  );
}
