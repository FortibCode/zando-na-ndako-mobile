import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, TextInput, ActivityIndicator } from 'react-native';
import Animated, {
  FadeInDown, FadeInLeft, FadeInUp, ZoomIn,
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import {
  Receipt, Package, Truck, CheckCircle, XCircle, Search, RefreshCw, Star, AlertTriangle, X,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { Palette, Spacing, Radii, Shadows } from '@/design/tokens';
import { fetchClientCommandes, type ApiCommande } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export type UiOrder = {
  id: string;
  rawId: string;
  date: string;
  total: string;
  status: 'En route' | 'Livrée' | 'Annulée';
  statutCode: string;
  needsRating: boolean;
};

// Une commande livrée reste "à noter" tant que le vendeur ET/OU le livreur présents sur la
// commande n'ont pas encore reçu de note de ce client — les deux cibles sont indépendantes.
function commandeNeedsRating(c: ApiCommande): boolean {
  if (c.statut_commande !== 'livree') return false;
  const notations = c.notations || [];
  const vendeurNote = notations.some((n) => n.type_cible === 'vendeur');
  const livreurNote = notations.some((n) => n.type_cible === 'livreur');
  return (!!c.vendeur && !vendeurNote) || (!!c.livreur && !livreurNote);
}

const STATUS_ICONS = {
  'En route': Truck,
  'Livrée': CheckCircle,
  'Annulée': XCircle,
} as const;

const STATUS_COLORS = {
  'En route': Palette.coral,
  'Livrée': Palette.fresh,
  'Annulée': Palette.faint,
} as const;

type TabId = 'Toutes' | 'Acceptées' | 'Refusées' | 'En cours' | 'Validées';

function mapApiToUiOrder(c: ApiCommande): UiOrder {
  let status: 'En route' | 'Livrée' | 'Annulée' = 'En route';
  if (c.statut_commande === 'livree') status = 'Livrée';
  else if (c.statut_commande === 'annulee') status = 'Annulée';

  const dateObj = c.date_commande || c.created_at ? new Date(c.date_commande || c.created_at!) : new Date();
  const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const totalNum = typeof c.montant_total === 'string' ? parseFloat(c.montant_total) : c.montant_total;
  const totalFormatted = `${Math.round(totalNum || 0).toLocaleString('fr-FR')} FCFA`;

  return {
    id: c.numero_commande || `#${c.id.slice(0, 8)}`,
    rawId: c.id,
    date: dateFormatted,
    total: totalFormatted,
    status,
    statutCode: c.statut_commande,
    needsRating: commandeNeedsRating(c),
  };
}

function statusLabel(status: UiOrder['status'], t: (key: string, fallback?: string) => string): string {
  if (status === 'En route') return t('ordersList.statusEnRoute', 'En route');
  if (status === 'Livrée') return t('ordersList.statusDelivered', 'Livrée');
  return t('ordersList.statusCancelled', 'Annulée');
}

function OrderCard({ order, index }: { order: UiOrder; index: number }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const StatusIcon = STATUS_ICONS[order.status] || Package;
  const statusColor = STATUS_COLORS[order.status] || colors.primary;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isInRoute = order.status === 'En route';

  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(index * 100).springify()}
      style={animStyle}
    >
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => router.push(
          isInRoute ? { pathname: '/client/orders/tracking', params: { id: order.rawId } } as any : `/client/orders/${order.rawId}` as any
        )}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.orderIcon, { backgroundColor: colors.primarySoft }]}>
          <Receipt color={colors.primary} size={28} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.id, { color: colors.text }]}>{order.id}</Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>{order.date}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <StatusIcon color={statusColor} size={14} />
              <Text style={[styles.status, { color: statusColor }]}>{statusLabel(order.status, t)}</Text>
            </View>
            {order.needsRating && (
              <View style={[styles.statusBadge, { backgroundColor: colors.goldSoft }]}>
                <Star color={colors.gold} size={14} fill={colors.gold} />
                <Text style={[styles.status, { color: colors.gold }]}>{t('ordersList.needsRating', 'À noter')}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={[styles.total, { color: colors.text }]}>{order.total}</Text>
      </Pressable>
    </Animated.View>
  );
}

function tabLabel(tab: TabId, t: (key: string, fallback?: string) => string): string {
  if (tab === 'Acceptées') return t('ordersList.tabAccepted', 'Acceptées');
  if (tab === 'Refusées') return t('ordersList.tabRefused', 'Refusées');
  if (tab === 'En cours') return t('ordersList.tabOngoing', 'En cours');
  if (tab === 'Validées') return t('ordersList.tabValidated', 'Validées');
  return t('ordersList.tabAll', 'Toutes');
}

export default function OrdersScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('Toutes');
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const tabs: TabId[] = ['Toutes', 'Acceptées', 'Refusées', 'En cours', 'Validées'];

  const loadOrders = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const apiOrders = await fetchClientCommandes();
      setOrders(apiOrders.map(mapApiToUiOrder));
    } catch (_err) {
      setOrders([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Filtrage par onglet + recherche
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (activeTab === 'Acceptées') result = result.filter((o) => o.status === 'En route' && ['preparation', 'prete', 'en_livraison'].includes(o.statutCode));
    else if (activeTab === 'Refusées') result = result.filter((o) => o.status === 'Annulée');
    else if (activeTab === 'En cours') result = result.filter((o) => o.status === 'En route');
    else if (activeTab === 'Validées') result = result.filter((o) => o.status === 'Livrée');

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter((o) =>
        o.id.toLowerCase().includes(q) || o.date.toLowerCase().includes(q) || o.status.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeTab, query, orders]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Titre */}
        <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.headingRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>{t('ordersList.title', 'Mes commandes')}</Text>
            <Text style={[styles.pageSub, { color: colors.textSecondary }]}>{t('ordersList.subtitle', 'Suivez et retrouvez vos achats')}</Text>
          </View>
          <Pressable onPress={loadOrders} style={[styles.refreshBtn, { backgroundColor: colors.primarySoft }]}>
            <RefreshCw color={colors.primary} size={18} />
          </Pressable>
        </Animated.View>

        {/* Barre de recherche */}
        <Animated.View entering={FadeInDown.duration(300).delay(60).springify()} style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search color={colors.textTertiary} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('ordersList.searchPlaceholder', 'Rechercher une commande (n°, date, statut)')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X color={colors.textTertiary} size={16} />
            </Pressable>
          )}
        </Animated.View>

        {/* Onglets sous forme de boutons déroulants */}
        <Animated.View entering={FadeInDown.duration(300).delay(100).springify()}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {tabs.map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, { backgroundColor: colors.surface, borderColor: colors.border }, activeTab === tab && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.tabText, { color: colors.text }, activeTab === tab && { color: colors.white }]}>
                  {tabLabel(tab, t)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Résultats / Loading */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('ordersList.loading', 'Chargement de vos commandes...')}</Text>
          </View>
        ) : loadError ? (
          <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.empty}>
            <AlertTriangle color={colors.error} size={40} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('ordersList.errorTitle', 'Impossible de charger vos commandes')}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {t('ordersList.errorSub', 'Vérifiez votre connexion puis réessayez.')}
            </Text>
            <Pressable onPress={loadOrders} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
              <RefreshCw color={colors.white} size={16} />
              <Text style={[styles.retryBtnText, { color: colors.white }]}>{t('common.retry', 'Réessayer')}</Text>
            </Pressable>
          </Animated.View>
        ) : filteredOrders.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.empty}>
            <Package color={colors.textTertiary} size={44} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('ordersList.emptyTitle', 'Aucune commande trouvée')}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {query ? t('ordersList.emptyNoResult', 'Aucun résultat pour votre recherche.') : t('ordersList.emptyNoneInTab', 'Aucune commande dans cette catégorie.')}
            </Text>
          </Animated.View>
        ) : (
          filteredOrders.map((order, index) => (
            <OrderCard key={order.rawId || order.id} order={order} index={index} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.xl, paddingTop: Spacing.lg, gap: Spacing.md },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  refreshBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 26, fontWeight: '900' },
  pageSub: { fontSize: 13, marginTop: 3 },
  loadingBox: { paddingVertical: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  searchBar: {
    height: 52,
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', paddingVertical: 0 },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  card: {
    minHeight: 130,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    ...Shadows.soft,
  },
  orderIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, marginLeft: Spacing.md, gap: 6 },
  id: { fontSize: 16, fontWeight: '800' },
  date: { fontSize: 14 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Spacing.sm,
    marginTop: 2,
  },
  status: { fontSize: 13, fontWeight: '700' },
  total: { fontSize: 16, fontWeight: '800' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '900' },
  emptySub: { fontSize: 14, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radii.md, marginTop: 8,
  },
  retryBtnText: { fontSize: 14, fontWeight: '800' },
});
