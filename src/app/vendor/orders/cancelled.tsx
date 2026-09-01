import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, ClipboardList } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { EmptyState } from '@/components/lottie-animations';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CancelledOrdersScreen() {
  const { orders, hasMoreOrders, loadMoreOrders } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [loadingMore, setLoadingMore] = useState(false);

  const FILTERS = [
    { id: 'client' as const, label: t('vendorCancelledOrders.filterClient', 'Client') },
    { id: 'systeme' as const, label: t('vendorCancelledOrders.filterSystem', 'Système') },
    { id: 'rupture_stock' as const, label: t('vendorCancelledOrders.filterStockOut', 'Rupture stock') },
  ];

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try { await loadMoreOrders(); } finally { setLoadingMore(false); }
  };
  const [filter, setFilter] = useState<'client' | 'systeme' | 'rupture_stock'>('rupture_stock');

  const cancelled = useMemo(
    () => orders.filter((o) => o.statut === 'annulee' && o.annuleePar === filter),
    [orders, filter]
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorCancelledOrders.title', 'Commandes annulées')}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(60).springify()} style={[styles.filterRow, { backgroundColor: colors.surface }]}>
        {FILTERS.map((f) => {
          const isSelected = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.filterChip, { borderColor: colors.borderStrong }, isSelected && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
            >
              <Text style={[styles.filterText, { color: colors.textSecondary }, isSelected && { color: colors.primary, fontWeight: '900' }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {cancelled.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(400).springify()}>
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <EmptyState title={t('vendorCancelledOrders.emptyTitle', 'Aucune annulation')} message={t('vendorCancelledOrders.emptyDesc', 'Aucune commande annulée dans cette catégorie.')} size={120} />
            </View>
          </Animated.View>
        ) : (
          cancelled.map((order, index) => {
            const total = order.produits.reduce((sum, p) => sum + p.prix, 0);
            return (
              <Animated.View key={order.id} entering={FadeInDown.duration(350).delay(index * 80).springify()}>
                <Pressable onPress={() => router.push(`/vendor/orders/${order.id}` as any)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
                  <View style={[styles.cardIcon, { backgroundColor: colors.primarySoft }]}>
                    <ClipboardList color={colors.primary} size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.orderId, { color: colors.text }]}>#{order.id}</Text>
                    <Text style={[styles.date, { color: colors.textSecondary }]}>{order.date} - {order.heure}</Text>
                    <Text style={[styles.motif, { color: colors.textTertiary }]}>{t('vendorCancelledOrders.reasonLabel', 'Motif :')} {order.motifAnnulation}</Text>
                  </View>
                  <Text style={[styles.amount, { color: colors.text }]}>{total.toLocaleString('fr-FR')} FCFA</Text>
                </Pressable>
              </Animated.View>
            );
          })
        )}

        {hasMoreOrders && (
          <Animated.View entering={FadeInUp.duration(400).delay(400).springify()}>
            <Pressable onPress={handleLoadMore} disabled={loadingMore} style={[styles.moreBtn, { borderColor: colors.borderStrong, backgroundColor: colors.surface }]}>
              {loadingMore ? <ActivityIndicator color={colors.primary} /> : <Text style={[styles.moreBtnText, { color: colors.primary }]}>{t('vendorCancelledOrders.loadMore', 'Voir plus')}</Text>}
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '900' },

  filterRow: { flexDirection: 'row', gap: 10, padding: 20 },
  filterChip: { flex: 1, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  filterText: { fontSize: 12.5, fontWeight: '700' },

  content: { padding: 20, paddingTop: 14, gap: 12, paddingBottom: 30 },
  emptyBox: { borderRadius: 20, padding: 10, borderWidth: 1, alignItems: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 16,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  orderId: { fontSize: 15, fontWeight: '800' },
  date: { fontSize: 12, marginTop: 2 },
  motif: { fontSize: 12, marginTop: 3 },
  amount: { fontSize: 14, fontWeight: '900' },

  moreBtn: {
    height: 54, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  moreBtnText: { fontSize: 14, fontWeight: '800' },
});
