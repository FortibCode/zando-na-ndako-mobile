import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Bell, Wallet, Store, MessageCircle, Percent, Check, CheckCheck } from 'lucide-react-native';
import { useVendor, type VendorNotification } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

export default function VendorNotificationsScreen() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const unreadCount = notifications.filter((n) => !n.lu).length;

  const handleMarkAllRead = () => {
    if (unreadCount === 0) {
      Alert.alert(
        t('vendorNotifications.alreadyReadTitle', 'Information'),
        t('vendorNotifications.alreadyReadDesc', 'Toutes vos notifications sont déjà marquées comme lues.')
      );
      return;
    }
    markAllNotificationsRead();
    Alert.alert(
      t('vendorNotifications.allReadTitle', '✅ Notifications lues'),
      t('vendorNotifications.allReadDesc', 'Toutes vos notifications ont été marquées comme lues.')
    );
  };

  const TYPE_STYLE: Record<VendorNotification['type'], { icon: any; bg: string }> = {
    commande: { icon: Bell, bg: colors.primary },
    paiement: { icon: Wallet, bg: colors.warning },
    stock: { icon: Store, bg: colors.warning },
    avis: { icon: MessageCircle, bg: colors.accent },
    promotion: { icon: Percent, bg: colors.primary },
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t('vendorNotifications.title', 'Notifications')}</Text>
          {unreadCount > 0 && (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>{unreadCount} non lue(s)</Text>
          )}
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.map((n, i) => {
          const { icon: Icon, bg } = TYPE_STYLE[n.type];
          return (
            <Animated.View key={n.id} entering={FadeInUp.duration(350).delay(i * 50).springify()}>
              <Pressable
                onPress={() => {
                  markNotificationRead(n.id);
                  if (n.type === 'commande') router.push('/vendor/orders/new' as any);
                }}
                style={[styles.row, { borderBottomColor: colors.border }, !n.lu && { backgroundColor: colors.backgroundAlt }]}
              >
                <View style={[styles.icon, { backgroundColor: bg }]}>
                  <Icon color={colors.white} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notifTitle, { color: colors.text }]}>{n.titre}</Text>
                  <Text style={[styles.notifMessage, { color: colors.textSecondary }]}>{n.message}</Text>
                </View>
                <Text style={[styles.time, { color: colors.textTertiary }]}>{n.heure}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).delay(300).springify()} style={styles.footer}>
        <Pressable
          onPress={handleMarkAllRead}
          disabled={unreadCount === 0}
          style={[styles.readAllBtn, { borderColor: colors.borderStrong, backgroundColor: colors.surface }, unreadCount === 0 && { opacity: 0.5 }]}
        >
          <CheckCheck color={colors.primary} size={18} />
          <Text style={[styles.readAllText, { color: colors.primary }]}>
            {unreadCount === 0 ? t('vendorNotifications.allReadDone', 'Toutes les notifications sont lues') : t('vendorNotifications.markAllRead', 'Tout marquer comme lu')}
          </Text>
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
  title: { fontSize: 22, fontWeight: '900' },
  content: { padding: 20, gap: 4, paddingBottom: 30 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 1 },
  icon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { fontSize: 15, fontWeight: '800' },
  notifMessage: { fontSize: 13, marginTop: 3 },
  time: { fontSize: 12 },

  footer: { padding: 20, paddingBottom: 26 },
  readAllBtn: {
    height: 54, borderRadius: 16, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  readAllText: { fontSize: 14.5, fontWeight: '800' },
});
