import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import Animated, {
  FadeInDown, FadeIn,
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { ArrowLeft, Bell, Bike, Gift, Package, CheckCheck } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, type UserNotification } from '@/services/api';
import { EmptyState } from '@/components/lottie-animations';

// Map notification type -> icon
function notificationIcon(type: string) {
  switch (type?.toLowerCase()) {
    case 'commande':
    case 'livraison':
      return Bike;
    case 'promo':
    case 'promotion':
      return Gift;
    case 'produit':
    case 'catalogue':
      return Package;
    default:
      return Bell;
  }
}

function timeAgo(iso: string | undefined, t: (key: string, fallback?: string) => string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t('notifications.justNow', "À l'instant");
  if (mins < 60) return `${t('notifications.ago', 'Il y a')} ${mins} ${t('notifications.minutesAgo', 'min')}`.trim();
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${t('notifications.ago', 'Il y a')} ${hours}${t('notifications.hoursAgo', 'h')}`.trim();
  const days = Math.floor(hours / 24);
  if (days < 7) return `${t('notifications.ago', 'Il y a')} ${days} ${t('notifications.daysAgo', 'jour(s)')}`.trim();
  return date.toLocaleDateString('fr-FR');
}

function NotificationCard({ item, index, onPress }: { item: UserNotification; index: number; onPress: () => void }) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const Icon = notificationIcon(item.type);

  return (
    <Animated.View
      entering={FadeInDown.duration(350).delay(index * 80).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
          !item.statut_lecture && { backgroundColor: isDark ? colors.backgroundAlt : '#F4F8FF', borderColor: colors.primarySoft },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
          <Icon color={colors.primary} size={24} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{item.titre}</Text>
          {item.message ? <Text style={[styles.body, { color: colors.textSecondary }]}>{item.message}</Text> : null}
          <Text style={[styles.time, { color: colors.textTertiary }]}>{timeAgo(item.created_at, t)}</Text>
        </View>
        {!item.statut_lecture && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </Pressable>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setItems(data);
    } catch (_e) {
      // Backend indisponible : on laisse la liste vide
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, statut_lecture: true })));
    try {
      await markAllNotificationsRead();
    } catch (_e) {
      // ignore
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // L'API ne relie pas une notification à une commande/produit précis (pas de champ id/lien) — on
  // ne peut honnêtement naviguer que vers la section concernée, jamais un enregistrement inventé.
  // Même convention que vendor/notifications.tsx et delivery/notifications.tsx.
  const handlePress = useCallback((item: UserNotification) => {
    if (!item.statut_lecture) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, statut_lecture: true } : n)));
      markNotificationRead(item.id).catch(() => {});
    }
    const type = item.type?.toLowerCase();
    if (type === 'commande' || type === 'livraison') router.push('/client/(tabs)/orders' as any);
    else if (type === 'promo' || type === 'promotion') router.push('/client/promo' as any);
    else if (type === 'produit' || type === 'catalogue') router.push('/client/(tabs)/categories' as any);
  }, []);

  const unreadCount = items.filter((n) => !n.statut_lecture).length;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <Pressable onPress={() => router.back()}><ArrowLeft color={colors.primary} size={27} /></Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t('notifications.title', 'Notifications')}</Text>
          {unreadCount > 0 && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{unreadCount} {t('notifications.unread', 'non lue(s)')}</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={handleMarkAllRead} style={[styles.markAll, { backgroundColor: colors.primarySoft }]} accessibilityLabel={t('notifications.markAllRead', 'Tout marquer comme lu')}>
            <CheckCheck color={colors.primary} size={18} />
          </Pressable>
        )}
      </Animated.View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('notifications.loading', 'Chargement de vos notifications…')}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            title={t('notifications.emptyTitle', 'Aucune notification')}
            message={t('notifications.emptyDesc', 'Vous serez notifié ici pour vos commandes, promotions et nouveautés.')}
            size={130}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          {items.map((item, index) => (
            <NotificationCard key={item.id} item={item} index={index} onPress={() => handlePress(item)} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 25, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  markAll: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 20, paddingTop: 10, gap: 12 },
  card: {
    minHeight: 112,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#1A2744',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 2,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 15, marginTop: 6, lineHeight: 22 },
  time: { fontSize: 13, marginTop: 8 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
});
