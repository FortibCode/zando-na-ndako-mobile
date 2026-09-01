import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Headset, MessageSquareText, ChevronRight, CircleAlert, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useVendor } from '@/contexts/vendor-context';
import { useLanguage } from '@/contexts/language-context';
import { EmptyState } from '@/components/lottie-animations';
import { fetchVendeurMessages, marquerMessageVendeurLu, type ApiVendeurMessage } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type Conversation = {
  id: string;
  titre: string;
  dernierMessage: string;
  heure: string;
  nonLu: number;
  statut: 'en_cours' | 'resolu' | 'litige';
};

function statusLabel(statut: Conversation['statut'], t: (key: string, fallback?: string) => string): string {
  if (statut === 'en_cours') return t('vendorSupport.statusOngoing', 'En cours');
  if (statut === 'resolu') return t('vendorSupport.statusResolved', 'Résolu');
  return t('vendorSupport.statusDispute', 'Litige');
}

export default function VendorSupportScreen() {
  const { colors, isDark } = useTheme();
  const { boutique } = useVendor();
  const { t } = useLanguage();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const STATUS_COLOR: Record<Conversation['statut'], string> = {
    en_cours: colors.warning, resolu: colors.success, litige: colors.error,
  };

  const loadMessages = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const apiMsgs = await fetchVendeurMessages();
      const mapped: Conversation[] = apiMsgs.map((m) => {
        const dateObj = m.created_at ? new Date(m.created_at) : new Date();
        return {
          id: m.id,
          titre: m.objet || 'Demande d\'assistance',
          dernierMessage: m.contenu,
          heure: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          nonLu: m.statut_lecture ? 0 : 1,
          statut: m.objet?.toLowerCase().includes('litige') ? 'litige' : m.statut_lecture ? 'resolu' : 'en_cours',
        };
      });
      setConversations(mapped);
    } catch (_err) {
      if (!opts?.silent) setConversations([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => loadMessages({ silent: true }), 20000); // polling ~20s, cohérent avec le reste de l'app
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
          <Text style={[styles.title, { color: colors.text }]}>{t('vendorSupport.title', 'Support Zando na Ndako')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('vendorSupport.subtitle', "Messagerie avec l'administration")}</Text>
        </View>
        <Pressable onPress={() => loadMessages()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <RefreshCw color={colors.primary} size={18} />
        </Pressable>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).delay(80).springify()} style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.white }]}>
            <Headset color={colors.primary} size={26} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.white }]}>{t('vendorSupport.heroTitle', 'Équipe Zando na Ndako')}</Text>
            <Text style={[styles.heroSub, { color: colors.white + 'D9' }]}>{t('vendorSupport.heroSubPrefix', 'Réponse en moins de 24h')} • {boutique.nom}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(140).springify()}>
          <Pressable onPress={() => router.push('/vendor/support/new' as any)} style={[styles.newBtn, { backgroundColor: colors.primary }]}>
            <MessageSquareText color={colors.white} size={18} />
            <Text style={[styles.newBtnText, { color: colors.white }]}>{t('vendorSupport.newConversation', 'Nouvelle conversation')}</Text>
          </Pressable>
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(400).delay(200).springify()} style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          {t('vendorSupport.yourConversations', 'VOS CONVERSATIONS')}
        </Animated.Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : conversations.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <EmptyState title={t('vendorSupport.emptyTitle', 'Aucune conversation')} message={t('vendorSupport.emptyDesc', "Contactez l'administration pour toute assistance, réclamation ou litige.")} size={110} />
          </View>
        ) : (
          conversations.map((c, i) => (
            <Animated.View key={c.id} entering={FadeInUp.duration(350).delay(240 + i * 80).springify()}>
              <Pressable
                onPress={async () => {
                  if (c.nonLu > 0) {
                    await marquerMessageVendeurLu(c.id).catch(() => {});
                  }
                  router.push(`/vendor/support/${c.id}` as any);
                }}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.cardIcon, { backgroundColor: colors.primarySoft }]}>
                  <MessageSquareText color={colors.primary} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{c.titre}</Text>
                  <Text style={[styles.cardMsg, { color: colors.textSecondary }]} numberOfLines={1}>{c.dernierMessage}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={[styles.cardTime, { color: colors.textTertiary }]}>{c.heure}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[c.statut] + '18' }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLOR[c.statut] }]}>{statusLabel(c.statut, t)}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  {c.nonLu > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
                      <Text style={[styles.unreadText, { color: colors.white }]}>{c.nonLu}</Text>
                    </View>
                  )}
                  <ChevronRight color={colors.textTertiary} size={18} />
                </View>
              </Pressable>
            </Animated.View>
          ))
        )}

        <Animated.View entering={FadeInUp.duration(400).delay(400).springify()} style={[styles.infoBar, { backgroundColor: colors.freshSoft }]}>
          <CircleAlert color={colors.success} size={16} />
          <Text style={[styles.infoText, { color: colors.success }]}>
            {t('vendorSupport.infoBar', "Les échanges sont suivis par l'équipe Zando na Ndako pour traiter vos réclamations et litiges.")}
          </Text>
        </Animated.View>
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
  subtitle: { fontSize: 12.5, marginTop: 2 },
  content: { padding: 20, gap: 14, paddingBottom: 30 },

  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 20, padding: 18,
  },
  heroIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, marginTop: 3 },

  newBtn: {
    height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  newBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 6 },
  emptyBox: { borderRadius: 20, padding: 10, borderWidth: 1, alignItems: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 16,
    borderWidth: 1,
  },
  cardIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardMsg: { fontSize: 12.5, marginTop: 3 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  cardTime: { fontSize: 11.5 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10.5, fontWeight: '800' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  unreadText: { fontSize: 11, fontWeight: '900' },

  infoBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14 },
  infoText: { fontSize: 12.5, fontWeight: '700', flex: 1, lineHeight: 18 },
});
