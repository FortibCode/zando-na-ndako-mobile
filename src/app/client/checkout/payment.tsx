/**
 * Écran de paiement – wizard multi-étapes
 *
 * Airtel Money / MTN Mobile Money :
 *   1. Sélection méthode
 *   2. Saisie numéro téléphone
 *   3. Récapitulatif & confirmation
 *   4. Attente USSD (pending – vraie demande envoyée, statut réel interrogé en polling)
 *   5. Résultat (succès / échec)
 *
 * Carte bancaire :
 *   1. Sélection méthode
 *   2. Redirection vers la page de paiement sécurisée Stripe (même flux que la diaspora), retour
 *      vérifié serveur avant de valider — jamais de numéro de carte saisi dans l'app.
 *   3. Résultat (succès / échec)
 *
 * Paiement à la livraison :
 *   1. Sélection méthode
 *   2. Récapitulatif & confirmation directe → confirmed
 */

import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, ZoomIn,
} from 'react-native-reanimated';
import {
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, ShieldCheck, Zap,
  Smartphone, Banknote, Lock, RefreshCw,
  Clock, AlertCircle, Check, CreditCard, Scooter,
  Wallet, Ban, WifiOff,
} from 'lucide-react-native';
import { BLUE, RED, GREEN } from '@/components/client-ui';
import { useClient } from '@/contexts/client-context';
import { useTheme } from '@/contexts/theme-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ApiError,
  confirmerPaiementLivraison,
  initierAirtelMoney, confirmerAirtelMoney,
  initierMtnMoMo, confirmerMtnMoMo,
  initierStripe, confirmerStripe,
  FALLBACK_DELIVERY_FEE,
} from '@/services/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const USSD_TIMEOUT_SECONDS = 180; // 3 minutes

const METHOD_LOGOS = {
  airtel: require('../../../../assets/images/airtel-money.png'),
  mtn:    require('../../../../assets/images/mtn-momo.png'),
  card:   require('../../../../assets/images/visa-mastercard.png'),
  cod:    require('../../../../assets/images/cash-delivery.png'),
} as const;

const METHODS = [
  {
    id: 'airtel',
    name: 'Airtel Money',
    shortName: 'Airtel',
    detail: 'Paiement Mobile Money via Airtel',
    color: '#E30613',
    bgColor: '#FFF0F0',
    brand: 'AIRTEL',
    type: 'mobile_money' as const,
    operator: 'Airtel Congo',
  },
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    shortName: 'MTN MoMo',
    detail: 'Paiement Mobile Money via MTN',
    color: '#FFB800',
    bgColor: '#FFF9E8',
    brand: 'MTN',
    type: 'mobile_money' as const,
    operator: 'MTN Congo',
  },
  {
    id: 'card',
    name: 'Carte bancaire',
    shortName: 'Carte',
    detail: 'Visa · Mastercard · GIMAC',
    color: BLUE,
    bgColor: '#F8FAFF',
    brand: 'CARD',
    type: 'card' as const,
    operator: '',
  },
  {
    id: 'cod',
    name: 'Paiement à la livraison',
    shortName: 'Livraison',
    detail: 'Espèces remises au livreur',
    color: GREEN,
    bgColor: '#EDFAF4',
    brand: 'CASH',
    type: 'cod' as const,
    operator: '',
  },
] as const;

type MethodId = typeof METHODS[number]['id'];

// Étapes du wizard
type Step =
  | 'select'           // Étape 1 – choisir méthode
  | 'mm_phone'         // Étape 2 – saisie numéro (mobile money)
  | 'mm_confirm'       // Étape 3 – récapitulatif avant envoi USSD
  | 'mm_pending'       // Étape 4 – attente USSD / PIN utilisateur
  | 'card_redirecting' // Étape 2 – redirection vers Stripe Checkout (page hébergée)
  | 'cod_confirm'      // Étape 2 – confirmation livraison
  | 'success'          // Résultat OK
  | 'failed';          // Résultat KO

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
}

// ─── Step progress bar ────────────────────────────────────────────────────────
function ProgressBar({ current, total, color }: { current: number; total: number; color: string }) {
  return (
    <View style={prog.wrap}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            prog.dot,
            { backgroundColor: i < current ? color : '#E2E8F0' },
          ]}
        />
      ))}
    </View>
  );
}

const prog = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 5, flex: 1, borderRadius: 3 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PaymentScreen() {
  const { subtotal, selectedPaymentMethod, setSelectedPaymentMethod, selectedAddress, resolveZoneForAddress, placeOrder } = useClient();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const deliveryFee = Number(resolveZoneForAddress(selectedAddress)?.frais_livraison_base) || FALLBACK_DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  const [step, setStep] = useState<Step>('select');
  const [selectedId, setSelectedId] = useState<MethodId>(selectedPaymentMethod as MethodId || 'airtel');
  const method = METHODS.find((m) => m.id === selectedId)!;

  // Mobile Money state
  const [phone, setPhone] = useState('');
  const [ussdTimer, setUssdTimer] = useState(USSD_TIMEOUT_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Référence de transaction unique + état de traitement (anti double-paiement)
  const [txRef, setTxRef] = useState('');
  const [processing, setProcessing] = useState(false);
  const [failReason, setFailReason] = useState<string>('generic');
  const [failMessage, setFailMessage] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{ commandeId: string; numeroCommande: string; montantTotal: number } | null>(null);

  const generateTxRef = useCallback(() => {
    const prefix = method.brand === 'AIRTEL' ? 'AIRTEL' : method.brand === 'MTN' ? 'MTN' : method.brand === 'CARD' ? 'CARD' : 'ZND';
    return `ZNND-${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }, [method.brand]);

  // ── Paiement à la livraison : pas de passerelle externe, juste enregistrer la commande ──
  const runCodOrder = useCallback(async () => {
    const zone = resolveZoneForAddress(selectedAddress);
    if (!zone) {
      throw new Error(t('payment.deliveryUnavailable', 'Livraison indisponible pour ce quartier. Choisissez une autre adresse.'));
    }
    const order = await placeOrder({ zoneId: zone.id });
    await confirmerPaiementLivraison(order.commande_id);
    setOrderResult({ commandeId: order.commande_id, numeroCommande: order.numero_commande, montantTotal: order.montant_total });
    return order;
  }, [resolveZoneForAddress, selectedAddress, placeOrder, t]);

  // ── Carte bancaire : paiement réel via la page hébergée Stripe Checkout (même flux que le
  // paiement diaspora) — ouvre la page dans un navigateur intégré, attend le retour par lien
  // profond, puis fait vérifier le session_id par le serveur. Aucun numéro de carte n'est jamais
  // saisi ni transmis par cette app.
  const handleCardPayment = useCallback(async () => {
    setFailReason('generic');
    setStep('card_redirecting');
    try {
      const zone = resolveZoneForAddress(selectedAddress);
      if (!zone) {
        throw new Error(t('payment.deliveryUnavailable', 'Livraison indisponible pour ce quartier. Choisissez une autre adresse.'));
      }
      const order = await placeOrder({ zoneId: zone.id });
      setOrderResult({ commandeId: order.commande_id, numeroCommande: order.numero_commande, montantTotal: order.montant_total });

      const redirectUrl = Linking.createURL('client/checkout/payment');
      const cancelledMessage = t('payment.paymentCancelled', 'Paiement annulé.');
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

      setTxRef(session_id || `ZNND-CARD-${Date.now().toString(36).toUpperCase()}`);
      setStep('success');
    } catch (err) {
      setFailMessage(err instanceof ApiError || err instanceof Error ? err.message : t('payment.unableToFinalize', 'Impossible de finaliser la commande. Vérifiez votre connexion.'));
      setFailReason('generic');
      setStep('failed');
    }
  }, [resolveZoneForAddress, selectedAddress, placeOrder, t]);

  const mapMtnFailReason = useCallback((reason?: string): string => {
    switch (reason) {
      case 'LOW_BALANCE_OR_PAYEE_LIMIT_REACHED_OR_NOT_ALLOWED':
      case 'NOT_ENOUGH_FUNDS':
        return 'insufficient';
      case 'APPROVAL_REJECTED':
        return 'cancelled';
      case 'EXPIRED':
        return 'timeout';
      default:
        return 'generic';
    }
  }, []);

  // ── Timer USSD + confirmation ─────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'mm_pending') return undefined;

    setUssdTimer(USSD_TIMEOUT_SECONDS);
    timerRef.current = setInterval(() => {
      setUssdTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setFailReason('timeout');
          setStep('failed');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    let cancelled = false;
    let pollTimeout: ReturnType<typeof setTimeout> | null = null;

    // MTN et Airtel Money partagent désormais le même flux réel : demande de paiement envoyée au
    // client, puis on interroge périodiquement le vrai statut de l'opérateur jusqu'à
    // SUCCESSFUL / FAILED / expiration du timer local — plus aucune simulation locale.
    const initier = method.brand === 'MTN' ? initierMtnMoMo : initierAirtelMoney;
    const confirmer = method.brand === 'MTN' ? confirmerMtnMoMo : confirmerAirtelMoney;

    (async () => {
      try {
        const zone = resolveZoneForAddress(selectedAddress);
        if (!zone) throw new Error(t('payment.deliveryUnavailable', 'Livraison indisponible pour ce quartier. Choisissez une autre adresse.'));
        const order = await placeOrder({ zoneId: zone.id });
        if (cancelled) return;
        setOrderResult({ commandeId: order.commande_id, numeroCommande: order.numero_commande, montantTotal: order.montant_total });

        const paiement = await initier(order.commande_id, phone);
        if (cancelled) return;
        setTxRef(paiement.reference_id || paiement.id);

        const poll = async () => {
          if (cancelled) return;
          try {
            const result = await confirmer(paiement.id);
            if (cancelled) return;
            if (result.status === 'valide') {
              clearInterval(timerRef.current!);
              setStep('success');
            } else if (result.status === 'echoue') {
              clearInterval(timerRef.current!);
              setFailReason(mapMtnFailReason(result.reason));
              setFailMessage(result.message || null);
              setStep('failed');
            } else {
              pollTimeout = setTimeout(poll, 4000);
            }
          } catch {
            if (!cancelled) pollTimeout = setTimeout(poll, 4000);
          }
        };
        pollTimeout = setTimeout(poll, 3000);
      } catch (err) {
        if (cancelled) return;
        clearInterval(timerRef.current!);
        setFailMessage(err instanceof ApiError ? err.message : t('payment.unableToFinalize', 'Impossible de finaliser la commande. Vérifiez votre connexion.'));
        setFailReason('generic');
        setStep('failed');
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(timerRef.current!);
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [step, method.brand, phone, resolveZoneForAddress, selectedAddress, placeOrder, t, mapMtnFailReason]);

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (step === 'select') { router.back(); return; }
    if (step === 'mm_phone' || step === 'cod_confirm') { setStep('select'); return; }
    if (step === 'mm_confirm') { setStep('mm_phone'); return; }
    if (step === 'mm_pending' || step === 'card_redirecting') return; // no going back during processing
    setStep('select');
  }, [step]);

  // ── Validation helpers ──────────────────────────────────────────────────────
  const rawPhone = phone.replace(/\D/g, '');
  const isPhoneValid = rawPhone.length === 9;

  // ── Step titles ─────────────────────────────────────────────────────────────
  const stepTitles: Record<Step, { title: string; sub: string }> = {
    select:           { title: t('payment.title', 'Mode de paiement'), sub: t('payment.subtitle', 'Choisissez comment payer') },
    mm_phone:         { title: method.name, sub: `1/3 — ${t('payment.yourNumber', 'Votre numéro')} ${method.shortName}` },
    mm_confirm:       { title: t('common.confirm', 'Confirmer'), sub: `2/3` },
    mm_pending:       { title: t('payment.waitingValidation', 'En attente de votre validation…'), sub: `3/3` },
    card_redirecting: { title: method.name, sub: t('payment.redirectingToStripe', 'Redirection vers le paiement sécurisé…') },
    cod_confirm:      { title: method.name, sub: t('checkout.orderConfirmed', 'Commande confirmée !') },
    success:          { title: t('payment.successTitle', 'Paiement réussi !'), sub: '' },
    failed:           { title: t('payment.failedTitle', 'Paiement échoué'), sub: '' },
  };

  const { title, sub } = stepTitles[step];

  // ── Render steps ─────────────────────────────────────────────────────────────
  const renderStep = () => {
    // ── STEP 1 : METHOD SELECTION ─────────────────────────────────────────────
    if (step === 'select') {
      return (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Total */}
          <Animated.View entering={FadeInDown.duration(350).springify()} style={[s.totalCard, { backgroundColor: colors.primary }]}>
            <Text style={s.totalCardLabel}>{t('payment.totalToPay', 'Total à payer')}</Text>
            <Text style={s.totalCardAmount}>{total.toLocaleString('fr-FR')} FCFA</Text>
            <Text style={s.totalCardSub}>{subtotal.toLocaleString('fr-FR')} + {deliveryFee} {t('checkout.deliveryFee', 'Frais de livraison')}</Text>
          </Animated.View>

          <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>{t('payment.selectMode', 'SÉLECTIONNEZ UN MODE')}</Text>

          {/* Grille 2×2 */}
          <View style={s.methodGrid}>
            {METHODS.map((m, i) => {
              const isSelected = selectedId === m.id;
              return (
                <Animated.View
                  key={m.id}
                  entering={FadeInDown.duration(320).delay(80 + i * 60).springify()}
                  style={s.methodGridCell}
                >
                  <Pressable
                    style={[
                      s.methodCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && { borderColor: m.color, borderWidth: 2.5 },
                    ]}
                    onPress={() => setSelectedId(m.id)}
                  >
                    {/* Radio check en haut à droite */}
                    <View style={[s.gridRadio, { backgroundColor: colors.surface, borderColor: colors.border }, isSelected && { backgroundColor: m.color, borderColor: m.color }]}>
                      {isSelected && <Check color="#FFF" size={13} strokeWidth={3.5} />}
                    </View>

                    {/* Logo carré centré – occupe 75% de la carte */}
                    <View style={[s.methodIcon, { backgroundColor: m.bgColor }]}>
                      <Image
                        source={METHOD_LOGOS[m.id as keyof typeof METHOD_LOGOS]}
                        style={s.methodLogo}
                        contentFit="contain"
                        accessibilityLabel={m.name}
                      />
                    </View>

                    {/* Nom en bas */}
                    <Text
                      numberOfLines={2}
                      style={[
                        s.methodName,
                        { color: colors.text },
                        isSelected && { color: m.color },
                      ]}
                    >
                      {m.name}
                    </Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          <Animated.View entering={FadeInUp.duration(300).delay(400).springify()} style={s.secureNote}>
            <ShieldCheck color={colors.fresh} size={15} />
            <Text style={[s.secureNoteText, { color: colors.textSecondary }]}>{t('payment.secureNote', 'Paiements sécurisés · Zando na Ndako v1.0')}</Text>
          </Animated.View>
        </ScrollView>
      );
    }

    // ── STEP 2 MM : NUMÉRO DE TÉLÉPHONE ─────────────────────────────────────
    if (step === 'mm_phone') {
      return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.content}>
            {/* Operator badge */}
            <Animated.View entering={ZoomIn.duration(400).springify()} style={[s.operatorBadge, { borderColor: method.color + '40', backgroundColor: method.bgColor }]}>
              <Image
                source={METHOD_LOGOS[method.id as keyof typeof METHOD_LOGOS]}
                style={s.operatorLogo}
                contentFit="fill"
                accessibilityLabel={method.name}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(350).delay(80).springify()} style={[s.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.formLabel, { color: colors.text }]}>{t('payment.yourNumber', 'Votre numéro')} {method.shortName}</Text>
              <Text style={[s.formHint, { color: colors.textSecondary }]}>
                {t('payment.numberHint', 'Entrez le numéro de téléphone associé à votre compte')} {method.name}.
              </Text>

              <View style={[s.phoneRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <View style={[s.flagBox, { backgroundColor: colors.backgroundAlt, borderRightColor: colors.border }]}>
                  <Text style={s.flag}>🇨🇬</Text>
                  <Text style={[s.flagCode, { color: colors.text }]}>+242</Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={(t) => setPhone(formatPhone(t))}
                  placeholder="06 XXX XX XX"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  style={[s.phoneInput, { color: colors.text }]}
                  maxLength={13}
                  autoFocus
                />
              </View>

              {rawPhone.length > 0 && !isPhoneValid && (
                <View style={s.errorRow}>
                  <AlertCircle color={RED} size={13} />
                  <Text style={s.errorText}>{t('payment.invalidNumber', 'Numéro invalide — 9 chiffres requis')}</Text>
                </View>
              )}
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(300).delay(160).springify()} style={[s.infoBox, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
              <Smartphone color={method.color} size={16} />
              <Text style={[s.infoText, { color: colors.textSecondary }]}>
                {t('payment.ussdNote', 'Une notification USSD sera envoyée sur ce numéro. Vous devrez entrer votre code PIN pour valider.')}
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      );
    }

    // ── STEP 3 MM : RÉCAPITULATIF + ENVOI USSD ───────────────────────────────
    if (step === 'mm_confirm') {
      return (
        <ScrollView contentContainerStyle={s.content}>
          <Animated.View entering={FadeInDown.duration(300).springify()} style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.summaryTitle, { color: colors.text }]}>{t('payment.summaryTitle', 'Récapitulatif du paiement')}</Text>

            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>{t('payment.operator', 'Opérateur')}</Text>
              <View style={[s.brandPill, { backgroundColor: method.color }]}>
                <Text style={s.brandPillText}>{method.brand}</Text>
              </View>
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />

            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>{t('payment.number', 'Numéro')}</Text>
              <Text style={[s.summaryValue, { color: colors.text }]}>+242 {phone}</Text>
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />

            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>{t('payment.subtotalLabel', 'Sous-total')}</Text>
              <Text style={[s.summaryValue, { color: colors.text }]}>{subtotal.toLocaleString('fr-FR')} FCFA</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>{t('payment.deliveryLabel', 'Livraison')}</Text>
              <Text style={[s.summaryValue, { color: colors.text }]}>{deliveryFee} FCFA</Text>
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />

            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { fontWeight: '900', color: colors.primary }]}>{t('payment.totalLabel', 'TOTAL')}</Text>
              <Text style={[s.amountBig, { color: colors.primary }]}>{total.toLocaleString('fr-FR')} FCFA</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(300).delay(120).springify()} style={[s.infoBox, { backgroundColor: '#FFF9E8', borderColor: '#FFB80040' }]}>
            <AlertCircle color="#D97706" size={16} />
            <Text style={[s.infoText, { color: '#92400E' }]}>
              {t('payment.ussdConfirmNote', 'En confirmant, un message USSD sera immédiatement envoyé au numéro indiqué. Restez prêt à entrer votre code PIN.')} <Text style={{ fontWeight: '900' }}>+242 {phone}</Text>
            </Text>
          </Animated.View>
        </ScrollView>
      );
    }

    // ── STEP 4 MM : ATTENTE USSD ─────────────────────────────────────────────
    if (step === 'mm_pending') {
      return (
        <Animated.View entering={FadeIn.duration(400)} style={s.pendingWrap}>
          <Animated.View entering={ZoomIn.duration(500).springify()} style={[s.pendingPhone, { borderColor: method.color }]}>
            <Image
              source={METHOD_LOGOS[method.id as keyof typeof METHOD_LOGOS]}
              style={s.pendingLogo}
              contentFit="fill"
              accessibilityLabel={method.name}
            />
          </Animated.View>

          <Animated.Text entering={FadeInDown.duration(400).delay(200).springify()} style={[s.pendingTitle, { color: colors.text }]}>
            {t('payment.checkPhone', 'Vérifiez votre téléphone !')}
          </Animated.Text>

          <Animated.Text entering={FadeInDown.duration(400).delay(300).springify()} style={[s.pendingDesc, { color: colors.textSecondary }]}>
            {t('payment.ussdSentTo', 'Un message USSD a été envoyé au')}{'\n'}
            <Text style={[s.pendingPhone2, { color: method.color }]}>+242 {phone}</Text>{'\n\n'}
            {t('payment.enterPin', 'Entrez votre code PIN')} <Text style={{ fontWeight: '900' }}>{method.shortName}</Text> {t('payment.onPopupToValidate', 'sur le pop-up de votre téléphone pour valider le paiement de')}{' '}
            <Text style={{ fontWeight: '900', color: BLUE }}>{total.toLocaleString('fr-FR')} FCFA</Text>.
          </Animated.Text>

          {/* Timer */}
          <Animated.View entering={FadeInUp.duration(400).delay(400).springify()} style={[s.timerBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Clock color={method.color} size={18} />
            <Text style={[s.timerLabel, { color: colors.textSecondary }]}>{t('payment.expiresIn', 'Expire dans')}</Text>
            <Text style={[s.timerValue, { color: ussdTimer < 30 ? colors.error : colors.text }]}>
              {formatTimer(ussdTimer)}
            </Text>
          </Animated.View>

          {/* Loading */}
          <ActivityIndicator color={method.color} size="large" style={{ marginTop: 24 }} />
          <Text style={[s.pendingWaiting, { color: colors.textTertiary }]}>{t('payment.waitingValidation', 'En attente de votre validation…')}</Text>

          {/* Retry */}
          <Pressable
            style={s.retryBtn}
            onPress={() => {
              clearInterval(timerRef.current!);
              setStep('mm_phone');
            }}
          >
            <RefreshCw color={colors.textSecondary} size={14} />
            <Text style={[s.retryText, { color: colors.textSecondary }]}>{t('payment.wrongNumber', 'Mauvais numéro ? Recommencer')}</Text>
          </Pressable>
        </Animated.View>
      );
    }

    // ── STEP 2 CARD : REDIRECTION VERS STRIPE CHECKOUT ───────────────────────
    if (step === 'card_redirecting') {
      return (
        <Animated.View entering={FadeIn.duration(400)} style={s.pendingWrap}>
          <Animated.View entering={ZoomIn.duration(500).springify()} style={[s.pendingPhone, { borderColor: method.color }]}>
            <CreditCard color={method.color} size={40} />
          </Animated.View>

          <Animated.Text entering={FadeInDown.duration(400).delay(200).springify()} style={[s.pendingTitle, { color: colors.text }]}>
            {t('payment.redirectingToStripe', 'Redirection vers le paiement sécurisé…')}
          </Animated.Text>

          <Animated.Text entering={FadeInDown.duration(400).delay(300).springify()} style={[s.pendingDesc, { color: colors.textSecondary }]}>
            {t('payment.stripeNote', 'Vous allez être redirigé vers une page de paiement sécurisée pour saisir votre carte. Aucune donnée de carte ne transite jamais par cette application.')}
          </Animated.Text>

          <ActivityIndicator color={method.color} size="large" style={{ marginTop: 24 }} />
        </Animated.View>
      );
    }

    // ── STEP 2 COD : CONFIRMATION LIVRAISON ──────────────────────────────────
    if (step === 'cod_confirm') {
      return (
        <ScrollView contentContainerStyle={s.content}>
          <Animated.View entering={ZoomIn.duration(400).springify()} style={[s.codIllus, { backgroundColor: colors.freshSoft }]}>
            <Scooter color={GREEN} size={44} />
          </Animated.View>

          <Animated.Text entering={FadeInDown.duration(300).delay(100).springify()} style={[s.otpTitle, { color: colors.text }]}>
            {t('payment.codTitle', 'Paiement à la livraison')}
          </Animated.Text>

          <Animated.View entering={FadeInDown.duration(350).delay(180).springify()} style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>{t('payment.amountToPrepare', 'Montant à préparer')}</Text>
              <Text style={[s.amountBig, { color: colors.primary }]}>{total.toLocaleString('fr-FR')} FCFA</Text>
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>{t('payment.subtotalLabel', 'Sous-total')}</Text>
              <Text style={[s.summaryValue, { color: colors.text }]}>{subtotal.toLocaleString('fr-FR')} FCFA</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>{t('checkout.deliveryFee', 'Frais de livraison')}</Text>
              <Text style={[s.summaryValue, { color: colors.text }]}>{deliveryFee} FCFA</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(300).delay(260).springify()} style={[s.infoBox, { backgroundColor: '#EDFAF4', borderColor: '#10B98140' }]}>
            <Banknote color={GREEN} size={15} />
            <Text style={[s.infoText, { color: '#15803D' }]}>
              {t('payment.codNote', "Préparez le montant exact en espèces. Le livreur ne dispose pas toujours de monnaie. Aucun paiement anticipé n'est requis.")}
            </Text>
          </Animated.View>
        </ScrollView>
      );
    }

    // ── SUCCESS ───────────────────────────────────────────────────────────────
    if (step === 'success') {
      const now = new Date();
      const dateStr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const txNumber = txRef || `ZNND-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      return (
        <Animated.View entering={FadeIn.duration(500)} style={s.resultWrap}>
          <Animated.View entering={ZoomIn.duration(600).springify()} style={s.resultCircleOk}>
            <CheckCircle2 color="#FFF" size={56} />
          </Animated.View>
          <Text style={[s.resultTitle, { color: colors.text }]}>{t('payment.successTitle', 'Paiement réussi !')}</Text>
          <Text style={[s.resultDesc, { color: colors.textSecondary }]}>
            {method.type === 'mobile_money'
              ? t('payment.successMobileMoney', 'Transaction confirmée. Votre commande est en cours de préparation.')
              : method.type === 'card'
              ? t('payment.successCard', 'Votre carte a été débitée avec succès.')
              : t('payment.successCod', "Votre commande est confirmée. Le paiement s'effectuera à la livraison.")}
          </Text>

          {/* Détails de la transaction */}
          <View style={[s.txDetails, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.txRow}>
              <Text style={[s.txLabel, { color: colors.textSecondary }]}>{t('payment.reference', 'Référence')}</Text>
              <Text style={[s.txValue, { color: colors.text }]}>{txNumber}</Text>
            </View>
            <View style={[s.txDivider, { backgroundColor: colors.border }]} />
            <View style={s.txRow}>
              <Text style={[s.txLabel, { color: colors.textSecondary }]}>{t('payment.amount', 'Montant')}</Text>
              <Text style={[s.amountBig, { color: GREEN }]}>{total.toLocaleString('fr-FR')} FCFA</Text>
            </View>
            <View style={[s.txDivider, { backgroundColor: colors.border }]} />
            <View style={s.txRow}>
              <Text style={[s.txLabel, { color: colors.textSecondary }]}>{t('payment.date', 'Date')}</Text>
              <Text style={[s.txValue, { color: colors.text }]}>{dateStr} à {timeStr}</Text>
            </View>
            {method.type === 'mobile_money' && (
              <>
                <View style={[s.txDivider, { backgroundColor: colors.border }]} />
                <View style={s.txRow}>
                  <Text style={[s.txLabel, { color: colors.textSecondary }]}>{t('payment.operator', 'Opérateur')}</Text>
                  <View style={[s.brandPill, { backgroundColor: method.color }]}>
                    <Text style={s.brandPillText}>{method.brand}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          <Pressable
            style={s.resultBtn}
            onPress={() => {
              const numero = orderResult?.numeroCommande || txNumber;
              const montant = orderResult?.montantTotal ?? total;
              const idParam = orderResult?.commandeId ? `&id=${encodeURIComponent(orderResult.commandeId)}` : '';
              router.push(`/client/checkout/confirmed?numero=${encodeURIComponent(numero)}&montant=${montant}${idParam}` as any);
            }}
          >
            <Text style={s.resultBtnText}>{t('payment.continueArrow', 'Continuer')}</Text>
            <ArrowRight color="#FFF" size={18} />
          </Pressable>
        </Animated.View>
      );
    }

    // ── FAILED ────────────────────────────────────────────────────────────────
    if (step === 'failed') {
      const failureReasons: Record<string, { title: string; icon: typeof XCircle }> = {
        generic:         { title: t('payment.failedGeneric', "La transaction n'a pas pu être finalisée."), icon: XCircle },
        wrong_pin:       { title: t('payment.failedWrongPin', 'Code PIN incorrect. Vérifiez votre code et réessayez.'), icon: Lock },
        insufficient:    { title: t('payment.failedInsufficient', 'Fonds insuffisants. Approvisionnez votre compte et réessayez.'), icon: Wallet },
        cancelled:       { title: t('payment.failedCancelled', "Paiement annulé par l'utilisateur."), icon: Ban },
        timeout:         { title: t('payment.failedTimeout', 'Délai dépassé. La session a expiré.'), icon: Clock },
        network_error:   { title: t('payment.failedNetwork', 'Erreur réseau. Vérifiez votre connexion et réessayez.'), icon: WifiOff },
      };
      const reason = failureReasons[failReason] || failureReasons.generic;
      return (
        <Animated.View entering={FadeIn.duration(500)} style={s.resultWrap}>
          <Animated.View entering={ZoomIn.duration(600).springify()} style={s.resultCircleErr}>
            <XCircle color="#FFF" size={56} />
          </Animated.View>
          <Text style={[s.resultTitle, { color: RED }]}>{t('payment.failedTitle', 'Paiement échoué')}</Text>
          <View style={s.failReasonRow}>
            <reason.icon color={RED} size={20} />
            <Text style={[s.resultDesc, { color: colors.text, flexShrink: 1 }]}>{reason.title}</Text>
          </View>
          {Boolean(failMessage) && (
            <Text style={[s.resultDesc, { color: RED, fontSize: 13 }]}>{failMessage}</Text>
          )}

          {(method.type === 'mobile_money') && (
            <Animated.View
              entering={FadeInUp.duration(300).delay(100).springify()}
              style={[s.infoBox, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A540' }]}
            >
              <AlertCircle color={RED} size={16} />
              <Text style={[s.infoText, { color: '#991B1B' }]}>
                {t('payment.mobileMoneyFailNote', 'Assurez-vous d’avoir suffisamment de fonds sur votre compte. Vérifiez votre code PIN et la connexion réseau de votre téléphone.')}
              </Text>
            </Animated.View>
          )}

          {method.type === 'card' && (
            <Animated.View
              entering={FadeInUp.duration(300).delay(100).springify()}
              style={[s.infoBox, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A540' }]}
            >
              <AlertCircle color={RED} size={16} />
              <Text style={[s.infoText, { color: '#991B1B' }]}>
                {t('payment.cardFailNote', 'Vérifiez que votre carte est valide et non expirée. Contactez votre banque si le problème persiste.')}
              </Text>
            </Animated.View>
          )}

          <View style={{ width: '100%', gap: 10, marginTop: 8 }}>
            <Pressable
              style={[s.resultBtn, { backgroundColor: RED }]}
              onPress={() => setStep('select')}
            >
              <Text style={s.resultBtnText}>{t('payment.changeMethod', 'Changer de mode de paiement')}</Text>
            </Pressable>
            <Pressable
              style={[s.retryBtn, {
                width: '100%', height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
                justifyContent: 'center', alignItems: 'center',
              }]}
              onPress={() => {
                if (method.type === 'mobile_money') setStep('mm_phone');
                else if (method.type === 'card') handleCardPayment();
                else setStep('select');
              }}
            >
              <RefreshCw color={colors.primary} size={16} />
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '800' }}>{t('payment.retry', 'Réessayer')}</Text>
            </Pressable>
          </View>
        </Animated.View>
      );
    }

    return null;
  };

  // ── Footer CTA ───────────────────────────────────────────────────────────────
  const renderFooter = () => {
    const accentColor = method.color;
    if (step === 'mm_pending' || step === 'card_redirecting' || step === 'success' || step === 'failed') return null;

    let label = t('common.continue', 'Continuer');
    let disabled = false;
    let onPress = () => {};

    if (step === 'select') {
      label = t('common.continue', 'Continuer');
      onPress = () => {
        setSelectedPaymentMethod(selectedId);
        if (method.type === 'mobile_money') setStep('mm_phone');
        else if (method.type === 'card') handleCardPayment();
        else setStep('cod_confirm');
      };
    } else if (step === 'mm_phone') {
      label = t('payment.sendUssdCode', 'Envoyer le code USSD');
      disabled = !isPhoneValid;
      onPress = () => {
        setFailReason('generic');
        setProcessing(true);
        setTimeout(() => {
          setProcessing(false);
          setTxRef(generateTxRef());
          setStep('mm_confirm');
        }, 600);
      };
    } else if (step === 'mm_confirm') {
      label = `${t('payment.sendNotificationTo', 'Envoyer la notification à')} +242 ${phone}`;
      disabled = processing;
      onPress = () => {
        setProcessing(true);
        setTimeout(() => {
          setProcessing(false);
          setStep('mm_pending');
        }, 800);
      };
    } else if (step === 'cod_confirm') {
      label = t('payment.confirmMyOrder', 'Confirmer ma commande');
      disabled = processing;
      onPress = () => {
        setProcessing(true);
        setTxRef(generateTxRef());
        runCodOrder()
          .then((order) => {
            router.push(`/client/checkout/confirmed?numero=${encodeURIComponent(order.numero_commande)}&montant=${order.montant_total}&id=${encodeURIComponent(order.commande_id)}` as any);
          })
          .catch((err) => {
            setFailMessage(err instanceof ApiError ? err.message : t('payment.unableToFinalize', 'Impossible de finaliser la commande. Vérifiez votre connexion.'));
            setFailReason('generic');
            setStep('failed');
          })
          .finally(() => setProcessing(false));
      };
    }

    return (
      <View style={[s.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          style={[s.cta, { backgroundColor: disabled ? (isDark ? colors.textTertiary : '#CBD5E1') : accentColor }]}
          onPress={disabled ? undefined : onPress}
          disabled={disabled}
        >
          {processing ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Zap color="#FFF" size={17} fill="#FFF" />
          )}
          <Text style={s.ctaText}>{label}</Text>
        </Pressable>
      </View>
    );
  };

  // ── Render total steps for progress bar ────────────────────────────────────
  const getProgress = (): [number, number] => {
    if (method.type === 'mobile_money') {
      const order: Step[] = ['select', 'mm_phone', 'mm_confirm', 'mm_pending'];
      const i = order.indexOf(step);
      return [i === -1 ? 4 : i + 1, 4];
    }
    if (method.type === 'card') {
      const order: Step[] = ['select', 'card_redirecting'];
      const i = order.indexOf(step);
      return [i === -1 ? 2 : i + 1, 2];
    }
    return [step === 'select' ? 1 : 2, 2];
  };

  const [cur, tot] = getProgress();

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {step !== 'success' && (
          <Pressable onPress={goBack} style={[s.backBtn, { backgroundColor: colors.primarySoft }]}>
            <ArrowLeft color={colors.primary} size={22} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: colors.text }]}>{title}</Text>
          {sub ? <Text style={[s.headerSub, { color: colors.textSecondary }]}>{sub}</Text> : null}
        </View>
        <View style={[s.secureTag, { backgroundColor: colors.freshSoft }]}>
          <ShieldCheck color={colors.fresh} size={13} />
          <Text style={[s.secureTagText, { color: colors.fresh }]}>SSL</Text>
        </View>
      </View>

      {/* Progress bar */}
      {step !== 'success' && step !== 'failed' && (
        <View style={[s.progressWrap, { backgroundColor: colors.surface }]}>
          <ProgressBar current={cur} total={tot} color={method.color} />
        </View>
      )}

      {/* Steps */}
      <View style={{ flex: 1 }}>
        {renderStep()}
      </View>

      {/* Footer */}
      {renderFooter()}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F8FE' },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEF2FA',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: BLUE, fontSize: 19, fontWeight: '900' },
  headerSub: { color: '#64748B', fontSize: 11, marginTop: 1 },
  secureTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EDFAF4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  secureTagText: { color: GREEN, fontSize: 11, fontWeight: '900' },

  progressWrap: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#FFF' },

  content: { padding: 18, gap: 14, paddingBottom: 30 },

  // Method selection
  totalCard: {
    backgroundColor: BLUE, borderRadius: 18, padding: 18,
    alignItems: 'center',
    shadowColor: BLUE, shadowOpacity: 0.2, shadowRadius: 14, elevation: 5,
  },
  totalCardLabel: { color: '#C7D8FF', fontSize: 13, fontWeight: '600' },
  totalCardAmount: { color: '#FFF', fontSize: 30, fontWeight: '900', marginTop: 4 },
  totalCardSub: { color: '#8AAAD8', fontSize: 12, marginTop: 4 },
  sectionLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: -6 },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  methodGridCell: { width: '47.5%' },
  methodCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 12,
    flexDirection: 'column',
    borderWidth: 1.5, borderColor: '#E8EDF5',
    shadowColor: '#0D1B3E', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    position: 'relative',
  },
  gridRadio: {
    position: 'absolute', top: 10, right: 10, zIndex: 1,
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  methodIcon: { width: '100%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  methodLogo: { width: '100%', height: '100%' },
  methodName: { color: BLUE, fontSize: 15, fontWeight: '800' },
  secureNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secureNoteText: { color: '#64748B', fontSize: 12 },

  // Operator
  operatorBadge: {
    borderRadius: 18, borderWidth: 1.5,
    overflow: 'hidden',
    height: 160,
  },
  operatorLogo: { width: '100%', height: '100%' },

  // Form card
  formCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: '#E8EDF5', gap: 12,
    shadowColor: '#0D1B3E', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  formLabel: { color: BLUE, fontSize: 16, fontWeight: '900' },
  formHint: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: -4 },

  // Phone input
  phoneRow: {
    flexDirection: 'row', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    overflow: 'hidden', backgroundColor: '#FFF', height: 54,
  },
  flagBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, backgroundColor: '#F1F5F9', borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  flag: { fontSize: 20 },
  flagCode: { color: BLUE, fontSize: 14, fontWeight: '700' },
  phoneInput: { flex: 1, paddingHorizontal: 14, fontSize: 17, color: BLUE, fontWeight: '700' },
  errorText: { color: RED, fontSize: 12 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  // Info box
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0',
    padding: 14, backgroundColor: '#F8FAFC',
  },
  infoText: { color: '#475569', fontSize: 13, flex: 1, lineHeight: 19 },

  // Summary
  summaryCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 18,
    gap: 10, borderWidth: 1, borderColor: '#E8EDF5',
    shadowColor: '#0D1B3E', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  summaryTitle: { color: BLUE, fontSize: 17, fontWeight: '900', marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#64748B', fontSize: 14 },
  summaryValue: { color: BLUE, fontSize: 14, fontWeight: '700' },
  amountBig: { color: RED, fontSize: 22, fontWeight: '900' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  brandPill: { borderRadius: 7, paddingHorizontal: 10, paddingVertical: 4 },
  brandPillText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  // Pending USSD
  pendingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  pendingPhone: { width: '100%', height: 130, borderRadius: 20, borderWidth: 3, backgroundColor: '#FFF', shadowColor: '#0D1B3E', shadowOpacity: 0.12, shadowRadius: 18, elevation: 8, overflow: 'hidden' },
  pendingLogo: { width: '100%', height: '100%' },
  pendingTitle: { color: BLUE, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  pendingDesc: { color: '#475569', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  pendingPhone2: { fontWeight: '900' },
  timerBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12,
    shadowColor: '#0D1B3E', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  timerLabel: { color: '#64748B', fontSize: 13 },
  timerValue: { fontSize: 20, fontWeight: '900' },
  pendingWaiting: { color: '#94A3B8', fontSize: 13, textAlign: 'center' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  retryText: { color: '#64748B', fontSize: 13 },

  otpTitle: { color: BLUE, fontSize: 22, fontWeight: '900', textAlign: 'center' },

  // COD
  codIllus: { alignSelf: 'center', width: 90, height: 90, borderRadius: 28, backgroundColor: '#EDFAF4', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },

  // Result
  resultWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  resultCircleOk: { width: 110, height: 110, borderRadius: 55, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
  resultCircleErr: { width: 110, height: 110, borderRadius: 55, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', shadowColor: RED, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
  resultTitle: { color: BLUE, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  resultDesc: { color: '#475569', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  failReasonRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },

  // Transaction details (success)
  txDetails: {
    width: '100%', backgroundColor: '#FFF', borderRadius: 18, padding: 18,
    gap: 10, borderWidth: 1, borderColor: '#E8EDF5',
    shadowColor: '#0D1B3E', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  txLabel: { color: '#64748B', fontSize: 13 },
  txValue: { color: BLUE, fontSize: 13, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  txDivider: { height: 1, backgroundColor: '#F1F5F9' },
  resultBtn: {
    width: '100%', height: 56, borderRadius: 18,
    flexDirection: 'row', gap: 8,
    backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center',
    shadowColor: GREEN, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  resultBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },

  // Footer
  footer: { padding: 18, paddingBottom: 26, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEF2FA' },
  cta: {
    height: 56, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  ctaText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
});
