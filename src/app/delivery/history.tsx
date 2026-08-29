import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
      <View style={{ flex: 1, paddingHorizontal: 18, paddingBottom: Platform.OS === 'ios' ? 10 : 14 }}>
        <Header title={t('deliveryHistory.title', 'Historique')} />

        <View style={{ marginBottom: 14 }}>
          <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>{t('deliveryHistory.eyebrow', 'VOS LIVRAISONS')}</Text>
          <Text style={[styles.headerTitle, { marginTop: 2, color: colors.text }]}>{t('deliveryHistory.fullTitle', 'Historique complet')}</Text>
          <Text style={[styles.muted, { fontSize: 13, marginTop: 3, color: colors.textSecondary }]}>
            {t('deliveryHistory.subtitle', 'Retrouvez toutes vos missions passées.')}
          </Text>
        </View>

        {/* Barre de recherche avec icône d'accentuation */}
        <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 14, backgroundColor: colors.surface, marginBottom: 12 }}>
          <Search color={colors.textTertiary} size={19} />
          <TextInput
            placeholder={t('deliveryHistory.searchPlaceholder', 'Rechercher une commande…')}
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, marginLeft: 10, fontSize: 14, color: colors.text }}
          />
        </View>

        {/* Filtres défilants fluides */}
        <View style={{ height: 40, marginBottom: 14 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {FILTER_KEYS.map((x) => (
              <Pressable
                key={x}
                onPress={() => setFilter(x)}
                style={[
                  {
                    minWidth: 84, paddingHorizontal: 16, height: 38, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
                    borderColor: filter === x ? colors.primary : colors.border,
                    backgroundColor: filter === x ? colors.primary : colors.surface,
                  },
                ]}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: filter === x ? '#FFF' : colors.textSecondary }}>{FILTER_LABELS[x]}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {revenueLoading && historique.length === 0 ? (
          <LoadingState message={t('deliveryHistory.loading', 'Chargement de votre historique…')} size={90} />
        ) : filtered.length === 0 ? (
          <EmptyHistory />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {filtered.map((item, i) => {
              const date = new Date(item.date_livraison ?? item.created_at);
              return (
                <Card key={item.id} index={Math.min(i, 5)} style={{ marginBottom: 10, padding: 14, borderRadius: 18 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[monoLabel, { fontSize: 14.5, color: colors.text }]}>{item.numero_commande}</Text>
                    <StatusPill statut={item.statut} />
                  </View>
                  <Text style={[styles.muted, { marginTop: 4, fontSize: 12, color: colors.textSecondary }]}>
                    {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} • {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>

                  <View style={{ marginTop: 10, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                        <Store color={colors.primary} size={14} />
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 12.5, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                        {t('deliveryHistory.vendorPrefix', 'Vendeur :')} <Text style={{ color: colors.text, fontWeight: '700' }}>{item.vendeur_nom ?? t('deliveryHistory.notProvided', 'Non renseigné')}</Text>
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: colors.freshSoft, alignItems: 'center', justifyContent: 'center' }}>
                        <UserRound color={colors.fresh} size={14} />
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 12.5, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                        {t('deliveryHistory.clientPrefix', 'Client :')} <Text style={{ color: colors.text, fontWeight: '700' }}>{item.client_nom ?? t('deliveryHistory.notProvided', 'Non renseigné')}</Text>
                      </Text>
                    </View>
                  </View>

                  <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.muted, { fontSize: 12, color: colors.textSecondary }]}>{item.statut === 'echouee' ? t('deliveryHistory.expectedAmount', 'Montant prévu') : t('deliveryHistory.earnedAmount', 'Gain livré')}</Text>
                    <Text style={{ color: item.statut === 'echouee' ? colors.textTertiary : colors.fresh, fontSize: 16, fontWeight: '900' }}>
                      {item.statut === 'echouee' ? '' : '+'}{item.montant.toLocaleString('fr-FR')} FCFA
                    </Text>
                  </View>
                </Card>
              );
            })}
          </ScrollView>
        )}
      </View>
    </DeliveryScreen>
  );
}
