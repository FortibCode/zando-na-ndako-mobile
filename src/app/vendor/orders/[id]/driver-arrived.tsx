import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Star, User as UserIcon, Phone, MessageCircle } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

const DEFAULT_DRIVER = { nom: 'Jean-Paul', telephone: '+242 06 987 65 43', vehicule: 'TVS Apache RTR', note: 4.9 };

export default function DriverArrivedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrder } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const order = getOrder(id || '');
  const driver = order?.livreur || DEFAULT_DRIVER;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInDown.duration(350).springify()} style={[styles.title, { color: colors.text }]}>
          {t('vendorDriverArrived.title', 'Livreur arrivé')}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(350).delay(60).springify()} style={[styles.orderId, { color: colors.textSecondary }]}>
          {t('vendorDriverArrived.orderPrefix', 'Commande #')}{id}
        </Animated.Text>

        <Animated.View entering={ZoomIn.duration(450).delay(120).springify()} style={[styles.driverCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <View style={[styles.avatar, { backgroundColor: colors.freshSoft }]}>
            <Text style={styles.avatarEmoji}>🧑🏾‍✈️</Text>
          </View>
          <View>
            <Text style={[styles.driverName, { color: colors.text }]}>{driver.nom}</Text>
            <View style={styles.ratingRow}>
              <Star color={colors.gold} fill={colors.gold} size={16} />
              <Text style={[styles.ratingText, { color: colors.text }]}>{driver.note.toFixed(1).replace('.', ',')}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(200).springify()} style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <UserIcon color={colors.textSecondary} size={18} />
          <View>
            <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{t('vendorDriverArrived.vehicleLabel', 'Moto')}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{driver.vehicule}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(260).springify()} style={[styles.phoneCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Phone color={colors.success} size={18} />
          <Text style={[styles.phoneText, { color: colors.text }]}>{driver.telephone}</Text>
          <Pressable onPress={() => Linking.openURL(`tel:${driver.telephone.replace(/\s/g, '')}`)} style={[styles.phoneBtn, { backgroundColor: colors.freshSoft }]}>
            <Phone color={colors.success} size={16} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(320).springify()} style={{ gap: 12, width: '100%' }}>
          <Pressable
            onPress={() => Linking.openURL(`tel:${driver.telephone.replace(/\s/g, '')}`)}
            style={[styles.actionRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <Phone color={colors.success} size={18} />
            <Text style={[styles.actionText, { color: colors.text }]}>{t('vendorDriverArrived.callDriver', 'Appeler le livreur')}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/vendor/chat/${id}?role=livreur` as any)}
            style={[styles.actionRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <MessageCircle color={colors.primary} size={18} />
            <Text style={[styles.actionText, { color: colors.text }]}>{t('vendorDriverArrived.chatDriver', 'Discuter avec le livreur')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).delay(400).springify()} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable onPress={() => router.push(`/vendor/orders/${id}/handover` as any)} style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
          <Text style={styles.buttonText}>{t('vendorDriverArrived.handoverBtn', 'Remettre la commande')}</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingTop: 28, gap: 14, alignItems: 'center', paddingBottom: 30 },
  title: { fontSize: 22, fontWeight: '900' },
  orderId: { fontSize: 13.5, fontWeight: '700' },

  driverCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 20, padding: 20,
    borderWidth: 1,
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    marginTop: 8,
  },
  avatar: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 34 },
  driverName: { fontSize: 19, fontWeight: '900' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ratingText: { fontSize: 14, fontWeight: '800' },

  infoCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 16,
    borderWidth: 1,
  },
  infoLabel: { fontSize: 11.5, fontWeight: '700' },
  infoValue: { fontSize: 15, fontWeight: '800', marginTop: 2 },

  phoneCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 16,
    borderWidth: 1,
  },
  phoneText: { fontSize: 16, fontWeight: '800', flex: 1 },
  phoneBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  actionRow: {
    height: 56, borderRadius: 16, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  actionText: { fontSize: 15, fontWeight: '800' },

  footer: { padding: 20, paddingBottom: 26, borderTopWidth: 1 },
  button: {
    height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
