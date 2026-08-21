import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { ArrowRight, Home, MapPin } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useDiaspora, formatEur, formatUsd, formatFcfa } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';
import { SuccessState } from '@/components/lottie-animations';

export default function DiasporaConfirmedScreen() {
  const { lastOrder, selectedBeneficiary } = useDiaspora();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const orderId = lastOrder?.numeroCommande || 'ZAND-DIAS-000000';
  const montant = lastOrder?.montantFcfa || 0;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={BounceIn.duration(600).springify()} style={styles.animWrap}>
          <SuccessState message="" size={150} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.duration(400).delay(250).springify()} style={[styles.title, { color: colors.text }]}>
          {t('diaspora.confirmed.title', 'Commande envoyée\navec succès !')}
        </Animated.Text>

        <Animated.View entering={FadeInUp.duration(500).delay(400).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <View style={styles.cardRow}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('diaspora.confirmed.orderNumberLabel', 'Numéro de commande')}</Text>
          </View>
          <Text style={[styles.orderId, { color: colors.text }]}>{orderId}</Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('diaspora.confirmed.beneficiaryLabel', 'Bénéficiaire')}</Text>
          <View style={styles.beneficiaryRow}>
            <MapPin color={colors.primary} size={16} />
            <View>
              <Text style={[styles.beneficiaryName, { color: colors.text }]}>{selectedBeneficiary?.nom || t('diaspora.confirmed.defaultBeneficiary', 'Bénéficiaire')}</Text>
              <Text style={[styles.beneficiaryCity, { color: colors.textSecondary }]}>{selectedBeneficiary?.ville || 'Brazzaville'}, Brazzaville</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('diaspora.confirmed.amountLabel', 'Montant payé')}</Text>
          <Text style={[styles.amount, { color: colors.text }]}>
            {formatFcfa(montant)}
          </Text>
          <Text style={[styles.amountEur, { color: colors.textSecondary }]}>≈ {formatEur(montant)} · ≈ {formatUsd(montant)}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(550).springify()} style={{ width: '100%', gap: 12, marginTop: 6 }}>
          <Pressable onPress={() => router.push('/client/diaspora/checkout/notification-sent' as any)} style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('diaspora.confirmed.trackButton', 'Voir le suivi')}</Text>
            <ArrowRight color={colors.textInverse} size={18} />
          </Pressable>

          <Pressable onPress={() => router.replace('/client/(tabs)' as any)} style={[styles.homeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Home color={colors.primary} size={18} />
            <Text style={[styles.homeButtonText, { color: colors.text }]}>{t('diaspora.confirmed.homeButton', "Retour à l'accueil")}</Text>
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
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center', lineHeight: 32 },

  card: {
    width: '100%', borderRadius: 20, padding: 20, gap: 6,
    borderWidth: 1,
    shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 13, fontWeight: '600' },
  orderId: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  divider: { height: 1, marginVertical: 10 },
  beneficiaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  beneficiaryName: { fontSize: 16, fontWeight: '800' },
  beneficiaryCity: { fontSize: 12.5, marginTop: 2 },
  amount: { fontSize: 18, fontWeight: '900', marginTop: 4 },
  amountEur: { fontSize: 14, fontWeight: '600' },

  button: {
    width: '100%', height: 56, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  buttonText: { fontSize: 16, fontWeight: '900' },
  homeButton: {
    width: '100%', height: 54, borderRadius: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5,
  },
  homeButtonText: { fontSize: 16, fontWeight: '800' },
});
