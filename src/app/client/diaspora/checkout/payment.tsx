import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { ArrowLeft, Lock, ShieldCheck, Wallet, CreditCard, Smartphone } from 'lucide-react-native';
import { BLUE, RED, GREEN } from '@/components/client-ui';
import { useClient } from '@/contexts/client-context';
import { useDiaspora, formatEur, formatUsd, formatFcfa, buildDeliveryAddress, FCFA_PER_EUR } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';
import { ApiError, initierPayPal, confirmerPayPal, initierStripe, confirmerStripe } from '@/services/api';

const FALLBACK_DELIVERY_FEE = 2000;

type PaymentMethodId = 'paypal' | 'stripe' | 'card';

export default function DiasporaPaymentScreen() {
  const { subtotal, resolveZoneForQuartier, placeOrder } = useClient();
  const { selectedBeneficiary, deliveryInstructions, setLastOrder, usdRate } = useDiaspora();
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState<PaymentMethodId>('stripe');
  const [processing, setProcessing] = useState(false);

  const METHODS = [
    { id: 'paypal' as const, name: t('diaspora.payment.paypalName', 'PayPal'), detail: t('diaspora.payment.paypalDetail', 'Payer avec votre compte PayPal'), icon: Wallet, color: '#0070BA', bg: '#EAF4FF' },
    { id: 'stripe' as const, name: t('diaspora.payment.stripeName', 'Stripe'), detail: t('diaspora.payment.stripeDetail', 'Paiement sécurisé par Stripe'), icon: CreditCard, color: '#635BFF', bg: '#F0EFFF' },
    { id: 'card' as const, name: t('diaspora.payment.cardName', 'Carte bancaire internationale'), detail: t('diaspora.payment.cardDetail', 'Visa, MasterCard, American Express'), icon: CreditCard, color: BLUE, bg: '#F8FAFF' },
  ];

  const zone = selectedBeneficiary ? resolveZoneForQuartier(selectedBeneficiary.quartier || selectedBeneficiary.ville) : null;
  const deliveryFee = zone ? Number(zone.frais_livraison_base) || FALLBACK_DELIVERY_FEE : FALLBACK_DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const method = METHODS.find((m) => m.id === selectedId)!;

  const handlePay = async () => {
    if (!selectedBeneficiary) {
      Alert.alert(t('diaspora.payment.missingBeneficiary', 'Bénéficiaire manquant'), t('diaspora.payment.missingBeneficiaryDesc', 'Veuillez choisir un bénéficiaire avant de payer.'));
      return;
    }
    setProcessing(true);
    try {
      if (!zone) throw new Error(t('diaspora.payment.zoneUnavailable', 'Livraison indisponible pour ce quartier. Choisissez un autre bénéficiaire.'));

      const order = await placeOrder({
        zoneId: zone.id,
        beneficiaireId: selectedBeneficiary.id,
        isDiaspora: true,
        adresseLivraison: buildDeliveryAddress(selectedBeneficiary, deliveryInstructions),
      });

      const reference = 'ZAND-DIAS-' + String(Math.floor(100000 + Math.random() * 900000)).slice(0, 6);
      if (method.id === 'paypal') {
        await initierPayPal(order.commande_id);
        await confirmerPayPal(order.commande_id, reference);
      } else if (method.id === 'stripe' || method.id === 'card') {
        // Stripe est utilisé pour les deux : paiement direct Stripe et carte bancaire internationale
        await initierStripe(order.commande_id);
        await confirmerStripe(order.commande_id, reference);
      }

      setLastOrder({ id: order.numero_commande, montantFcfa: order.montant_total });
      router.push('/client/diaspora/checkout/confirmed' as any);
    } catch (err) {
      Alert.alert('Erreur', err instanceof ApiError || err instanceof Error ? err.message : t('diaspora.payment.genericError', 'Impossible de finaliser la commande.'));
    } finally {
      setProcessing(false);
    }
  };


  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={BLUE} size={22} />
        </Pressable>
        <Text style={styles.title}>{t('diaspora.payment.title', 'Paiement sécurisé')}</Text>
        <View style={styles.lockBtn}>
          <Lock color={BLUE} size={20} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {METHODS.map((m, i) => {
          const Icon = m.icon;
          const isSelected = selectedId === m.id;
          return (
            <Animated.View key={m.id} entering={FadeInDown.duration(350).delay(80 + i * 80).springify()}>
              <Pressable
                onPress={() => setSelectedId(m.id)}
                style={[styles.methodRow, isSelected && { borderColor: m.color, borderWidth: 2 }]}
              >
                <View style={[styles.methodIcon, { backgroundColor: m.bg }]}>
                  <Icon color={m.color} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodName}>{m.name}</Text>
                  <Text style={styles.methodDetail}>{m.detail}</Text>
                </View>
                <View style={[styles.radio, isSelected && { borderColor: m.color }]}>
                  {isSelected && <View style={[styles.radioInner, { backgroundColor: m.color }]} />}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}

        <Animated.View entering={FadeInUp.duration(400).delay(320).springify()} style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{t('diaspora.payment.subtotalLabel', 'Sous-total produits')}</Text>
            <Text style={styles.breakdownValue}>{formatFcfa(subtotal)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{t('diaspora.payment.deliveryFeeLabel', 'Frais de livraison')}</Text>
            <Text style={styles.breakdownValue}>{formatFcfa(deliveryFee)}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabelBold}>{t('diaspora.payment.exchangeRateLabel', 'Taux de change appliqué')}</Text>
          </View>
          <Text style={styles.rateText}>
            1 € = {FCFA_PER_EUR.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA · 1 $ = {usdRate.toLocaleString('fr-FR')} FCFA
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(360).springify()} style={styles.totalCard}>
          <Text style={styles.totalLabel}>{t('diaspora.payment.totalLabel', 'Total à payer')}</Text>
          <Text style={styles.totalFcfa}>{formatFcfa(total)}</Text>
          <Text style={styles.totalEur}>≈ {formatEur(total)} · ≈ {formatUsd(total)}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(440).springify()}>
          <Pressable onPress={handlePay} disabled={processing} style={[styles.button, processing && { opacity: 0.7 }]}>
            {processing ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>{t('diaspora.payment.payButton', 'Payer maintenant')}</Text>
            )}
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(500).springify()} style={styles.secureNote}>
          <ShieldCheck color={GREEN} size={15} />
          <Text style={styles.secureNoteText}>{t('diaspora.payment.secureNote', 'Vos données sont 100% sécurisées')}</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFE' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E8ECF2',
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center' },
  title: { color: BLUE, fontSize: 19, fontWeight: '900', flex: 1 },
  lockBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 14, paddingBottom: 30 },

  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFF', borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: '#E8ECF2',
    shadowColor: '#1A2744', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  methodIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  methodName: { color: BLUE, fontSize: 15.5, fontWeight: '800' },
  methodDetail: { color: '#64748B', fontSize: 12.5, marginTop: 3 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#C8D0DE', alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 13, height: 13, borderRadius: 7 },

  breakdownCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 18,
    borderWidth: 1.5, borderColor: '#E8ECF2',
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownLabel: { color: '#64748B', fontSize: 13.5, fontWeight: '600' },
  breakdownValue: { color: BLUE, fontSize: 13.5, fontWeight: '800' },
  breakdownLabelBold: { color: BLUE, fontSize: 13, fontWeight: '800' },
  breakdownDivider: { height: 1, backgroundColor: '#EEF2FA', marginVertical: 10 },
  rateText: { color: '#64748B', fontSize: 12.5, marginTop: 4, fontWeight: '600' },

  totalCard: {
    backgroundColor: BLUE, borderRadius: 20, padding: 22, alignItems: 'center', marginTop: 6,
    shadowColor: BLUE, shadowOpacity: 0.2, shadowRadius: 14, elevation: 5,
  },
  totalLabel: { color: '#C7D8FF', fontSize: 13, fontWeight: '700' },
  totalFcfa: { color: '#FFF', fontSize: 26, fontWeight: '900', marginTop: 6 },
  totalEur: { color: '#8AAAD8', fontSize: 15, marginTop: 4, fontWeight: '700' },

  button: {
    height: 60, borderRadius: 18, backgroundColor: RED, alignItems: 'center', justifyContent: 'center',
    shadowColor: RED, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  secureNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: -4 },
  secureNoteText: { color: '#64748B', fontSize: 12.5 },
});
