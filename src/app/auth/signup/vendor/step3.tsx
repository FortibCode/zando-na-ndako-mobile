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
import { useVendorSignup } from '@/contexts/vendor-signup-context';
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

export default function VendorSignupStep3Screen() {
  const { data, update } = useVendorSignup();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const rules = useMemo(
    () => ({
      minLength: password.length >= 8,
      hasDigit: /\d/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password),
      hasMatch: password === confirmPassword && confirmPassword.length > 0,
    }),
    [password, confirmPassword],
  );

  const isValid =
    rules.minLength && rules.hasDigit && rules.hasUppercase && rules.hasMatch;

  const handleContinue = () => {
    update({ password });
    if (data.method === 'email') {
      router.push('/auth/signup/vendor/verify-email');
    } else {
      router.push('/auth/signup/vendor/verify-phone');
    }
  };

  const strength = [rules.minLength, rules.hasDigit, rules.hasUppercase, rules.hasSpecial].filter(Boolean).length;
  const strengthColors = ['#EF4444', '#F97316', '#EAB308', '#22C55E'];
  const strengthLabels = ['', 'Faible', 'Moyen', 'Fort', 'Très fort'];

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
          <SignupStepper currentStep={3} titles={['Commerçant', 'Boutique', 'Sécurité']} />

          <Text style={styles.title}>Sécurité du Compte</Text>
          <Text style={styles.subtitle}>Choisissez un mot de passe robuste pour protéger votre boutique.</Text>

          <InputField
            icon={AUTH_ICONS.password}
            isPassword
            label="Mot de passe"
            placeholder="Minimum 8 caractères"
            required
            value={password}
            onChangeText={setPassword}
          />

          {/* Barre de force du mot de passe */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      { backgroundColor: strength >= i ? strengthColors[strength - 1] : '#E2E8F0' },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: strengthColors[strength - 1] || '#94A3B8' }]}>
                {strengthLabels[strength]}
              </Text>
            </View>
          )}

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
            <Text style={styles.rulesTitle}>Exigences du mot de passe</Text>
            <PasswordRule met={rules.minLength} label="Au moins 8 caractères" />
            <PasswordRule met={rules.hasDigit} label="Au moins 1 chiffre (0–9)" />
            <PasswordRule met={rules.hasUppercase} label="Au moins 1 lettre majuscule (A–Z)" />
            <PasswordRule met={rules.hasMatch} label="Les deux mots de passe correspondent" />
          </View>

          <PrimaryButton
            disabled={!isValid}
            icon={AUTH_ICONS.finish}
            onPress={handleContinue}
            title="Finaliser l'inscription"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 22, paddingTop: 8 },
  title: { color: BrandColors.blue, fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  subtitle: { color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 18, marginTop: 4 },
  strengthContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, marginTop: -6 },
  strengthBars: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '700', minWidth: 56, textAlign: 'right' },
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
