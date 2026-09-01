import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ClipboardList, Search, ArrowDownUp } from 'lucide-react-native';
import { useVendor, type VendorOrder, type VendorOrderStatus } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { EmptyState } from '@/components/lottie-animations';
import { SafeAreaView } from 'react-native-safe-area-context';

function isEnCours(statut: VendorOrderStatus) {
  return statut === 'en_attente' || statut === 'preparation' || statut === 'prete' || statut === 'en_livraison';
}

function statusLabel(statut: VendorOrderStatus, t: (key: string, fallback?: string) => string): string {
  const map: Record<VendorOrderStatus, [string, string]> = {
    en_attente: ['vendorOrdersList.statusPending', 'En attente'],
    preparation: ['vendorOrdersList.statusPreparation', 'Préparation'],
    prete: ['vendorOrdersList.statusReady', 'Prête'],
    en_livraison: ['vendorOrdersList.statusDelivering', 'En livraison'],
    livree: ['vendorOrdersList.statusDelivered', 'Livrée'],
    annulee: ['vendorOrdersList.statusCancelled', 'Annulée'],
    refusee: ['vendorOrdersList.statusRefused', 'Refusée'],
  };
  const [key, fallback] = map[statut];
  return t(key, fallback);
}

function totalOf(order: VendorOrder) {
  return order.produits.reduce((sum, p) => sum + p.prix, 0);
}

export default function VendorOrdersScreen() {
  const { orders, refreshOrders } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const FILTERS = [
    { id: 'toutes' as const, label: t('vendorOrdersList.filterAll', 'Toutes') },
    { id: 'en_cours' as const, label: t('vendorOrdersList.filterOngoing', 'En cours') },
    { id: 'livree' as const, label: t('vendorOrdersList.filterDelivered', 'Livrées') },
    { id: 'annulee' as const, label: t('vendorOrdersList.filterCancelled', 'Annulées') },
  ];

  const [filter, setFilter] = useState<'toutes' | 'en_cours' | 'livree' | 'annulee'>('toutes');
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  }, [refreshOrders]);

  const STATUS_COLOR: Record<VendorOrderStatus, string> = {
    en_attente: colors.warning, preparation: colors.info, prete: colors.accent,
    en_livraison: colors.info, livree: colors.success, annulee: colors.error, refusee: colors.error,
  };

  const filtered = useMemo(() => {
    let list = orders;
    if (filter === 'en_cours') list = list.filter((o) => isEnCours(o.statut));
    else if (filter === 'livree') list = list.filter((o) => o.statut === 'livree');
    else if (filter === 'annulee') list = list.filter((o) => o.statut === 'annulee' || o.statut === 'refusee');

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((o) =>
        o.id.toLowerCase().includes(q) ||
        o.client.nom.toLowerCase().includes(q) ||
        o.adresse.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      const cmp = a.date.localeCompare(b.date) || a.heure.localeCompare(b.heure);
      return sortAsc ? cmp : -cmp;
    });
  }, [orders, filter, query, sortAsc]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorOrdersList.title', 'Historique des commandes')}</Text>
        <Pressable onPress={() => router.push('/vendor/orders/manual' as any)} style={[styles.manualBtn, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.manualBtnText, { color: colors.primary }]}>{t('vendorOrdersList.manualBtn', '+ Manuelle')}</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(60).springify()} style={[styles.toolbar, { backgroundColor: colors.surface }]}>
        <View style={[styles.search, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
          <Search color={colors.textTertiary} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('vendorOrdersList.searchPlaceholder', 'Rechercher (réf, client, adresse)')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
        <Pressable
          onPress={() => setSortAsc((s) => !s)}
          style={[styles.sortBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          accessibilityLabel={t('vendorOrdersList.sortAria', 'Trier par date')}
        >
          <ArrowDownUp color={colors.primary} size={16} />
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(80).springify()}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => {
            const isSelected = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[styles.filterChip, { borderColor: colors.border }, isSelected && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
              >
                <Text style={[styles.filterText, { color: colors.textSecondary }, isSelected && { color: colors.primary, fontWeight: '900' }]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {filtered.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(400).springify()}>
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <EmptyState title={t('vendorOrdersList.emptyTitle', 'Aucune commande')} message={t('vendorOrdersList.emptyDesc', 'Aucune commande ne correspond à cette recherche.')} size={120} />
            </View>
          </Animated.View>
        ) : (
          filtered.map((order, index) => (
            <Animated.View key={order.id} entering={FadeInDown.duration(350).delay(index * 60).springify()}>
              <Pressable
                onPress={() => router.push(`/vendor/orders/${order.id}` as any)}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
              >
                <View style={[styles.cardIcon, { backgroundColor: colors.primarySoft }]}>
                  <ClipboardList color={colors.primary} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.orderId, { color: colors.text }]}>#{order.id}</Text>
                  <Text style={[styles.client, { color: colors.textSecondary }]}>{order.client.nom}</Text>
                </View>
                <Text style={[styles.date, { color: colors.textTertiary }]}>{order.date} - {order.heure}</Text>
                <Text style={[styles.amount, { color: STATUS_COLOR[order.statut] }]}>
                  {order.statut === 'en_attente' || isEnCours(order.statut)
                    ? `${totalOf(order).toLocaleString('fr-FR')} FCFA`
                    : statusLabel(order.statut, t)}
                </Text>
              </Pressable>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1,
  },
  title: { fontSize: 19, fontWeight: '900', flex: 1 },
  manualBtn: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  manualBtnText: { fontSize: 12, fontWeight: '800' },

  toolbar: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 14 },
  search: {
    flex: 1, height: 46, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 13.5 },
  sortBtn: {
    width: 46, height: 46, borderRadius: 14,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },

  filterRow: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5 },
  filterText: { fontSize: 13, fontWeight: '700' },

  content: { padding: 20, paddingTop: 6, gap: 12, paddingBottom: 30 },
  emptyBox: { borderRadius: 20, padding: 10, borderWidth: 1, alignItems: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, padding: 16,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  orderId: { fontSize: 15, fontWeight: '800' },
  client: { fontSize: 12.5, marginTop: 3 },
  date: { fontSize: 11 },
  amount: { fontSize: 13.5, fontWeight: '900', minWidth: 70, textAlign: 'right' },
});
