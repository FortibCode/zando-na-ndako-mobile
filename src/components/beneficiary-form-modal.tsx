import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { ArrowLeft, User, Phone, MapPin, Crosshair, StickyNote, Check, ChevronDown, AlertTriangle } from 'lucide-react-native';
import { BLUE, RED } from '@/components/client-ui';
import { useClient } from '@/contexts/client-context';
import { useDiaspora, type Beneficiary, type BeneficiaryInput } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  beneficiary?: Beneficiary | null;
  onSaved?: (b: Beneficiary) => void;
};

const EMPTY_FORM: BeneficiaryInput = { nom: '', telephone: '', ville: '', adresse: '', quartier: '', coordonneesGps: '', instructions: '', relation: '' };

export default function BeneficiaryFormModal({ visible, onClose, beneficiary, onSaved }: Props) {
  const { addBeneficiary, editBeneficiary, beneficiaries } = useDiaspora();
  const { zones } = useClient();
  const { t } = useLanguage();
  const [form, setForm] = useState<BeneficiaryInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quartierOpen, setQuartierOpen] = useState(false);

  // Même correctif que address-form-modal.tsx : "quartier" doit correspondre à une vraie valeur
  // de zones_livraison.quartiers_couverts pour que la livraison au bénéficiaire soit facturée/
  // acceptée correctement, plutôt qu'un texte libre qui pouvait ne matcher aucune zone réelle.
  const quartierOptions = zones
    .flatMap((z) => (z.quartiers_couverts || []).map((quartier) => ({ quartier, ville: z.ville })))
    .sort((a, b) => a.quartier.localeCompare(b.quartier));

  const isEditing = Boolean(beneficiary);

const handleOpen = useCallback(() => {
    setError(null);
    setQuartierOpen(false);
    setForm(beneficiary
      ? {
          nom: beneficiary.nom,
          telephone: beneficiary.telephone,
          ville: beneficiary.ville,
          adresse: beneficiary.adresse || '',
          quartier: beneficiary.quartier || '',
          coordonneesGps: beneficiary.coordonneesGps || '',
          instructions: beneficiary.instructions || '',
          relation: beneficiary.relation || '',
        }
      : EMPTY_FORM);
  }, [beneficiary]);

  const updateField = (key: keyof BeneficiaryInput, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isValid = form.nom.trim().length >= 2 && form.telephone.trim().length >= 6;

  const handleSave = async () => {
    if (!isValid) {
      setError(t('diaspora.beneficiaryForm.validationError', 'Veuillez au moins saisir le nom complet (2 car.) et le numéro de téléphone (6 car.).'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: BeneficiaryInput = {
        nom: form.nom.trim(),
        telephone: form.telephone.trim(),
        ville: form.ville.trim() || 'Brazzaville',
        quartier: form.quartier?.trim() || 'Centre-ville',
        adresse: form.adresse?.trim() || form.quartier?.trim() || 'Brazzaville',
        coordonneesGps: form.coordonneesGps?.trim(),
        instructions: form.instructions?.trim(),
        relation: form.relation?.trim(),
      };
      if (isEditing && beneficiary) {
        await editBeneficiary(beneficiary.id, payload);
        onSaved?.({ ...beneficiary, ...payload });
      } else {
        const created = await addBeneficiary(payload);
        onSaved?.(created);
      }
      alert(
        'Succès',
        isEditing
          ? t('diaspora.beneficiaryForm.updatedSuccess', 'Le bénéficiaire a été mis à jour.')
          : t('diaspora.beneficiaryForm.addedSuccess', 'Le bénéficiaire a été ajouté avec succès.')
      );
      onClose();
    } catch (e: any) {
      setError(e.message || t('diaspora.beneficiaryForm.genericError', 'Une erreur est survenue. Veuillez réessayer.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} onShow={handleOpen}>
      <StatusBar style="dark" />
      <View style={styles.root}>
        <Animated.View entering={FadeIn.duration(200)} style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Fermer" />
          <View style={styles.backdrop} />
        </Animated.View>

        <Animated.View entering={SlideInRight.duration(300).springify()} exiting={SlideOutRight.duration(250)} style={styles.sheet}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={styles.header}>
              <Pressable onPress={onClose} style={styles.backBtn}>
                <ArrowLeft color={BLUE} size={22} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>
                  {isEditing ? t('diaspora.beneficiaryForm.editTitle', 'Modifier le bénéficiaire') : t('diaspora.beneficiaryForm.newTitle', 'Nouveau bénéficiaire')}
                </Text>
                <Text style={styles.headerSub}>
                  {beneficiaries.length}/{beneficiaries.length + (isEditing ? 0 : 1)} {t('diaspora.beneficiaryForm.registeredSuffix', 'bénéficiaires enregistrés')}
                </Text>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.block}>
                <Text style={styles.label}>{t('diaspora.beneficiaryForm.fullName', 'Nom complet')}</Text>
                <View style={styles.fieldWrap}>
                  <User color="#94A3B8" size={18} />
                  <TextInput
                    value={form.nom}
                    onChangeText={(v) => updateField('nom', v)}
                    placeholder={t('diaspora.beneficiaryForm.fullNamePlaceholder', 'Ex : Maman Glade')}
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                    style={styles.field}
                  />
                </View>
              </View>

              <View style={styles.block}>
                <Text style={styles.label}>{t('diaspora.beneficiaryForm.phone', 'Téléphone')}</Text>
                <View style={styles.fieldWrap}>
                  <Phone color="#94A3B8" size={18} />
                  <TextInput
                    value={form.telephone}
                    onChangeText={(v) => updateField('telephone', v)}
                    placeholder="+242 06 123 45 67"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    style={styles.field}
                  />
                </View>
              </View>

<View style={styles.block}>
                <Text style={styles.label}>{t('diaspora.beneficiaryForm.city', 'Ville')}</Text>
                <View style={styles.fieldWrap}>
                  <MapPin color="#94A3B8" size={18} />
                  <TextInput
                    value={form.ville}
                    onChangeText={(v) => updateField('ville', v)}
                    placeholder={t('diaspora.beneficiaryForm.cityPlaceholder', 'Ex : Brazzaville')}
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                    style={styles.field}
                  />
                </View>
              </View>

              <View style={styles.block}>
                <Text style={styles.label}>{t('diaspora.beneficiaryForm.district', 'Quartier *')}</Text>
                <Pressable onPress={() => setQuartierOpen((o) => !o)} style={styles.fieldWrap}>
                  <MapPin color="#94A3B8" size={18} />
                  <Text style={[styles.field, !form.quartier && { color: '#94A3B8' }]} numberOfLines={1}>
                    {form.quartier || t('diaspora.beneficiaryForm.districtPlaceholder', 'Ex : Talangaï')}
                  </Text>
                  <ChevronDown color="#94A3B8" size={18} style={{ transform: [{ rotate: quartierOpen ? '180deg' : '0deg' }] }} />
                </Pressable>
                {quartierOpen && (
                  <Animated.View entering={FadeInDown.duration(200)} style={styles.dropdownPanel}>
                    <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator>
                      {quartierOptions.length === 0 ? (
                        <Text style={styles.dropdownEmpty}>{t('diaspora.beneficiaryForm.noZones', 'Aucune zone de livraison disponible pour l\'instant.')}</Text>
                      ) : (
                        quartierOptions.map(({ quartier, ville }) => (
                          <Pressable
                            key={quartier}
                            onPress={() => {
                              setForm((prev) => ({ ...prev, quartier, ville }));
                              setQuartierOpen(false);
                            }}
                            style={[styles.dropdownOption, quartier === form.quartier && styles.dropdownOptionSelected]}
                          >
                            <Text style={[styles.dropdownOptionText, quartier === form.quartier && { color: BLUE, fontWeight: '800' }]}>{quartier}</Text>
                            {quartier === form.quartier && <Check color={BLUE} size={16} strokeWidth={3} />}
                          </Pressable>
                        ))
                      )}
                    </ScrollView>
                  </Animated.View>
                )}
              </View>

              <View style={styles.block}>
                <Text style={styles.label}>{t('diaspora.beneficiaryForm.address', 'Adresse complète *')}</Text>
                <View style={[styles.fieldWrap, styles.fieldTextArea]}>
                  <MapPin color="#94A3B8" size={18} />
                  <TextInput
                    value={form.adresse || ''}
                    onChangeText={(v) => updateField('adresse', v)}
                    placeholder={t('diaspora.beneficiaryForm.addressPlaceholder', 'Ex : 72, Avenue Lumumba, non loin de l\'église')}
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                    multiline
                    style={styles.field}
                  />
                </View>
              </View>

              <View style={styles.block}>
                <Text style={styles.label}>{t('diaspora.beneficiaryForm.gps', 'Coordonnées GPS (optionnel)')}</Text>
                <View style={styles.fieldWrap}>
                  <Crosshair color="#94A3B8" size={18} />
                  <TextInput
                    value={form.coordonneesGps || ''}
                    onChangeText={(v) => updateField('coordonneesGps', v)}
                    placeholder="-4.2634, 15.2429"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    style={styles.field}
                  />
                </View>
              </View>

              <View style={styles.block}>
                <Text style={styles.label}>{t('diaspora.beneficiaryForm.relation', 'Relation (optionnel)')}</Text>
                <View style={styles.fieldWrap}>
                  <User color="#94A3B8" size={18} />
                  <TextInput
                    value={form.relation || ''}
                    onChangeText={(v) => updateField('relation', v)}
                    placeholder={t('diaspora.beneficiaryForm.relationPlaceholder', 'Ex : Maman')}
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                    style={styles.field}
                  />
                </View>
              </View>

              <View style={styles.block}>
                <Text style={styles.label}>{t('diaspora.beneficiaryForm.instructions', 'Instructions de livraison (optionnel)')}</Text>
                <View style={[styles.fieldWrap, styles.fieldTextArea]}>
                  <StickyNote color="#94A3B8" size={18} />
                  <TextInput
                    value={form.instructions || ''}
                    onChangeText={(v) => updateField('instructions', v)}
                    placeholder={t('diaspora.beneficiaryForm.instructionsPlaceholder', 'Ex : Laissez devant la porte, appelez à l\'arrivée')}
                    placeholderTextColor="#94A3B8"
                    multiline
                    style={styles.field}
                  />
                </View>
              </View>

              {error && (
                <Animated.View entering={FadeInUp.duration(250)} style={[styles.errorBox, styles.errorBoxRow]}>
                  <AlertTriangle color={RED} size={15} />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <Pressable onPress={handleSave} disabled={saving || !isValid} style={[styles.button, (saving || !isValid) && styles.buttonDisabled]}>
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Check color="#FFF" size={18} strokeWidth={3} />
                    <Text style={styles.buttonText}>{isEditing ? t('diaspora.beneficiaryForm.save', 'Enregistrer') : t('diaspora.beneficiaryForm.addSubmit', 'Ajouter le bénéficiaire')}</Text>
                  </>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(6, 24, 59, 0.55)' },
  sheet: {
    width: '100%', backgroundColor: '#FFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden',
    shadowColor: '#06183B', shadowOpacity: 0.25, shadowRadius: 24, elevation: 16,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingTop: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#EEF2FA',
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: BLUE, fontSize: 19, fontWeight: '900' },
  headerSub: { color: '#64748B', fontSize: 12.5, marginTop: 2 },
  content: { padding: 20, paddingBottom: 24, gap: 8 },
  block: { marginBottom: 6 },
  label: { color: BLUE, fontSize: 13.5, fontWeight: '800', marginBottom: 10 },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52,
    borderWidth: 1.2, borderColor: '#E2E8F0', borderRadius: 14,
    paddingHorizontal: 14, backgroundColor: '#FFF', marginBottom: 12,
  },
field: { flex: 1, color: BLUE, fontSize: 15, fontWeight: '500', paddingVertical: 12 },
  fieldTextArea: { minHeight: 72, alignItems: 'flex-start', paddingTop: 14 },
  dropdownPanel: { borderRadius: 14, borderWidth: 1.2, borderColor: '#E2E8F0', backgroundColor: '#FFF', overflow: 'hidden', marginTop: -4, marginBottom: 12 },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEF2FA' },
  dropdownOptionSelected: { backgroundColor: '#EEF2FA' },
  dropdownOptionText: { color: BLUE, fontSize: 14, fontWeight: '600' },
  dropdownEmpty: { color: '#94A3B8', fontSize: 13, fontWeight: '600', padding: 14, textAlign: 'center' },
  errorBox: { backgroundColor: '#FFF0F0', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#FFCDD2' },
  errorBoxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  errorText: { color: RED, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  footer: { padding: 18, paddingBottom: 28, borderTopWidth: 1, borderTopColor: '#EEF2FA' },
  button: {
    height: 56, borderRadius: 18, backgroundColor: RED,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: RED, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  buttonDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
