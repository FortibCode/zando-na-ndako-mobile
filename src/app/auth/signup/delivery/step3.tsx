import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { alert } from '@/contexts/alert-context';

import { BackButton, InputField, PrimaryButton, StepProgress, authStyles } from '@/components/auth-ui';
import { useDeliverySignup } from '@/contexts/delivery-signup-context';
import { registerDeliveryDriver } from '@/services/api';
import { BrandColors } from '@/constants/brand';
import { AUTH_ICONS } from '@/constants/icons';

export default function DeliverySignupStep3Screen() {
  const { data, update } = useDeliverySignup();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const rules = useMemo(
    () => ({
      length: password.length >= 8,
      digit: /\d/.test(password),
      upper: /[A-Z]/.test(password),
      match: Boolean(password && password === confirm),
    }),
    [password, confirm],
  );

  const valid = rules.length && rules.digit && rules.upper && rules.match;

  const handleNext = async () => {
    if (!valid || submitting) return;

    setSubmitting(true);
    const phoneNumber = `+242${data.driverPhone ? data.driverPhone.replace(/\D/g, '') : '061234567'}`;
    const dateParts = data.birthDate.split(' / ');
    const dateOfBirth =
      dateParts.length === 3
        ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
        : data.birthDate;

    try {
      const registration = await registerDeliveryDriver({
        nom: data.lastName.trim(),
        prenom: data.firstName.trim(),
        date_naissance: dateOfBirth,
        email: data.email.trim() ? data.email.trim() : `livreur.${Date.now()}@zandondako.cg`,
        telephone: phoneNumber,
        mot_de_passe: password,
        pays_residence: data.country,
        adresse: data.address.trim(),
        type_vehicule: data.vehicleType,
        immatriculation: data.licenseNumber,
      });

      update({
        password,
        registrationOtp: registration.otp_dev || '',
        registrationPhone: phoneNumber,
      });
      setSubmitting(false);
      const targetScreen =
        data.method === 'email'
          ? '/auth/signup/delivery/verify-email'
          : '/auth/signup/delivery/verify-phone';
      router.push(targetScreen as any);
    } catch (error) {
      // Ne plus avancer vers l'écran de vérification quand l'inscription a réellement échoué —
      // le compte n'existe pas côté serveur, la vérification OTP suivante n'aurait aucun sens.
      setSubmitting(false);
      alert(
        'Inscription impossible',
        error instanceof Error ? error.message : 'Vérifiez les informations saisies et le serveur.',
      );
    }
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={authStyles.content} keyboardShouldPersistTaps="handled">
        <StepProgress currentStep={3} totalSteps={3} stepTitles={['Identité', 'Coordonnées', 'Sécurité']} />

        <Text style={styles.title}>Sécurité du compte</Text>
        <Text style={styles.subtitle}>Créez un mot de passe robuste pour protéger vos accès et revenus.</Text>

        <InputField
          icon={AUTH_ICONS.password}
          isPassword
          label="Mot de passe principal"
          placeholder="••••••••"
          required
          value={password}
          onChangeText={setPassword}
        />

        <InputField
          icon={AUTH_ICONS.passwordConfirm}
          isPassword
          label="Confirmation du mot de passe"
          placeholder="••••••••"
          required
          value={confirm}
          onChangeText={setConfirm}
        />

        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Critères de sécurité requis :</Text>
          {[
            [rules.length, '8 caractères minimum'],
            [rules.digit, 'Au moins 1 chiffre (0-9)'],
            [rules.upper, 'Au moins 1 lettre majuscule (A-Z)'],
            [rules.match, 'Les deux mots de passe sont identiques'],
          ].map(([met, label]) => (
            <View key={label as string} style={styles.ruleRow}>
              <View style={[styles.ruleBadge, met && styles.ruleBadgeMet]}>
                <Ionicons color={met ? BrandColors.white : '#94A3B8'} name={met ? 'checkmark' : 'close'} size={12} />
              </View>
              <Text style={[styles.ruleText, met && styles.ruleTextMet]}>{label}</Text>
            </View>
          ))}
        </View>

        <PrimaryButton
          disabled={!valid}
          icon={AUTH_ICONS.finish}
          loading={submitting}
          onPress={handleNext}
          title={submitting ? 'Création de votre compte…' : 'Créer mon compte livreur'}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 8 },
  title: { color: BrandColors.blue, fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  subtitle: { color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 20, marginTop: 4 },
  rulesCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    gap: 10,
  },
  rulesTitle: { color: BrandColors.textDark, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ruleBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleBadgeMet: { backgroundColor: BrandColors.green },
  ruleText: { color: '#64748B', fontSize: 13, fontWeight: '500' },
  ruleTextMet: { color: BrandColors.textDark, fontWeight: '700' },
});
