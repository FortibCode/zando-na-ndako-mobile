import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ArrowLeft, AlertTriangle, PackageX, PackageSearch, PackageOpen, FileWarning,
  ListX, Truck, CreditCard, RotateCcw, HelpCircle,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { ouvrirLitige, type LitigeMotif } from '@/services/api';

const MOTIFS: { value: LitigeMotif; icon: any }[] = [
  { value: 'produit_non_recu', icon: PackageX },
  { value: 'produit_incorrect', icon: PackageSearch },
  { value: 'produit_endommage', icon: PackageOpen },
  { value: 'produit_non_conforme', icon: FileWarning },
  { value: 'article_manquant', icon: ListX },
  { value: 'probleme_livraison', icon: Truck },
  { value: 'probleme_paiement', icon: CreditCard },
  { value: 'probleme_remboursement', icon: RotateCcw },
  { value: 'autre', icon: HelpCircle },
];

export default function NewDisputeScreen() {
  const { commandeId } = useLocalSearchParams<{ commandeId: string }>();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const motifLabel = (m: LitigeMotif) => ({
    produit_non_recu: t('clientDisputeNew.motifNotReceived', 'Produit non reçu'),
    produit_incorrect: t('clientDisputeNew.motifWrong', 'Mauvais produit'),
    produit_endommage: t('clientDisputeNew.motifDamaged', 'Produit endommagé'),
    produit_non_conforme: t('clientDisputeNew.motifNotAsDescribed', 'Non conforme à la description'),
    article_manquant: t('clientDisputeNew.motifMissing', 'Article manquant'),
    probleme_livraison: t('clientDisputeNew.motifDelivery', 'Problème de livraison'),
    probleme_paiement: t('clientDisputeNew.motifPayment', 'Problème de paiement'),
    probleme_remboursement: t('clientDisputeNew.motifRefund', 'Problème de remboursement'),
    autre: t('clientDisputeNew.motifOther', 'Autre'),
  })[m];

  const [selected, setSelected] = useState<LitigeMotif | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected || !description.trim() || !commandeId || submitting) return;
    setSubmitting(true);
    try {
      const litige = await ouvrirLitige(commandeId, selected, description.trim());
      Alert.alert(
        t('clientDisputeNew.sentTitle', 'Litige ouvert'),
        t('clientDisputeNew.sentDesc', 'Le vendeur a été notifié. Vous pouvez suivre son évolution depuis vos litiges.'),
        [{ text: 'OK', onPress: () => router.replace(`/client/disputes/${litige.id}` as any) }]
      );
    } catch (err: any) {
      Alert.alert('Erreur', err.message || t('clientDisputeNew.errorDesc', "Impossible d'ouvrir ce litige."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('clientDisputeNew.title', 'Signaler un problème')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(300).delay(60).springify()} style={[styles.banner, { backgroundColor: colors.error + '14', borderColor: colors.error + '44' }]}>
          <AlertTriangle color={colors.error} size={24} />
          <Text style={[styles.bannerText, { color: colors.error }]}>
            {t('clientDisputeNew.banner', "Un administrateur examinera votre dossier et pourra proposer un remboursement, un remplacement ou un retour de produit.")}
          </Text>
        </Animated.View>

        <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('clientDisputeNew.whatProblem', 'Quel est le problème ?')}</Text>

        {MOTIFS.map(({ value, icon: Icon }, i) => (
          <Animated.View key={value} entering={FadeInUp.duration(280).delay(120 + i * 40).springify()}>
            <Pressable
              onPress={() => setSelected(value)}
              style={[
                styles.option,
                { borderColor: selected === value ? colors.error : colors.border, backgroundColor: selected === value ? colors.error + '0F' : colors.surface },
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: selected === value ? colors.error + '18' : colors.primarySoft }]}>
                <Icon color={selected === value ? colors.error : colors.primary} size={19} />
              </View>
              <Text style={[styles.optionText, { color: colors.text }]}>{motifLabel(value)}</Text>
              <View style={[styles.radio, { borderColor: selected === value ? colors.error : colors.borderStrong }]}>
                {selected === value && <View style={[styles.radioDot, { backgroundColor: colors.error }]} />}
              </View>
            </Pressable>
          </Animated.View>
        ))}

        <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 20 }]}>{t('clientDisputeNew.describe', 'Décrivez le problème')}</Text>
        <TextInput
          multiline
          placeholder={t('clientDisputeNew.describePlaceholder', 'Expliquez ce qui ne va pas avec cette commande…')}
          placeholderTextColor={colors.textTertiary}
          value={description}
          onChangeText={setDescription}
          maxLength={2000}
          style={[styles.textarea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={!selected || !description.trim() || submitting}
          style={[styles.submitBtn, { backgroundColor: colors.error }, (!selected || !description.trim() || submitting) && { opacity: 0.5 }]}
        >
          {submitting ? <ActivityIndicator color="#FFF" size="small" /> : (
            <>
              <AlertTriangle color="#FFF" size={18} />
              <Text style={styles.submitText}>{t('clientDisputeNew.submit', 'Ouvrir le litige')}</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '900', flexShrink: 1 },
  content: { padding: 20, paddingBottom: 40 },
  banner: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 20 },
  bannerText: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  sectionLabel: { fontSize: 15, fontWeight: '900', marginBottom: 8 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderRadius: 15, padding: 13, marginBottom: 8,
  },
  optionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionText: { flex: 1, fontSize: 14, fontWeight: '700' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5 },
  textarea: {
    height: 120, borderWidth: 1.5, borderRadius: 16, padding: 14,
    textAlignVertical: 'top', fontSize: 14,
  },
  submitBtn: {
    height: 56, borderRadius: 16, marginTop: 22,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
