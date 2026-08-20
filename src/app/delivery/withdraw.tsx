import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Banknote, CheckCircle2, Clock3, Smartphone, XCircle } from 'lucide-react-native';
import { Card, DeliveryScreen, Header, PrimaryButton, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { demanderRetraitLivreur, fetchHistoriqueRetraitsLivreur, type DeliveryRetrait } from '@/services/api';

const MIN_RETRAIT = 1000;

export default function Withdraw() {
  const { revenue, fetchRevenue } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const METHODS = [
    { key: 'mtn_momo' as const, label: t('deliveryWithdraw.mtnLabel', 'MTN Mobile Money'), icon: Smartphone },
    { key: 'airtel_money' as const, label: t('deliveryWithdraw.airtelLabel', 'Airtel Money'), icon: Smartphone },
  ];
  const [montant, setMontant] = useState('');
  const [methode, setMethode] = useState<'mtn_momo' | 'airtel_money'>('mtn_momo');
  const [numero, setNumero] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [historique, setHistorique] = useState<DeliveryRetrait[]>([]);
  const [loadingHistorique, setLoadingHistorique] = useState(true);

  const solde = revenue?.solde_disponible ?? 0;

  const loadHistorique = useCallback(async () => {
    setLoadingHistorique(true);
    try {
      const data = await fetchHistoriqueRetraitsLivreur();
      setHistorique(data);
    } catch {
      // l'historique est secondaire : un échec ne bloque pas la demande de retrait
    } finally {
      setLoadingHistorique(false);
    }
  }, []);

  useEffect(() => {
    fetchRevenue();
    loadHistorique();
  }, [fetchRevenue, loadHistorique]);

  const montantNum = parseInt(montant.replace(/[^0-9]/g, ''), 10) || 0;
  const canSubmit = montantNum >= MIN_RETRAIT && montantNum <= solde && numero.trim().length >= 8;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await demanderRetraitLivreur({ montant: montantNum, methodeRetrait: methode, numeroReception: numero.trim() });
      Alert.alert(t('deliveryWithdraw.requestSentTitle', 'Demande envoyée'), t('deliveryWithdraw.requestSentDesc', 'Votre demande de retrait a été soumise et sera traitée sous peu.'));
      setMontant('');
      setNumero('');
      await Promise.all([fetchRevenue(), loadHistorique()]);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || t('deliveryWithdraw.errorDesc', 'Impossible de soumettre la demande de retrait.'));
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, montantNum, methode, numero, fetchRevenue, loadHistorique]);

  const statusMeta: Record<DeliveryRetrait['statut'], { label: string; color: string; icon: any }> = {
    en_attente: { label: t('deliveryWithdraw.statusPending', 'En attente'), color: colors.primary, icon: Clock3 },
    valide: { label: t('deliveryWithdraw.statusValidated', 'Validé'), color: colors.fresh, icon: CheckCircle2 },
    refuse: { label: t('deliveryWithdraw.statusRefused', 'Refusé'), color: colors.error, icon: XCircle },
  };

  return (
    <DeliveryScreen>
      <Header title={t('deliveryWithdraw.title', 'Retirer mes gains')} />

      <Animated.View entering={FadeInDown.duration(350).springify()}>
        <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary, padding: 22 }}>
          <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, fontWeight: '900', letterSpacing: .8 }}>{t('deliveryWithdraw.availableBalance', 'SOLDE DISPONIBLE')}</Text>
          <Text style={{ color: '#FFF', fontSize: 36, fontWeight: '900', marginTop: 10 }}>{solde.toLocaleString('fr-FR')} FCFA</Text>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(60).springify()}>
        <Text style={[styles.sectionTitle, { marginTop: 26, fontSize: 18, color: colors.text }]}>{t('deliveryWithdraw.amountToWithdraw', 'Montant à retirer')}</Text>
        <TextInput
          keyboardType="number-pad"
          placeholder={`${t('deliveryWithdraw.minPrefix', 'Min.')} ${MIN_RETRAIT.toLocaleString('fr-FR')} FCFA`}
          placeholderTextColor={colors.textTertiary}
          value={montant}
          onChangeText={(v) => setMontant(v.replace(/[^0-9]/g, ''))}
          style={{
            height: 56, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16,
            paddingHorizontal: 16, marginTop: 10, fontSize: 18, fontWeight: '800',
            color: colors.text, backgroundColor: colors.surface,
          }}
        />

        <Text style={[styles.sectionTitle, { marginTop: 22, fontSize: 18, color: colors.text }]}>{t('deliveryWithdraw.receptionMethod', 'Méthode de réception')}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          {METHODS.map(({ key, label, icon: Icon }) => (
            <Pressable
              key={key}
              onPress={() => setMethode(key)}
              style={{
                flex: 1, borderWidth: 1.5, borderRadius: 16, padding: 14, alignItems: 'center',
                borderColor: methode === key ? colors.primary : colors.border,
                backgroundColor: methode === key ? colors.primarySoft : colors.surface,
              }}
            >
              <Icon color={methode === key ? colors.primary : colors.textSecondary} size={22} />
              <Text style={{ marginTop: 8, fontSize: 13, fontWeight: '800', color: methode === key ? colors.primary : colors.textSecondary, textAlign: 'center' }}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 22, fontSize: 18, color: colors.text }]}>{t('deliveryWithdraw.receptionNumber', 'Numéro de réception')}</Text>
        <TextInput
          keyboardType="phone-pad"
          placeholder={t('deliveryWithdraw.numberPlaceholder', 'Ex : 06 123 45 67')}
          placeholderTextColor={colors.textTertiary}
          value={numero}
          onChangeText={setNumero}
          style={{
            height: 56, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16,
            paddingHorizontal: 16, marginTop: 10, fontSize: 16, color: colors.text, backgroundColor: colors.surface,
          }}
        />

        {montantNum > 0 && montantNum > solde ? (
          <Text style={{ color: colors.error, fontSize: 13, marginTop: 10, fontWeight: '700' }}>{t('deliveryWithdraw.amountExceedsBalance', 'Le montant dépasse votre solde disponible.')}</Text>
        ) : null}

        <View style={{ opacity: canSubmit && !submitting ? 1 : 0.5 }}>
          <PrimaryButton onPress={canSubmit && !submitting ? handleSubmit : undefined}>
            {submitting ? t('deliveryWithdraw.sending', 'Envoi…') : t('deliveryWithdraw.requestWithdrawal', 'Demander le retrait')}
          </PrimaryButton>
        </View>
      </Animated.View>

      <Text style={[styles.sectionTitle, { marginTop: 32, marginBottom: 14, color: colors.text }]}>{t('deliveryWithdraw.withdrawalHistory', 'Historique des retraits')}</Text>
      {loadingHistorique ? (
        <Text style={[styles.muted, { color: colors.textSecondary }]}>{t('deliveryWithdraw.loading', 'Chargement…')}</Text>
      ) : historique.length === 0 ? (
        <Text style={[styles.muted, { color: colors.textSecondary }]}>{t('deliveryWithdraw.noWithdrawals', 'Aucune demande de retrait pour le moment.')}</Text>
      ) : (
        historique.map((r, i) => {
          const meta = statusMeta[r.statut];
          const StatusIcon = meta.icon;
          return (
            <Card key={r.id} index={Math.min(i, 5)} style={{ marginBottom: 10, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Banknote color={colors.primary} size={20} />
                </View>
                <View>
                  <Text style={[styles.sectionTitle, { fontSize: 16, color: colors.text }]}>{Number(r.montant).toLocaleString('fr-FR')} FCFA</Text>
                  <Text style={[styles.muted, { fontSize: 12, marginTop: 3, color: colors.textSecondary }]}>{new Date(r.date_demande).toLocaleDateString('fr-FR')}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <StatusIcon color={meta.color} size={14} />
                <Text style={{ color: meta.color, fontSize: 12, fontWeight: '900' }}>{meta.label}</Text>
              </View>
            </Card>
          );
        })
      )}
    </DeliveryScreen>
  );
}
