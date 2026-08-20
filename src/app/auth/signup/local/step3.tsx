import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BackButton } from '@/components/auth-ui';
import { SignupStepper } from '@/components/signup/signup-stepper';
import { useLocalSignup } from '@/contexts/local-signup-context';

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.rule}>
      <Ionicons color={met ? '#22C55E' : '#D1D5DB'} name="checkmark-circle" size={18} />
      <Text style={[styles.ruleText, met && styles.ruleTextMet]}>{label}</Text>
    </View>
  );
}

/** Étape 3 — Sécurité du compte (mot de passe). */
export default function LocalSignupStep3Screen() {
  const { update } = useLocalSignup();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const rules = useMemo(() => ({
    minLength: password.length >= 8,
    hasDigit: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
  }), [password]);

  const isValid =
    rules.minLength &&
    rules.hasDigit &&
    rules.hasUppercase &&
    password === confirmPassword &&
    confirmPassword.length > 0;

  const handleContinue = () => {
    update({ password });
    router.push('/auth/signup/local/verify-phone');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <BackButton />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <SignupStepper currentStep={3} />
          <Text style={styles.title}>Sécurité du compte</Text>
          <View style={styles.field}>
            <Text style={styles.label}>
              Mot de passe<Text style={styles.required}> *</Text>
            </Text>
            <View style={styles.inputWrap}>
              <TextInput
                autoCapitalize="none"
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#AFB7C7"
                secureTextEntry={!showPassword}
                style={styles.input}
                value={password}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons color="#0D347C" name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} />
              </Pressable>
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>
              Confirmer le mot de passe<Text style={styles.required}> *</Text>
            </Text>
            <View style={styles.inputWrap}>
              <TextInput
                autoCapitalize="none"
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor="#AFB7C7"
                secureTextEntry={!showConfirm}
                style={styles.input}
                value={confirmPassword}
              />
              <Pressable onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons color="#0D347C" name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} />
              </Pressable>
            </View>
          </View>
          <View style={styles.rules}>
            <PasswordRule met={rules.minLength} label="8 caractères minimum" />
            <PasswordRule met={rules.hasDigit} label="1 chiffre" />
            <PasswordRule met={rules.hasUppercase} label="1 lettre majuscule" />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            disabled={!isValid}
            onPress={handleContinue}
            style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
          >
            <Text style={styles.continueText}>Continuer</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 8 },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  title: {
    color: '#0D347C',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 24,
  },
  field: { marginBottom: 18 },
  label: { color: '#0D347C', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  required: { color: '#E30613' },
  inputWrap: {
    height: 50,
    borderWidth: 1,
    borderColor: '#D4DBE8',
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  input: { flex: 1, color: '#0D347C', fontSize: 15 },
  rules: { marginTop: 8, gap: 10 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { color: '#9CA3AF', fontSize: 14 },
  ruleTextMet: { color: '#374151' },
  footer: { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 12 },
  continueButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#E30613',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: { opacity: 0.5 },
  continueText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});
