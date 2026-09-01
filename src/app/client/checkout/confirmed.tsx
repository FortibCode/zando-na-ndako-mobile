import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, BounceIn,
} from 'react-native-reanimated';
import { ArrowRight, Home, Package, CheckCircle2, Clock, PartyPopper, Mail } from 'lucide-react-native';
import { useClient } from '@/contexts/client-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { SuccessState } from '@/components/lottie-animations';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConfirmedScreen() {
  const { numero, montant, id } = useLocalSearchParams<{ numero?: string; montant?: string; id?: string }>();
  const { clearCart, subtotal, selectedPaymentMethod, selectedSlot } = useClient();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const total = montant ? Number(montant) : subtotal + 800;
  const orderId = numero || ('#ZNND-' + Math.floor(100000 + Math.random() * 900000));

  const slotLabel = selectedSlot
    ? `${selectedSlot.day === 'today' ? t('common.today', "Aujourd'hui") : t('common.tomorrow', 'Demain')}, ${selectedSlot.label}`
    : t('checkout.slot', 'Choisissez un créneau');

  const paymentLabel: Record<string, string> = {
    airtel: 'Airtel Money',
    mtn: 'MTN Mobile Money',
    card: 'Carte bancaire',
    cod: t('payment.codTitle', 'Paiement à la livraison'),
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Lottie Animation */}
        <Animated.View entering={BounceIn.duration(600).springify()} style={styles.animWrap}>
          <SuccessState message="" size={160} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(300).springify()} style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('checkout.orderConfirmed', 'Commande confirmée !')}
          </Text>
          <PartyPopper color={colors.primary} size={26} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.duration(400).delay(400).springify()} style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('checkout.orderConfirmedSub', 'Merci pour votre confiance. Votre commande est en cours de préparation.')}
        </Animated.Text>

        {/* Order Summary Card */}
        <Animated.View entering={FadeInUp.duration(500).delay(500).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Order ID */}
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('checkout.orderNumber', 'Numéro de commande')}</Text>
            <Text style={[styles.orderId, { color: colors.primary }]}>{orderId}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('checkout.totalAmount', 'Montant total')}</Text>
            <Text style={[styles.cardAmount, { color: colors.primary }]}>{total.toLocaleString('fr-FR')} FCFA</Text>
          </View>

          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('checkout.paymentMethod', 'Méthode de paiement')}</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{paymentLabel[selectedPaymentMethod] || 'N/A'}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Timeline */}
          <Text style={[styles.timelineTitle, { color: colors.text }]}>{t('checkout.deliveryTracking', 'Suivi de livraison')}</Text>
          {[
            { icon: CheckCircle2, label: t('orderDetail.statusConfirmed', 'Confirmée'), done: true },
            { icon: Package, label: t('orderDetail.statusPreparing', 'En préparation'), done: true },
            { icon: Clock, label: slotLabel, done: false },
          ].map(({ icon: Icon, label, done }, i) => (
            <View key={i} style={styles.timelineRow}>
              <View style={[styles.timelineDot, { backgroundColor: colors.border }, done && { backgroundColor: colors.success }]}>
                <Icon color={done ? '#FFF' : colors.textTertiary} size={14} />
              </View>
              <Text style={[styles.timelineLabel, done && { color: colors.text, fontWeight: '700' }, !done && { color: colors.textTertiary }]}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Email note */}
        <Animated.View entering={FadeInUp.duration(400).delay(650).springify()} style={styles.emailRow}>
          <Mail color={colors.textSecondary} size={14} />
          <Text style={[styles.email, { color: colors.textSecondary }]}>
            {t('checkout.smsRecap', 'Un récapitulatif vous a été envoyé par SMS.')}
          </Text>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInUp.duration(400).delay(750).springify()} style={{ width: '100%', gap: 12 }}>
          <Pressable
            onPress={() => {
              clearCart();
              router.push((id ? `/client/orders/tracking?id=${encodeURIComponent(id)}` : '/client/orders/tracking') as any);
            }}
            style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          >
            <Package color="#FFF" size={18} />
            <Text style={styles.buttonText}>{t('checkout.tracking', 'Suivre ma commande')}</Text>
            <ArrowRight color="#FFF" size={18} />
          </Pressable>

          <Pressable
            onPress={() => {
              clearCart();
              router.replace('/client' as any);
            }}
            style={[styles.homeButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <Home color={colors.primary} size={18} />
            <Text style={[styles.homeButtonText, { color: colors.primary }]}>{t('checkout.backHome', "Retour à l'accueil")}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { alignItems: 'center', padding: 22, paddingTop: 32, gap: 16 },
  animWrap: { marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },

  card: {
    width: '100%',
    borderRadius: 20, padding: 20, gap: 12,
    borderWidth: 1,
    shadowColor: '#0D1B3E', shadowOpacity: 0.06,
    shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 14 },
  orderId: { fontSize: 16, fontWeight: '900' },
  cardAmount: { fontSize: 18, fontWeight: '900' },
  cardValue: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1 },

  // Timeline
  timelineTitle: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timelineDot: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center',
  },
  timelineLabel: { fontSize: 13, flex: 1 },

  emailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  email: { fontSize: 13, textAlign: 'center' },

  button: {
    width: '100%', height: 56, borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowOpacity: 0.25, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  homeButton: {
    width: '100%', height: 54, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5,
  },
  homeButtonText: { fontSize: 16, fontWeight: '800' },
});
