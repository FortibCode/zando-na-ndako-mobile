import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { ChevronDown, BarChart3, Download } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

type PeriodId = 'jour' | 'semaine' | 'mois' | 'total';

export default function VendorRevenueScreen() {
  const { stats } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [period, setPeriod] = useState<PeriodId>('mois');
  const [pickerOpen, setPickerOpen] = useState(false);

  const PERIODS: { id: PeriodId; label: string }[] = [
    { id: 'jour', label: t('vendorRevenue.periodToday', "Aujourd'hui") },
    { id: 'semaine', label: t('vendorRevenue.periodWeek', 'Cette semaine') },
    { id: 'mois', label: t('vendorRevenue.periodMonth', 'Ce mois') },
    { id: 'total', label: t('vendorRevenue.periodTotal', 'Total') },
  ];

  const periodData: Record<PeriodId, { revenue: number; orders: number; label: string }> = {
    jour: { revenue: stats.revenuJour, orders: stats.commandesJour, label: t('vendorRevenue.revenueOfDay', 'du jour') },
    semaine: { revenue: stats.ventesSemaine.reduce((s, v) => s + v.montant, 0), orders: 42, label: t('vendorRevenue.revenueOfWeek', 'de la semaine') },
    mois: { revenue: stats.chiffreAffaires, orders: stats.commandesTotal, label: t('vendorRevenue.revenueOfMonth', 'du mois') },
    total: { revenue: stats.chiffreAffaires, orders: stats.commandesTotal, label: t('vendorRevenue.revenueTotalLabel', 'total') },
  };

  const current = periodData[period];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorRevenue.title', 'Mes revenus')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(350).delay(60).springify()}>
          <Pressable onPress={() => setPickerOpen((o) => !o)} style={[styles.periodBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.periodText, { color: colors.text }]}>{PERIODS.find((p) => p.id === period)?.label}</Text>
            <ChevronDown color={colors.primary} size={18} />
          </Pressable>
        </Animated.View>

        {pickerOpen && (
          <Animated.View entering={FadeInDown.duration(250).springify()} style={[styles.pickerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {PERIODS.map((p) => {
              const selected = p.id === period;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => { setPeriod(p.id); setPickerOpen(false); }}
                  style={[styles.pickerRow, selected && { backgroundColor: colors.primarySoft }]}
                >
                  <Text style={[styles.pickerLabel, { color: selected ? colors.primary : colors.text }, selected && { fontWeight: '900' }]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.duration(400).delay(120).springify()} style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('vendorRevenue.revenuePrefix', 'Revenus')} {current.label}</Text>
          <Text style={[styles.summaryBig, { color: colors.text }]}>{current.revenue.toLocaleString('fr-FR')} FCFA</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryStatValue, { color: colors.text }]}>{current.orders}</Text>
              <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>{t('vendorRevenue.ordersLabel', 'Commandes')}</Text>
            </View>
            <View style={[styles.statSep, { backgroundColor: colors.border }]} />
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryStatValue, { color: colors.text }]}>{stats.panierMoyen.toLocaleString('fr-FR')} FCFA</Text>
              <Text style={[styles.summaryStatLabel, { color: colors.textSecondary }]}>{t('vendorRevenue.avgBasket', 'Panier moyen')}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(180).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <Text style={[styles.cardLabel, { color: colors.text }]}>{t('vendorRevenue.ordersLabel', 'Commandes')}</Text>
          <View style={styles.ordersRow}>
            <View style={styles.orderStat}>
              <Text style={[styles.orderStatValue, { color: colors.text }]}>{stats.commandesTotal}</Text>
              <Text style={[styles.orderStatLabel, { color: colors.textSecondary }]}>{t('vendorRevenue.totalLabel', 'Total')}</Text>
            </View>
            <View style={[styles.orderStatSep, { backgroundColor: colors.border }]} />
            <View style={styles.orderStat}>
              <Text style={[styles.orderStatValue, { color: colors.text }]}>{stats.commandesLivrees}</Text>
              <Text style={[styles.orderStatLabel, { color: colors.textSecondary }]}>{t('vendorRevenue.delivered', 'Livrées')}</Text>
            </View>
            <View style={[styles.orderStatSep, { backgroundColor: colors.border }]} />
            <View style={styles.orderStat}>
              <Text style={[styles.orderStatValue, { color: colors.text }]}>{stats.commandesEnAttente}</Text>
              <Text style={[styles.orderStatLabel, { color: colors.textSecondary }]}>{t('vendorRevenue.pending', 'En attente')}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(240).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <Text style={[styles.cardLabel, { color: colors.text }]}>{t('vendorRevenue.topProducts', 'Produits les plus vendus')}</Text>
          {stats.produitsPlusVendus.map((p, i) => (
            <Animated.View
              key={p.nom}
              entering={FadeInLeft.duration(300).delay(260 + i * 80).springify()}
              style={[styles.productRow, i < stats.produitsPlusVendus.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <Text style={[styles.productRank, { color: colors.primary }]}>{i + 1}.</Text>
              <Text style={[styles.productName, { color: colors.text }]}>{p.nom}</Text>
              <Text style={[styles.productSales, { color: colors.text }]}>{p.ventes} <Text style={[styles.productSalesLabel, { color: colors.textSecondary }]}>{t('vendorRevenue.salesSuffix', 'ventes')}</Text></Text>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(320).springify()}>
          <Pressable onPress={() => router.push('/vendor/stats' as any)} style={[styles.reportBtn, { borderColor: colors.borderStrong, backgroundColor: colors.surface }]}>
            <BarChart3 color={colors.primary} size={18} />
            <Text style={[styles.reportBtnText, { color: colors.primary }]}>{t('vendorRevenue.viewFullReport', 'Voir le rapport complet')}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(380).springify()}>
          <Pressable onPress={() => router.push('/vendor/stats/export' as any)} style={[styles.exportBtn, { backgroundColor: colors.primary }]}>
            <Download color="#FFF" size={18} />
            <Text style={styles.exportBtnText}>{t('vendorRevenue.exportRevenue', 'Exporter les revenus')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '900' },
  content: { padding: 20, gap: 14, paddingBottom: 30 },

  periodBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 52, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  periodText: { fontSize: 15, fontWeight: '700' },

  pickerCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  pickerRow: { paddingHorizontal: 16, paddingVertical: 14 },
  pickerLabel: { fontSize: 14.5, fontWeight: '700' },

  summaryCard: {
    borderRadius: 20, padding: 20,
    borderWidth: 1, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  summaryLabel: { fontSize: 14, fontWeight: '700' },
  summaryBig: { fontSize: 30, fontWeight: '900', marginTop: 8 },
  divider: { height: 1, marginVertical: 16 },

  summaryStats: { flexDirection: 'row', alignItems: 'center' },
  summaryStat: { flex: 1, alignItems: 'center' },
  statSep: { width: 1, height: 34 },
  summaryStatValue: { fontSize: 18, fontWeight: '900' },
  summaryStatLabel: { fontSize: 12, marginTop: 4 },

  card: {
    borderRadius: 20, padding: 20,
    borderWidth: 1, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardLabel: { fontSize: 14, fontWeight: '800', marginBottom: 8 },

  ordersRow: { flexDirection: 'row', alignItems: 'center' },
  orderStat: { flex: 1, alignItems: 'center' },
  orderStatSep: { width: 1, height: 34 },
  orderStatValue: { fontSize: 22, fontWeight: '900' },
  orderStatLabel: { fontSize: 12, marginTop: 4 },

  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  productRank: { fontSize: 15, fontWeight: '900' },
  productName: { fontSize: 14.5, fontWeight: '700', flex: 1 },
  productSales: { fontSize: 15, fontWeight: '900' },
  productSalesLabel: { fontSize: 12, fontWeight: '500' },

  reportBtn: {
    height: 54, borderRadius: 16, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  reportBtnText: { fontSize: 14.5, fontWeight: '800' },

  exportBtn: {
    height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  exportBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
