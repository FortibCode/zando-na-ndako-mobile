import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBrand, BackButton, InputField, PrimaryButton, authStyles } from '@/components/auth-ui';
import { ApiError, forgotPassword } from '@/services/api';

/** Demande de réinitialisation : saisie du numéro de téléphone ou de l'email. */
export default function ForgotPasswordScreen() {
  const { credential: prefill } = useLocalSearchParams<{ credential?: string }>();
  const [credential, setCredential] = useState(prefill || '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = credential.trim().length >= 4;

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await forgotPassword(credential);
      router.push(`/auth/reset-password?credential=${encodeURIComponent(credential.trim())}` as any);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Impossible de joindre le serveur. Vérifiez la connexion API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          contentContainerStyle={authStyles.content}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <BackButton />
          <AuthBrand />

          <Text style={authStyles.screenTitle}>Mot de passe oublié</Text>
          <Text style={authStyles.screenDescription}>
            Indiquez votre numéro de téléphone ou votre email : nous vous enverrons un code pour réinitialiser votre mot de passe.
          </Text>

          <InputField
            autoCapitalize="none"
            icon="call-outline"
            label="Téléphone ou email"
            placeholder="ex: +242 06 123 45 67 ou email@exemple.com"
            required
            value={credential}
            onChangeText={setCredential}
          />

          {Boolean(errorMessage) && <Text style={styles.error}>{errorMessage}</Text>}

          <PrimaryButton
            disabled={!canSubmit}
            icon="send-outline"
            loading={loading}
            onPress={handleSubmit}
            title="Envoyer le code"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  error: { color: '#C00000', fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: 'center', fontWeight: '600' },
});
