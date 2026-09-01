import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Phone, Landmark, CreditCard, Check, DollarSign, History } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useVendor } from '@/contexts/vendor-context';
import { useClient } from '@/contexts/client-context';
import { useLanguage } from '@/contexts/language-context';
import { demanderRetraitVendeur, fetchHistoriqueRetraitsVendeur, type ApiVendeurRetrait } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type PaymentType = 'mtn' | 'airtel' | 'bank';

export default function VendorBankingScreen() {
  const { colors, isDark } = useTheme();
  const { stats, numeroMobileMoneyReception, updateNumeroMobileMoneyReception } = useVendor();
  const { currentUser } = useClient();
  const { t } = useLanguage();

  const METHODS: { id: PaymentType; apiMethod: 'mtn_momo' | 'airtel_money' | 'virement'; label: string; desc: string; icon: any }[] = [
    { id: 'mtn', apiMethod: 'mtn_momo', label: t('vendorBanking.mtnLabel', 'MTN Mobile Money'), desc: t('vendorBanking.mtnDesc', 'Paiement via MTN MoMo'), icon: Phone },
    { id: 'airtel', apiMethod: 'airtel_money', label: t('vendorBanking.airtelLabel', 'Airtel Money'), desc: t('vendorBanking.airtelDesc', 'Paiement via Airtel Money'), icon: CreditCard },
    { id: 'bank', apiMethod: 'virement', label: t('vendorBanking.bankLabel', 'Virement bancaire'), desc: t('vendorBanking.bankDesc', 'Compte bancaire'), icon: Landmark },
  ];

  const [method, setMethod] = useState<PaymentType>('mtn');
  // Ne démarrent plus sur un faux numéro / faux nom fixes (le même pour tous les vendeurs) qui
  // laissaient croire à des coordonnées réelles déjà enregistrées : l'état honnête tant que rien
  // n'est chargé est un champ vide, rempli dès que les vraies données arrivent (voir les deux
  // useEffect ci-dessous — ils n'écrasent jamais une saisie déjà commencée par le vendeur).
  const [numero, setNumero] = useState('');
  const [titulaire, setTitulaire] = useState('');
  const [montant, setMontant] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!numero && numeroMobileMoneyReception) setNumero(numeroMobileMoneyReception);
  }, [numeroMobileMoneyReception]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!titulaire && currentUser?.nom_complet) setTitulaire(currentUser.nom_complet);
  }, [currentUser?.nom_complet]); // eslint-disable-line react-hooks/exhaustive-deps

  const [historique, setHistorique] = useState<ApiVendeurRetrait[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await fetchHistoriqueRetraitsVendeur();
      setHistorique(data);
    } catch (_err) {
      // mode démo / fallback local
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const minRetrait = stats.retraitMontantMinimum;

  const handleDemandeRetrait = async () => {
    const montantNum = parseFloat(montant.trim());
    if (!montantNum || montantNum < minRetrait) {
      alert(t('vendorBanking.invalidAmountTitle', 'Montant invalide'), `${t('vendorBanking.invalidAmountDescPrefix', 'Le montant minimum de retrait est de')} ${minRetrait.toLocaleString('fr-FR')} FCFA.`);
      return;
    }
    if (!numero.trim()) {
      alert(t('vendorBanking.missingNumberTitle', 'Numéro manquant'), t('vendorBanking.missingNumberDesc', 'Veuillez saisir votre numéro mobile ou RIB.'));
      return;
    }

    const selectedConfig = METHODS.find((m) => m.id === method)!;
    setSubmitting(true);
    try {
      await demanderRetraitVendeur({
        montant: montantNum,
        methode_retrait: selectedConfig.apiMethod,
        numero_reception: numero.trim(),
      });

      // Retient le numéro mobile money pour les prochains retraits (vendeurs.numero_mobile_money_
      // reception) — ce champ existait déjà côté contexte/serveur mais n'était appelé nulle part :
      // le vendeur devait ressaisir son numéro à chaque demande. Ignoré pour "virement" (RIB, pas
      // un numéro mobile money) ; best-effort, une erreur ici ne doit pas remettre en cause le
      // retrait déjà soumis avec succès.
      if (method !== 'bank' && numero.trim() !== numeroMobileMoneyReception) {
        updateNumeroMobileMoneyReception(numero.trim()).catch(() => {});
      }

      alert(t('vendorBanking.requestSentTitle', '✅ Demande envoyée'), `${t('vendorBanking.requestSentDescPrefix', 'Votre demande de retrait de')} ${montantNum.toLocaleString('fr-FR')} FCFA ${t('vendorBanking.requestSentDescSuffix', 'a été soumise avec succès.')}`, [
        { text: 'OK', onPress: () => { setMontant(''); loadHistory(); } },
      ]);
    } catch (err: any) {
      alert('Erreur', err.message || t('vendorBanking.errorDefault', 'Impossible d\'envoyer la demande de retrait.'));
    } finally {
      setSubmitting(false);
    }
  };

  const totalRevenue = Math.round(typeof stats.chiffreAffaires === 'number' ? stats.chiffreAffaires : parseFloat(stats.chiffreAffaires) || 0);
  const totalRetraits = historique.reduce((acc, r) => {
    if (r.statut === 'valide' || r.statut === 'en_attente') {
      const val = typeof r.montant === 'number' ? r.montant : parseFloat(r.montant) || 0;
      return acc + val;
    }
    return acc;
  }, 0);
  const soldeDisponible = Math.max(0, totalRevenue - totalRetraits);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorBanking.title', 'Retrait & Coordonnées')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Solde Card */}
        <Animated.View entering={FadeInUp.duration(350).springify()} style={[styles.soldeCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.soldeLabel}>{t('vendorBanking.availableBalance', 'Solde disponible')}</Text>
          <Text style={styles.soldeAmount}>
            {soldeDisponible.toLocaleString('fr-FR')} FCFA
          </Text>
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(350).delay(60).springify()} style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          {t('vendorBanking.withdrawMethod', 'MÉTHODE DE RETRAIT')}
        </Animated.Text>

        {METHODS.map((m, i) => {
          const Icon = m.icon;
          const selected = method === m.id;
          return (
            <Animated.View key={m.id} entering={FadeInUp.duration(350).delay(100 + i * 70).springify()}>
              <Pressable
                onPress={() => setMethod(m.id)}
                style={[styles.methodCard, { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border }]}
              >
                <View style={[styles.methodIcon, { backgroundColor: colors.primarySoft }]}>
                  <Icon color={colors.primary} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.methodLabel, { color: colors.text }]}>{m.label}</Text>
                  <Text style={[styles.methodDesc, { color: colors.textSecondary }]}>{m.desc}</Text>
                </View>
                <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.borderStrong }, selected && { backgroundColor: colors.primary }]}>
                  {selected && <Check color="#FFF" size={14} strokeWidth={3} />}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}

        <Animated.View entering={FadeInUp.duration(400).delay(320).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('vendorBanking.withdrawForm', 'FORMULAIRE DE RETRAIT')}</Text>
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('vendorBanking.amountLabel', 'Montant à retirer (FCFA)')}</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
                <DollarSign color={colors.primary} size={18} />
                <TextInput
                  value={montant}
                  onChangeText={setMontant}
                  placeholder={`${t('vendorBanking.amountPlaceholderPrefix', 'Min')} ${minRetrait.toLocaleString('fr-FR')} FCFA`}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                {method === 'bank' ? t('vendorBanking.ibanLabel', 'IBAN / Numéro de compte') : t('vendorBanking.mobileLabel', 'Numéro mobile récepteur')}
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
                <Phone color={colors.primary} size={18} />
                <TextInput
                  value={numero}
                  onChangeText={setNumero}
                  placeholder="+242..."
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('vendorBanking.accountHolderLabel', 'Titulaire du compte')}</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
                <CreditCard color={colors.primary} size={18} />
                <TextInput
                  value={titulaire}
                  onChangeText={setTitulaire}
                  placeholder={t('vendorBanking.accountHolderPlaceholder', 'Nom du titulaire')}
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(400).springify()}>
          <Pressable
            disabled={submitting}
            onPress={handleDemandeRetrait}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveBtnText}>{t('vendorBanking.confirmWithdraw', 'Confirmer la demande de retrait')}</Text>
            )}
          </Pressable>
        </Animated.View>

        {/* Historique retraits */}
        <Animated.View entering={FadeInUp.duration(400).delay(500).springify()}>
          <View style={styles.histHeader}>
            <History color={colors.textSecondary} size={18} />
            <Text style={[styles.sectionLabel, { color: colors.textTertiary, marginTop: 0 }]}>{t('vendorBanking.withdrawHistory', 'HISTORIQUE DES RETRAITS')}</Text>
          </View>

          {loadingHistory ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
          ) : historique.length === 0 ? (
            <Text style={[styles.emptyHist, { color: colors.textSecondary }]}>{t('vendorBanking.noWithdrawals', 'Aucune demande de retrait effectuée.')}</Text>
          ) : (
            historique.map((r) => (
              <View key={r.id} style={[styles.histCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.histAmount, { color: colors.text }]}>
                    {Math.round(typeof r.montant === 'string' ? parseFloat(r.montant) : r.montant).toLocaleString('fr-FR')} FCFA
                  </Text>
                  <Text style={[styles.histSub, { color: colors.textSecondary }]}>
                    {r.methode_retrait.toUpperCase()} · {r.numero_reception}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  r.statut === 'valide' ? { backgroundColor: colors.success + '18' } : r.statut === 'rejete' ? { backgroundColor: colors.error + '18' } : { backgroundColor: colors.warning + '18' }
                ]}>
                  <Text style={[
                    styles.statusText,
                    r.statut === 'valide' ? { color: colors.success } : r.statut === 'rejete' ? { color: colors.error } : { color: colors.warning }
                  ]}>
                    {r.statut === 'valide' ? t('vendorBanking.statusValidated', 'Validé') : r.statut === 'rejete' ? t('vendorBanking.statusRejected', 'Rejeté') : t('vendorBanking.statusPendingShort', 'En attente')}
                  </Text>
                </View>
              </View>
            ))
          )}
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
  title: { fontSize: 19, fontWeight: '900' },
  content: { padding: 20, gap: 14, paddingBottom: 30 },

  soldeCard: { padding: 20, borderRadius: 20, gap: 6 },
  soldeLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
  soldeAmount: { color: '#FFF', fontSize: 26, fontWeight: '900' },

  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 16, borderWidth: 1.5,
  },
  methodIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { fontSize: 15, fontWeight: '800' },
  methodDesc: { fontSize: 12.5, marginTop: 2 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  formCard: { borderRadius: 18, padding: 16, gap: 14, borderWidth: 1 },
  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputWrap: {
    height: 52, borderRadius: 14, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 15 },

  saveBtn: { height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  histHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginBottom: 4 },
  emptyHist: { fontSize: 13, fontStyle: 'italic', marginVertical: 8 },
  histCard: {
    padding: 14, borderRadius: 16, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 8,
  },
  histAmount: { fontSize: 16, fontWeight: '800' },
  histSub: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '800' },
});

