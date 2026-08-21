import { useEffect } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, RefreshCw, Star } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { resolveMediaUrl } from '@/services/api';

function Stars({ value, color }: { value: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} color={color} fill={i < value ? color : 'none'} size={15} />
      ))}
    </View>
  );
}

export default function DeliveryReviewsScreen() {
  const { driver, avis, avisLoading, fetchAvis } = useDelivery();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  useEffect(() => { fetchAvis(); }, [fetchAvis]);

  const AVATAR_COLORS = [colors.warning + '40', colors.info + '40', colors.accent + '40', colors.freshSoft];
  const noteMoyenne = avis?.note_moyenne ?? driver?.note_moyenne ?? 0;
  const nombreAvis = avis?.nombre_avis ?? 0;
  const reviews = avis?.avis ?? [];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('deliveryReviews.title', 'Mes avis clients')}</Text>
        <Pressable onPress={() => fetchAvis()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <RefreshCw color={colors.primary} size={18} />
        </Pressable>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).delay(60).springify()} style={styles.summaryRow}>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{noteMoyenne.toFixed(1).replace('.', ',')}</Text>
          <Stars value={Math.round(noteMoyenne)} color={colors.gold} />
          <Text style={[styles.summaryCount, { color: colors.textSecondary }]}>{nombreAvis} {t('deliveryReviews.reviewsSuffix', 'avis')}</Text>
        </Animated.View>

        {avisLoading && reviews.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : reviews.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.empty}>
            <Text style={styles.emptyEmoji}>⭐</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('deliveryReviews.emptyTitle', 'Aucun avis pour le moment')}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{t('deliveryReviews.emptyDesc', 'Les avis laissés par vos clients après une livraison apparaîtront ici.')}</Text>
          </Animated.View>
        ) : (
          reviews.map((r, i) => {
            const clientName = r.client?.nom || 'Client';
            const initials = clientName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
            const clientPhoto = resolveMediaUrl(r.client?.photo);
            const dateLabel = r.date_notation ? new Date(r.date_notation).toLocaleDateString('fr-FR') : '';
            return (
              <Animated.View key={r.id} entering={FadeInDown.duration(350).delay(120 + i * 80).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
                <View style={styles.cardHeader}>
                  {clientPhoto ? (
                    <Image source={{ uri: clientPhoto }} contentFit="cover" style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                      <Text style={[styles.avatarText, { color: colors.text }]}>{initials}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.clientName, { color: colors.text }]}>{clientName}</Text>
                    <Stars value={r.note} color={colors.gold} />
                  </View>
                  <Text style={[styles.date, { color: colors.textTertiary }]}>{dateLabel}</Text>
                </View>
                {r.commentaire ? <Text style={[styles.comment, { color: colors.textSecondary }]}>{r.commentaire}</Text> : null}
                {r.numero_commande ? (
                  <Text style={[styles.orderRef, { color: colors.textTertiary }]}>{t('deliveryReviews.orderPrefix', 'Commande')} #{r.numero_commande}</Text>
                ) : null}
              </Animated.View>
            );
          })
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
  title: { fontSize: 19, fontWeight: '900', flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 30 },

  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryValue: { fontSize: 30, fontWeight: '900' },
  summaryCount: { fontSize: 14, fontWeight: '600' },

  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '900' },
  emptySub: { fontSize: 14, textAlign: 'center' },

  card: {
    borderRadius: 18, padding: 16, gap: 10,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '900' },
  clientName: { fontSize: 15, fontWeight: '800' },
  date: { fontSize: 12 },
  comment: { fontSize: 14, lineHeight: 20 },
  orderRef: { fontSize: 11.5, fontWeight: '700' },
});
