import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Bell, Bike, CheckCheck, Gift, Package, Truck } from 'lucide-react-native';
import { DeliveryScreen, Header, styles } from '@/components/delivery-ui';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, type UserNotification } from '@/services/api';
import { EmptyState } from '@/components/lottie-animations';

function notificationIcon(type: string) {
  switch (type?.toLowerCase()) {
    case 'mission':
    case 'livraison':
      return Bike;
    case 'commande':
      return Package;
    case 'promo':
    case 'promotion':
      return Gift;
    case 'paiement':
    case 'revenu':
      return Truck;
    default:
      return Bell;
  }
}

function timeAgo(iso: string | undefined, t: (key: string, fallback?: string) => string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t('deliveryNotifications.justNow', "À l'instant");
  if (mins < 60) return `${t('deliveryNotifications.minutesAgoPrefix', 'Il y a')} ${mins} ${t('deliveryNotifications.minutesAgoSuffix', 'min')}`.trim();
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${t('deliveryNotifications.minutesAgoPrefix', 'Il y a')} ${hours}${t('deliveryNotifications.hoursAgoSuffix', 'h')}`.trim();
  const days = Math.floor(hours / 24);
  if (days < 7) return `${t('deliveryNotifications.minutesAgoPrefix', 'Il y a')} ${days}${t('deliveryNotifications.daysAgoSuffix', 'j')}`.trim();
  return date.toLocaleDateString('fr-FR');
}

export default function DeliveryNotifications() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setItems(data);
    } catch (_e) {
      // backend indisponible
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, statut_lecture: true })));
    } catch (_e) { /* ignore */ }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleItemPress = useCallback(async (item: UserNotification) => {
    if (item.statut_lecture) return;
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, statut_lecture: true } : n)));
    try {
      await markNotificationRead(item.id);
    } catch { /* ignore : déjà mis à jour localement */ }
  }, []);

  const unreadCount = items.filter((n) => !n.statut_lecture).length;

  return (
    <DeliveryScreen scroll={false}>
      <Header title={t('deliveryNotifications.title', 'Notifications')} action={
        unreadCount > 0 ? (
          <Pressable onPress={handleMarkAllRead} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <CheckCheck color={colors.primary} size={20} />
          </Pressable>
        ) : undefined
      } />

      <View style={{ marginBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Bell color={colors.primary} size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('deliveryNotifications.myNotifications', 'Mes notifications')}</Text>
          <Text style={[styles.muted, { fontSize: 13, marginTop: 3, color: colors.textSecondary }]}>
            {unreadCount > 0 ? `${unreadCount} ${unreadCount > 1 ? t('deliveryNotifications.unreadSuffixPlural', 'non lues') : t('deliveryNotifications.unreadSuffix', 'non lue')}` : t('deliveryNotifications.allUpToDate', 'Tout est à jour')}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.muted, { color: colors.textSecondary }]}>{t('deliveryNotifications.loading', 'Chargement de vos notifications…')}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState title={t('deliveryNotifications.emptyTitle', 'Aucune notification')} message={t('deliveryNotifications.emptyDesc', 'Vous serez notifié ici pour vos nouvelles missions, paiements et mises à jour.')} size={130} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        >
          {items.map((item, i) => {
            const Icon = notificationIcon(item.type);
            const isUnread = !item.statut_lecture;
            return (
              <Animated.View key={item.id} entering={FadeInUp.duration(300).delay(Math.min(i, 6) * 50).springify()}>
                <Pressable
                  onPress={() => handleItemPress(item)}
                  style={{
                    minHeight: 108,
                    borderRadius: 18,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: isUnread ? colors.primarySoft : colors.border,
                  }}
                >
                  <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon color={colors.primary} size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { fontSize: 16, color: colors.text }]}>{item.titre}</Text>
                    {item.message ? <Text style={[styles.muted, { fontSize: 14, marginTop: 5, lineHeight: 20, color: colors.textSecondary }]}>{item.message}</Text> : null}
                    <Text style={{ fontSize: 12, marginTop: 7, color: colors.textTertiary, fontWeight: '600' }}>{timeAgo(item.created_at, t)}</Text>
                  </View>
                  {isUnread && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}
    </DeliveryScreen>
  );
}
