import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, ShieldAlert, ChevronRight, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { EmptyState } from '@/components/lottie-animations';
import { fetchVendeurLitiges, type ApiLitige, type LitigeStatut } from '@/services/api';

const STATUT_COLOR: Record<LitigeStatut, string> = {
  ouvert: '#C00000', attente_vendeur: '#F1A105', attente_client: '#F1A105',
  en_cours: '#1A2E5A', escalade: '#C00000', resolu: '#2E7D32', rejete: '#8A8F98', annule: '#8A8F98',
};

export default function VendorDisputesScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [litiges, setLitiges] = useState<ApiLitige[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      setLitiges(await fetchVendeurLitiges());
    } catch (_err) {
      if (!opts?.silent) setLitiges([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ silent: true }), 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t('vendorDisputes.title', 'Litiges')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('vendorDisputes.subtitle', 'Réclamations sur vos commandes')}</Text>
        </View>
        <Pressable onPress={() => load()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <RefreshCw color={colors.primary} size={18} />
        </Pressable>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 24 }} />
        ) : litiges.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <EmptyState
              title={t('vendorDisputes.emptyTitle', 'Aucun litige')}
              message={t('vendorDisputes.emptyDesc', "Les réclamations ouvertes par vos clients apparaîtront ici.")}
              size={110}
            />
          </View>
        ) : (
          litiges.map((l, i) => (
            <Animated.View key={l.id} entering={FadeInUp.duration(350).delay(80 + i * 80).springify()}>
              <Pressable
                onPress={() => router.push(`/vendor/disputes/${l.id}` as any)}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.cardIcon, { backgroundColor: colors.error + '18' }]}>
                  <ShieldAlert color={colors.error} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{l.numero || `#${l.id.slice(0, 8)}`}</Text>
                  <Text style={[styles.cardMsg, { color: colors.textSecondary }]} numberOfLines={1}>{l.description}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUT_COLOR[l.statut] + '18', alignSelf: 'flex-start' }]}>
                    <Text style={[styles.statusText, { color: STATUT_COLOR[l.statut] }]}>{l.statut.replace(/_/g, ' ')}</Text>
                  </View>
                </View>
                <ChevronRight color={colors.textTertiary} size={18} />
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '900' },
  subtitle: { fontSize: 12.5, marginTop: 2 },
  content: { padding: 20, gap: 12, paddingBottom: 30 },
  emptyBox: { borderRadius: 20, padding: 10, borderWidth: 1, alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 16, borderWidth: 1 },
  cardIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardMsg: { fontSize: 12.5, marginTop: 3 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  statusText: { fontSize: 10.5, fontWeight: '800', textTransform: 'capitalize' },
});
