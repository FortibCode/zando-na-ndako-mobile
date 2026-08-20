import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, ShieldAlert, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { EmptyState } from '@/components/lottie-animations';
import { fetchClientLitiges, type ApiLitige, type LitigeStatut } from '@/services/api';

const STATUT_COLOR: Record<LitigeStatut, string> = {
  ouvert: '#C00000', attente_vendeur: '#F1A105', attente_client: '#F1A105',
  en_cours: '#1A2E5A', escalade: '#C00000', resolu: '#2E7D32', rejete: '#8A8F98', annule: '#8A8F98',
};

function statutLabel(s: LitigeStatut, t: (key: string, fallback?: string) => string): string {
  const map: Record<LitigeStatut, string> = {
    ouvert: t('clientDisputes.statusOpen', 'Ouvert'),
    attente_vendeur: t('clientDisputes.statusWaitingVendor', 'En attente du vendeur'),
    attente_client: t('clientDisputes.statusWaitingYou', 'En attente de vous'),
    en_cours: t('clientDisputes.statusInProgress', "En cours d'examen"),
    escalade: t('clientDisputes.statusEscalated', 'Escaladé'),
    resolu: t('clientDisputes.statusResolved', 'Résolu'),
    rejete: t('clientDisputes.statusRejected', 'Rejeté'),
    annule: t('clientDisputes.statusCancelled', 'Annulé'),
  };
  return map[s] ?? s;
}

export default function ClientDisputesScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [litiges, setLitiges] = useState<ApiLitige[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setLitiges(await fetchClientLitiges());
    } catch (_err) {
      setLitiges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('clientDisputes.title', 'Mes litiges')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 24 }} />
        ) : litiges.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <EmptyState
              title={t('clientDisputes.emptyTitle', 'Aucun litige')}
              message={t('clientDisputes.emptyDesc', 'Vous pouvez signaler un problème depuis le détail de vos commandes livrées.')}
              size={110}
            />
          </View>
        ) : (
          litiges.map((l, i) => (
            <Animated.View key={l.id} entering={FadeInUp.duration(350).delay(80 + i * 80).springify()}>
              <Pressable
                onPress={() => router.push(`/client/disputes/${l.id}` as any)}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.cardIcon, { backgroundColor: colors.error + '18' }]}>
                  <ShieldAlert color={colors.error} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{l.numero || `#${l.id.slice(0, 8)}`}</Text>
                  <Text style={[styles.cardMsg, { color: colors.textSecondary }]} numberOfLines={1}>{l.description}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUT_COLOR[l.statut] + '18', alignSelf: 'flex-start' }]}>
                    <Text style={[styles.statusText, { color: STATUT_COLOR[l.statut] }]}>{statutLabel(l.statut, t)}</Text>
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
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '900' },
  content: { padding: 20, gap: 12, paddingBottom: 30 },
  emptyBox: { borderRadius: 20, padding: 10, borderWidth: 1, alignItems: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 16, borderWidth: 1,
  },
  cardIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardMsg: { fontSize: 12.5, marginTop: 3 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  statusText: { fontSize: 10.5, fontWeight: '800' },
});
