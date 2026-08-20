import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BackButton, InputField, PrimaryButton, authStyles } from '@/components/auth-ui';
import { SignupStepper } from '@/components/signup/signup-stepper';
import { useLocalSignup } from '@/contexts/local-signup-context';
import { BrandColors } from '@/constants/brand';
import { AUTH_ICONS } from '@/constants/icons';

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.rule}>
      <Ionicons
        color={met ? '#22C55E' : '#CBD5E1'}
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
      />
      <Text style={[styles.ruleText, met && styles.ruleTextMet]}>{label}</Text>
    </View>
  );
}

/** Étape 3 — Sécurité du compte pour Diaspora. */
export default function OverseasSignupStep3Screen() {
  const { update } = useLocalSignup();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const rules = useMemo(
    () => ({
      minLength: password.length >= 8,
      hasDigit: /\d/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasMatch: password === confirmPassword && confirmPassword.length > 0,
    }),
    [password, confirmPassword],
  );

  const isValid = rules.minLength && rules.hasDigit && rules.hasUppercase && rules.hasMatch;

  const handleContinue = () => {
    update({ password });
    router.push('/auth/signup/overseas/verify-email' as any);
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <BackButton />
        </View>
        <ScrollView
          contentContainerStyle={authStyles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SignupStepper currentStep={3} titles={['Identité', 'Coordonnées', 'Sécurité']} />

          <Text style={styles.title}>Sécurité du Compte</Text>
          <Text style={styles.subtitle}>
            Créez un mot de passe fort pour protéger vos achats et vos envois.
          </Text>

          <InputField
            icon={AUTH_ICONS.password}
            isPassword
            label="Mot de passe"
            placeholder="Minimum 8 caractères"
            required
            value={password}
            onChangeText={setPassword}
          />

          <InputField
            icon={AUTH_ICONS.passwordConfirm}
            isPassword
            label="Confirmation du mot de passe"
            placeholder="Répétez votre mot de passe"
            required
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <View style={styles.rulesContainer}>
            <Text style={styles.rulesTitle}>Critères de sécurité</Text>
            <PasswordRule met={rules.minLength} label="Au moins 8 caractères" />
            <PasswordRule met={rules.hasDigit} label="Au moins 1 chiffre (0–9)" />
            <PasswordRule met={rules.hasUppercase} label="Au moins 1 lettre majuscule (A–Z)" />
            <PasswordRule met={rules.hasMatch} label="Les deux mots de passe correspondent" />
          </View>

          <PrimaryButton
            disabled={!isValid}
            icon={AUTH_ICONS.next}
            onPress={handleContinue}
            title="Vérifier par e-mail"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 22, paddingTop: 8 },
  title: { color: BrandColors.blue, fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  subtitle: { color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 18, marginTop: 4, lineHeight: 20 },
  rulesContainer: {
    backgroundColor: '#F8FAFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4EAF6',
    padding: 16,
    marginBottom: 22,
    gap: 10,
  },
  rulesTitle: { color: BrandColors.blue, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { color: '#94A3B8', fontSize: 13 },
  ruleTextMet: { color: '#374151' },
});
