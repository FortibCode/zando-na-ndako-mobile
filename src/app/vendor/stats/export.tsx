import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

export default function ExportRevenueScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const PERIODS = [
    t('vendorExport.periodMonth', 'Ce mois'),
    t('vendorExport.periodWeek', 'Cette semaine'),
    t('vendorExport.periodToday', "Aujourd'hui"),
    t('vendorExport.periodYear', "L'année"),
  ];

  const [periodOpen, setPeriodOpen] = useState(false);
  const [period, setPeriod] = useState(PERIODS[0]);
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');

  const handleExport = () => {
    alert(t('vendorExport.comingSoonTitle', 'Bientôt disponible'), `${t('vendorExport.comingSoonDescPrefix', "L'export")} ${format === 'pdf' ? 'PDF' : 'Excel'} ${t('vendorExport.comingSoonDescMid', 'de vos revenus')} (${period}) ${t('vendorExport.comingSoonDescSuffix', 'sera bientôt disponible.')}`);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorExport.title', 'Exporter les revenus')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).delay(60).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorExport.periodLabel', 'Période')}</Text>
          <Pressable onPress={() => setPeriodOpen((o) => !o)} style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.dropdownValue, { color: colors.text }]}>{period}</Text>
            <ChevronDown color={colors.primary} size={18} style={{ transform: [{ rotate: periodOpen ? '180deg' : '0deg' }] }} />
          </Pressable>
          {periodOpen && (
            <Animated.View entering={FadeInDown.duration(200)} style={[styles.dropdownPanel, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              {PERIODS.map((p) => (
                <Pressable key={p} onPress={() => { setPeriod(p); setPeriodOpen(false); }} style={[styles.dropdownOption, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.dropdownOptionText, { color: colors.text }]}>{p}</Text>
                </Pressable>
              ))}
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(140).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorExport.formatLabel', 'Format')}</Text>
          <View style={styles.formatRow}>
            <Pressable
              onPress={() => setFormat('pdf')}
              style={[styles.formatBtn, format === 'pdf' ? { backgroundColor: colors.primary } : { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Text style={[styles.formatText, format === 'pdf' ? { color: '#FFF' } : { color: colors.text }]}>PDF</Text>
            </Pressable>
            <Pressable
              onPress={() => setFormat('excel')}
              style={[styles.formatBtn, format === 'excel' ? { borderWidth: 1.5, borderColor: colors.success, backgroundColor: colors.surface } : { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Text style={[styles.formatText, { color: format === 'excel' ? colors.success : colors.text }]}>Excel</Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(400).delay(200).springify()} style={[styles.note, { color: colors.textSecondary }]}>
          {t('vendorExport.note', 'Le fichier sera téléchargé sur votre appareil.')}
        </Animated.Text>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).delay(260).springify()} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable onPress={handleExport} style={[styles.exportBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.exportBtnText}>{t('vendorExport.exportBtn', 'Exporter')}</Text>
        </Pressable>
      </Animated.View>
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
  content: { padding: 20, gap: 20, paddingBottom: 30 },

  label: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  dropdown: {
    height: 54, borderRadius: 14, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dropdownValue: { fontSize: 15, fontWeight: '700' },
  dropdownPanel: { marginTop: 8, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  dropdownOption: { paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1 },
  dropdownOptionText: { fontSize: 14, fontWeight: '600' },

  formatRow: { flexDirection: 'row', gap: 12 },
  formatBtn: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  formatText: { fontSize: 15, fontWeight: '800' },

  note: { fontSize: 13.5, fontWeight: '600' },

  footer: { padding: 20, paddingBottom: 26, borderTopWidth: 1 },
  exportBtn: {
    height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  exportBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
