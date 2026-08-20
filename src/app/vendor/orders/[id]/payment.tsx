import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

export default function OrderPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrder } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const order = getOrder(id || '');
  const total = order?.produits.reduce((sum, p) => sum + p.prix, 0) || 0;
  const paiement = order?.paiement || {
    reference: 'AVEC-2024-' + String(id || '00000').slice(-5),
    date: `${order?.date || ''} - ${order?.heure || ''}`,
    methode: t('vendorOrderPayment.defaultMethod', 'Mobile Money (MTN)'),
    statut: t('vendorOrderPayment.defaultStatus', 'Payé'),
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t('vendorOrderPayment.title', 'Détails paiement commande')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>#{id}</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).delay(80).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('vendorOrderPayment.referenceLabel', 'Référence paiement')}</Text>
          <Text style={[styles.value, { color: colors.text }]}>{paiement.reference}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(140).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('vendorOrderPayment.dateLabel', 'Date')}</Text>
          <Text style={[styles.value, { color: colors.text }]}>{paiement.date}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(200).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('vendorOrderPayment.amountLabel', 'Montant')}</Text>
          <Text style={[styles.amount, { color: colors.text }]}>{total.toLocaleString('fr-FR')} FCFA</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(260).springify()} style={[styles.card, styles.rowCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('vendorOrderPayment.methodLabel', 'Méthode de paiement')}</Text>
            <Text style={[styles.value, { color: colors.text }]}>{paiement.methode}</Text>
          </View>
          <View style={[styles.methodBadge, { backgroundColor: colors.goldSoft }]}>
            <Text style={[styles.methodBadgeText, { color: colors.text }]}>MTN</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(320).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('vendorOrderPayment.statusLabel', 'Statut')}</Text>
          <Text style={[styles.value, { color: colors.success }]}>{paiement.statut}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(380).springify()}>
          <Pressable
            onPress={() => Alert.alert(t('vendorOrderPayment.receiptAlertTitle', 'Reçu'), t('vendorOrderPayment.receiptAlertDesc', 'Le téléchargement du reçu sera bientôt disponible.'))}
            style={[styles.downloadBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          >
            <Text style={styles.downloadBtnText}>{t('vendorOrderPayment.downloadReceipt', 'Télécharger le reçu')}</Text>
          </Pressable>
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
  title: { fontSize: 17, fontWeight: '900' },
  subtitle: { fontSize: 12.5, marginTop: 2 },
  content: { padding: 20, gap: 14, paddingBottom: 30 },

  card: {
    borderRadius: 18, padding: 18,
    borderWidth: 1,
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  rowCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 13, fontWeight: '600' },
  value: { fontSize: 16, fontWeight: '800', marginTop: 6 },
  amount: { fontSize: 24, fontWeight: '900', marginTop: 6 },
  methodBadge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  methodBadgeText: { fontSize: 12, fontWeight: '900' },

  downloadBtn: {
    height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  downloadBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
