import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { alert } from '@/contexts/alert-context';

import { AuthBrand, BackButton, InputField, OtpFields, PrimaryButton, authStyles } from '@/components/auth-ui';
import { ApiError, forgotPassword, resetPassword } from '@/services/api';

/** Saisie du code reçu et du nouveau mot de passe. */
export default function ResetPasswordScreen() {
  const { credential } = useLocalSearchParams<{ credential?: string }>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = code.length === 6 && password.length >= 8 && password === confirmPassword;

  const handleResend = async () => {
    if (!credential || resending) return;
    setResending(true);
    try {
      await forgotPassword(credential);
      alert('Code renvoyé', 'Un nouveau code vous a été envoyé.');
    } catch {
      alert('Erreur', 'Impossible de renvoyer le code. Veuillez réessayer.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || loading || !credential) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await resetPassword(credential, code, password);
      alert(
        'Mot de passe réinitialisé',
        'Votre mot de passe a été changé avec succès. Connectez-vous avec votre nouveau mot de passe.',
        [{ text: 'OK', onPress: () => router.replace('/auth' as any) }],
      );
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
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <BackButton />
          <AuthBrand />

          <Text style={authStyles.screenTitle}>Nouveau mot de passe</Text>
          <Text style={authStyles.screenDescription}>
            Entrez le code reçu par {credential?.includes('@') ? 'email' : 'SMS'} au{' '}
            <Text style={styles.bold}>{credential}</Text>, puis choisissez un nouveau mot de passe.
          </Text>

          <View style={styles.otpWrap}>
            <OtpFields onChangeCode={setCode} />
          </View>

          <Text onPress={handleResend} style={styles.resend}>
            {resending ? 'Envoi en cours…' : "Vous n'avez rien reçu ? Renvoyer le code"}
          </Text>

          <InputField
            icon="lock-closed-outline"
            isPassword
            label="Nouveau mot de passe"
            placeholder="8 caractères minimum"
            required
            value={password}
            onChangeText={setPassword}
          />

          <InputField
            icon="lock-closed-outline"
            isPassword
            label="Confirmer le mot de passe"
            placeholder="Ressaisissez le mot de passe"
            required
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {Boolean(errorMessage) && <Text style={styles.error}>{errorMessage}</Text>}

          <PrimaryButton
            disabled={!canSubmit}
            icon="checkmark-circle-outline"
            loading={loading}
            onPress={handleSubmit}
            title="Réinitialiser le mot de passe"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bold: { fontWeight: '800', color: '#0D347C' },
  otpWrap: { marginTop: 20, alignItems: 'center' },
  resend: { textAlign: 'center', color: '#0D347C', fontWeight: '700', fontSize: 13.5, marginTop: 14 },
  error: { color: '#C00000', fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: 'center', fontWeight: '600' },
});
