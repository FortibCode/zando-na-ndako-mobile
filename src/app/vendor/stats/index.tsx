import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, ChevronDown, ArrowUpRight, Download } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

type PeriodId = 'jour' | 'semaine' | 'mois';

export default function VendorStatsScreen() {
  const { stats } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const PERIODS: { id: PeriodId; label: string }[] = [
    { id: 'jour', label: t('vendorStats.periodToday', "Aujourd'hui") },
    { id: 'semaine', label: t('vendorStats.periodWeek', 'Semaine') },
    { id: 'mois', label: t('vendorStats.periodMonth', 'Mois') },
  ];
  const [period, setPeriod] = useState<PeriodId>('semaine');
  const maxValue = Math.max(...stats.ventesSemaine.map((v) => v.montant));
  const totalVentes = period === 'jour'
    ? stats.revenuJour
    : period === 'semaine'
      ? stats.ventesSemaine.reduce((s, v) => s + v.montant, 0)
      : stats.chiffreAffaires;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorStats.title', 'Mes stats')}</Text>
        <Pressable
          onPress={() => setPeriod((p) => PERIODS[(PERIODS.findIndex((x) => x.id === p) + 1) % PERIODS.length].id)}
          style={[styles.periodBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <Text style={[styles.periodText, { color: colors.text }]}>{PERIODS.find((p) => p.id === period)?.label}</Text>
          <ChevronDown color={colors.primary} size={16} />
        </Pressable>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).delay(80).springify()}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>{t('vendorStats.totalSales', 'Total des ventes')}</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>{totalVentes.toLocaleString('fr-FR')} FCFA</Text>
          <View style={styles.trendRow}>
            <ArrowUpRight color={colors.success} size={16} />
            <Text style={[styles.trendText, { color: colors.success }]}>{PERIODS.find((p) => p.id === period)?.label}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(450).delay(160).springify()} style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <View style={styles.chartRow}>
            {stats.ventesSemaine.map((v, i) => {
              const heightPct = Math.max(6, (v.montant / maxValue) * 100);
              return (
                <View key={v.jour} style={styles.barCol}>
                  <View style={[styles.barTrack, { backgroundColor: colors.primarySoft }]}>
                    <Animated.View
                      entering={FadeInUp.duration(500).delay(220 + i * 60).springify()}
                      style={[styles.barFill, { height: `${heightPct}%`, backgroundColor: colors.primary }]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textTertiary }]}>{v.jour}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(360).springify()} style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('vendorStats.salesCount', 'Nombre de ventes')}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.commandesTotal}</Text>
          </View>
          <View style={[styles.statSep, { backgroundColor: colors.border }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('vendorStats.avgBasket', 'Panier moyen')}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.panierMoyen.toLocaleString('fr-FR')} FCFA</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(420).springify()}>
          <Pressable onPress={() => router.push('/vendor/stats/export' as any)} style={[styles.exportBtn, { backgroundColor: colors.primary }]}>
            <Download color="#FFF" size={18} />
            <Text style={styles.exportBtnText}>{t('vendorStats.exportRevenue', 'Exporter les revenus')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 20, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '900', flex: 1 },
  periodBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, height: 38, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1.5,
  },
  periodText: { fontSize: 12.5, fontWeight: '700' },

  content: { padding: 20, gap: 16, paddingBottom: 30 },
  totalLabel: { fontSize: 15, fontWeight: '700' },
  totalValue: { fontSize: 30, fontWeight: '900', marginTop: 6 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  trendText: { fontSize: 13, fontWeight: '700' },

  chartCard: {
    borderRadius: 20, padding: 20, height: 220,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  chartRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barCol: { flex: 1, alignItems: 'center', gap: 8 },
  barTrack: { width: 18, height: 140, borderRadius: 9, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 9 },
  barLabel: { fontSize: 10.5, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 18,
    borderWidth: 1,
  },
  statCol: { flex: 1, alignItems: 'center' },
  statSep: { width: 1, height: 36 },
  statLabel: { fontSize: 12.5, fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '900', marginTop: 6 },

  exportBtn: {
    height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  exportBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
