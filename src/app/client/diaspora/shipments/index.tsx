import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown, FadeInUp,
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { ArrowLeft, Star } from 'lucide-react-native';
import { Palette } from '@/design/tokens';
import { useTheme } from '@/contexts/theme-context';
import { useDiaspora, formatPreferred, type Shipment, type ShipmentStatus } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';
import { EmptyState } from '@/components/lottie-animations';
import type { ThemeColors } from '@/design/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

function statusLabel(status: ShipmentStatus, t: (key: string, fallback?: string) => string): string {
  if (status === 'livree') return t('diaspora.shipments.statusDelivered', 'Livrée');
  if (status === 'en_cours') return t('diaspora.shipments.statusOngoing', 'En cours');
  return t('diaspora.shipments.statusCancelled', 'Annulée');
}

const STATUS_COLORS: Record<ShipmentStatus, { bg: string; text: string }> = {
  livree: { bg: '#D1FAE5', text: '#15803D' },
  en_cours: { bg: '#FEF3C7', text: '#92400E' },
  annulee: { bg: '#FEE2E2', text: '#B91C1C' },
};

const AVATAR_COLORS = ['#FDE68A', '#BFDBFE', '#FBCFE8', '#C7F9E5'];

function ShipmentCard({ shipment, index, colors }: { shipment: Shipment; index: number; colors: ThemeColors }) {
  const { settings } = useDiaspora();
  const { t } = useLanguage();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const initials = shipment.beneficiaireNom.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const statusStyle = STATUS_COLORS[shipment.statut];

  return (
    <Animated.View entering={FadeInDown.duration(350).delay(index * 90).springify()} style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => router.push(`/client/diaspora/shipments/${shipment.id}` as any)}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
      >
        <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.orderId, { color: colors.textTertiary }]}>#{shipment.id}</Text>
          <Text style={[styles.name, { color: colors.text }]}>{shipment.beneficiaireNom}</Text>
          <Text style={[styles.quartier, { color: colors.textSecondary }]}>{shipment.quartier.split(',')[0]}</Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={[styles.amount, { color: colors.text }]}>{formatPreferred(shipment.montantFcfa + shipment.fraisLivraison, settings.devise)}</Text>
          {shipment.needsRating && (
            <View style={[styles.badge, { backgroundColor: colors.goldSoft, flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
              <Star color={colors.gold} size={10} fill={colors.gold} />
              <Text style={[styles.badgeText, { color: colors.gold }]}>{t('diaspora.shipments.needsRating', 'À noter')}</Text>
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>{statusLabel(shipment.statut, t)}</Text>
          </View>
          <Text style={[styles.date, { color: colors.textTertiary }]}>{shipment.date}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ShipmentsListScreen() {
  const { shipments } = useDiaspora();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'tous' | ShipmentStatus>('tous');

  const FILTERS: { id: 'tous' | ShipmentStatus; label: string }[] = [
    { id: 'tous', label: t('diaspora.shipments.filterAll', 'Tous') },
    { id: 'livree', label: t('diaspora.shipments.filterDelivered', 'Livrés') },
    { id: 'en_cours', label: t('diaspora.shipments.filterOngoing', 'En cours') },
    { id: 'annulee', label: t('diaspora.shipments.filterCancelled', 'Annulés') },
  ];

  const filtered = useMemo(
    () => (filter === 'tous' ? shipments : shipments.filter((s) => s.statut === filter)),
    [shipments, filter]
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('diaspora.shipments.title', 'Mes envois')}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(60).springify()}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterRow, { backgroundColor: colors.surface }]}>
          {FILTERS.map((f) => {
            const isSelected = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[styles.filterChip, { backgroundColor: colors.backgroundAlt }, isSelected && { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.filterText, { color: colors.textSecondary }, isSelected && { color: colors.textInverse, fontWeight: '900' }]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(400).springify()}>
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <EmptyState title={t('diaspora.shipments.emptyTitle', 'Aucun envoi')} message={t('diaspora.shipments.emptyDesc', "Vous n'avez pas encore d'envoi dans cette catégorie.")} size={120} />
            </View>
          </Animated.View>
        ) : (
          filtered.map((s, index) => <ShipmentCard key={s.id} shipment={s} index={index} colors={colors} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '900' },

  filterRow: { paddingHorizontal: 20, paddingVertical: 14, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
  },
  filterText: { fontSize: 13, fontWeight: '700' },

  content: { padding: 20, paddingTop: 14, gap: 12, paddingBottom: 30 },
  emptyBox: { borderRadius: 20, padding: 10, borderWidth: 1, alignItems: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, padding: 14,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Palette.navy, fontSize: 15, fontWeight: '900' },
  copy: { flex: 1, gap: 2 },
  orderId: { fontSize: 11, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '800' },
  quartier: { fontSize: 12.5 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 15, fontWeight: '900' },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10.5, fontWeight: '900' },
  date: { fontSize: 11 },
});
