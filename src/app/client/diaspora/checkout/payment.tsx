import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { ArrowLeft, Lock, ShieldCheck, Wallet, CreditCard, Smartphone } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useClient } from '@/contexts/client-context';
import { useDiaspora, formatEur, formatUsd, formatFcfa, buildDeliveryAddress } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';
import { ApiError, initierPayPal, confirmerPayPal, initierStripe, confirmerStripe } from '@/services/api';

const FALLBACK_DELIVERY_FEE = 2000;

type PaymentMethodId = 'paypal' | 'stripe' | 'card';

export default function DiasporaPaymentScreen() {
  const { subtotal, resolveZoneForQuartier, placeOrder } = useClient();
  const { selectedBeneficiary, deliveryInstructions, setLastOrder, usdRate, eurRate } = useDiaspora();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState<PaymentMethodId>('stripe');
  const [processing, setProcessing] = useState(false);

  const METHODS = [
    { id: 'paypal' as const, name: t('diaspora.payment.paypalName', 'PayPal'), detail: t('diaspora.payment.paypalDetail', 'Payer avec votre compte PayPal'), icon: Wallet, color: '#0070BA', bg: '#EAF4FF' },
    { id: 'stripe' as const, name: t('diaspora.payment.stripeName', 'Stripe'), detail: t('diaspora.payment.stripeDetail', 'Paiement sécurisé par Stripe'), icon: CreditCard, color: '#635BFF', bg: '#F0EFFF' },
    { id: 'card' as const, name: t('diaspora.payment.cardName', 'Carte bancaire internationale'), detail: t('diaspora.payment.cardDetail', 'Visa, MasterCard, American Express'), icon: CreditCard, color: colors.primary, bg: colors.primarySoft },
  ];

  const zone = selectedBeneficiary ? resolveZoneForQuartier(selectedBeneficiary.quartier || selectedBeneficiary.ville) : null;
  const deliveryFee = zone ? Number(zone.frais_livraison_base) || FALLBACK_DELIVERY_FEE : FALLBACK_DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const method = METHODS.find((m) => m.id === selectedId)!;

  // ── Paiement réel via page hébergée (Stripe Checkout / approbation PayPal) ──────────────────
  // Ouvre la page de paiement dans un navigateur intégré et attend que l'utilisateur revienne sur
  // l'app via son lien profond (mobile://...) — c'est ce retour, détecté par expo-web-browser, qui
  // porte le vrai session_id/order_id à faire vérifier par le serveur. Rien n'est jamais validé
  // sur la seule foi d'une référence inventée côté client.
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

      const redirectUrl = Linking.createURL('client/diaspora/checkout/payment');
      const cancelledMessage = t('diaspora.payment.paymentCancelled', 'Paiement annulé.');

      if (method.id === 'paypal') {
        const { url, order_id } = await initierPayPal(order.commande_id, redirectUrl, redirectUrl);
        if (!order_id) {
          // Mode simulation (clés PayPal absentes côté serveur) : rien de réel à ouvrir dans un navigateur.
          await confirmerPayPal(order.commande_id, 'simulated');
        } else {
          const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);
          if (result.type !== 'success') throw new Error(cancelledMessage);
          const params = Linking.parse(result.url).queryParams;
          if (!params?.PayerID) throw new Error(cancelledMessage);
          const returnedOrderId = (params?.token as string | undefined) || (params?.order_id as string | undefined) || order_id;
          await confirmerPayPal(order.commande_id, returnedOrderId);
        }
      } else {
        // Stripe est utilisé pour les deux : paiement direct Stripe et carte bancaire internationale
        const { url, session_id } = await initierStripe(order.commande_id, redirectUrl, redirectUrl);
        if (!session_id) {
          // Mode simulation (clé Stripe absente côté serveur) : rien de réel à ouvrir dans un navigateur.
          await confirmerStripe(order.commande_id, 'simulated');
        } else {
          const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);
          if (result.type !== 'success') throw new Error(cancelledMessage);
          const returnedSessionId = (Linking.parse(result.url).queryParams?.session_id as string | undefined) || session_id;
          if (!returnedSessionId) throw new Error(cancelledMessage);
          await confirmerStripe(order.commande_id, returnedSessionId);
        }
      }

      setLastOrder({ id: order.commande_id, numeroCommande: order.numero_commande, montantFcfa: order.montant_total });
      router.push('/client/diaspora/checkout/confirmed' as any);
    } catch (err) {
      Alert.alert('Erreur', err instanceof ApiError || err instanceof Error ? err.message : t('diaspora.payment.genericError', 'Impossible de finaliser la commande.'));
    } finally {
      setProcessing(false);
    }
  };


  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('diaspora.payment.title', 'Paiement sécurisé')}</Text>
        <View style={[styles.lockBtn, { backgroundColor: colors.primarySoft }]}>
          <Lock color={colors.primary} size={20} />
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
                style={[
                  styles.methodRow,
                  { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
                  isSelected && { borderColor: m.color, borderWidth: 2 },
                ]}
              >
                <View style={[styles.methodIcon, { backgroundColor: m.bg }]}>
                  <Icon color={m.color} size={22} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.methodName, { color: colors.text }]}>{m.name}</Text>
                  <Text style={[styles.methodDetail, { color: colors.textSecondary }]}>{m.detail}</Text>
                </View>
                <View style={[styles.radio, { borderColor: colors.border }, isSelected && { borderColor: m.color }]}>
                  {isSelected && <View style={[styles.radioInner, { backgroundColor: m.color }]} />}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}

        <Animated.View entering={FadeInUp.duration(400).delay(320).springify()} style={[styles.breakdownCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>{t('diaspora.payment.subtotalLabel', 'Sous-total produits')}</Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>{formatFcfa(subtotal)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>{t('diaspora.payment.deliveryFeeLabel', 'Frais de livraison')}</Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>{formatFcfa(deliveryFee)}</Text>
          </View>
          <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabelBold, { color: colors.text }]}>{t('diaspora.payment.exchangeRateLabel', 'Taux de change appliqué')}</Text>
          </View>
          <Text style={[styles.rateText, { color: colors.textSecondary }]}>
            1 € = {eurRate.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA · 1 $ = {usdRate.toLocaleString('fr-FR')} FCFA
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(360).springify()} style={[styles.totalCard, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
          <Text style={[styles.totalLabel, { color: colors.primarySoft }]}>{t('diaspora.payment.totalLabel', 'Total à payer')}</Text>
          <Text style={[styles.totalFcfa, { color: colors.textInverse }]}>{formatFcfa(total)}</Text>
          <Text style={[styles.totalEur, { color: colors.primarySoft }]}>≈ {formatEur(total)} · ≈ {formatUsd(total)}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(440).springify()}>
          <Pressable onPress={handlePay} disabled={processing} style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }, processing && { opacity: 0.7 }]}>
            {processing ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('diaspora.payment.payButton', 'Payer maintenant')}</Text>
            )}
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(500).springify()} style={styles.secureNote}>
          <ShieldCheck color={colors.success} size={15} />
          <Text style={[styles.secureNoteText, { color: colors.textSecondary }]}>{t('diaspora.payment.secureNote', 'Vos données sont 100% sécurisées')}</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '900', flex: 1 },
  lockBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 14, paddingBottom: 30 },

  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 16,
    borderWidth: 1.5,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  methodIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  methodName: { fontSize: 15.5, fontWeight: '800' },
  methodDetail: { fontSize: 12.5, marginTop: 3 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 13, height: 13, borderRadius: 7 },

  breakdownCard: {
    borderRadius: 18, padding: 18,
    borderWidth: 1.5,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownLabel: { fontSize: 13.5, fontWeight: '600' },
  breakdownValue: { fontSize: 13.5, fontWeight: '800' },
  breakdownLabelBold: { fontSize: 13, fontWeight: '800' },
  breakdownDivider: { height: 1, marginVertical: 10 },
  rateText: { fontSize: 12.5, marginTop: 4, fontWeight: '600' },

  totalCard: {
    borderRadius: 20, padding: 22, alignItems: 'center', marginTop: 6,
    shadowOpacity: 0.2, shadowRadius: 14, elevation: 5,
  },
  totalLabel: { fontSize: 13, fontWeight: '700' },
  totalFcfa: { fontSize: 26, fontWeight: '900', marginTop: 6 },
  totalEur: { fontSize: 15, marginTop: 4, fontWeight: '700' },

  button: {
    height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  buttonText: { fontSize: 18, fontWeight: '800' },

  secureNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: -4 },
  secureNoteText: { fontSize: 12.5 },
});
