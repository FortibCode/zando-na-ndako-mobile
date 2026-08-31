import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';

import { AuthBrand, BackButton, GoogleButton, InputField, PrimaryButton, authStyles } from '@/components/auth-ui';
import { BrandColors } from '@/constants/brand';
import { ApiError, login } from '@/services/api';
import { registerForPushNotificationsAsync } from '@/services/push-notifications';

/** Connexion native par adresse email et mot de passe. */
export default function EmailLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const canSubmit = email.includes('@') && password.length > 0;

  const handleLogin = async () => {
    if (!canSubmit || loading) return;

    setLoading(true);
    setErrorMessage('');
    try {
      const user = await login(email, password);
      registerForPushNotificationsAsync(); // jeton push : ne bloque pas la navigation si ça échoue

      if (user.type_utilisateur === 'livreur') {
        router.replace('/delivery/(tabs)' as any);
      } else if (user.type_utilisateur === 'client') {
        router.replace('/client' as any);
      } else if (user.type_utilisateur === 'vendeur') {
        router.replace('/vendor' as any);
      } else {
        setErrorMessage('Ce compte n’est pas encore pris en charge dans cette application.');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.message && error.message.includes('non vérifié')) {
          router.push(`/auth/email-otp?email=${encodeURIComponent(email)}`);
          return;
        }
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Impossible de joindre le serveur. Vérifiez la connexion API.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={authStyles.content}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <BackButton />
          <AuthBrand />

          <Text style={authStyles.screenTitle}>Connexion par email</Text>
          <Text style={authStyles.screenDescription}>
            Accédez à vos commandes, livraisons et services Zando na Ndako.
          </Text>

          <InputField
            autoCapitalize="none"
            autoComplete="email"
            icon="mail-outline"
            keyboardType="email-address"
            label="Adresse email"
            placeholder="ex: exemple@email.com"
            required
            value={email}
            onChangeText={setEmail}
          />

          <InputField
            icon="lock-closed-outline"
            isPassword
            label="Mot de passe"
            placeholder="Saisissez votre mot de passe"
            required
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.options}>
            <Pressable onPress={() => setRememberMe(!rememberMe)} style={styles.rememberRow}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <Check color="#FFF" size={12} strokeWidth={3} />}
              </View>
              <Text style={styles.rememberText}>Se souvenir de moi</Text>
            </Pressable>
            <Pressable onPress={() => router.push(`/auth/forgot-password${email ? `?credential=${encodeURIComponent(email)}` : ''}` as any)}>
              <Text style={styles.forgot}>Mot de passe oublié ?</Text>
            </Pressable>
          </View>

          {Boolean(errorMessage) && <Text style={styles.error}>{errorMessage}</Text>}

          <PrimaryButton
            disabled={!canSubmit}
            icon="log-in-outline"
            loading={loading}
            onPress={handleLogin}
            title="Se connecter"
          />

          <View style={authStyles.dividerRow}>
            <View style={authStyles.divider} />
            <Text style={authStyles.dividerText}>OU</Text>
            <View style={authStyles.divider} />
          </View>

          <GoogleButton onPress={() => router.push('/auth/google-picker')} />

          <Text style={authStyles.accountText}>
            Vous n'avez pas de compte ?{' '}
            <Text style={authStyles.accountLink} onPress={() => router.push('/auth/signup')}>
              Inscrivez-vous
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  options: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    alignItems: 'center',
  },
  rememberRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.white,
  },
  checkboxActive: {
    backgroundColor: BrandColors.blueBright,
    borderColor: BrandColors.blueBright,
  },
  rememberText: { color: '#64748B', fontSize: 13, fontWeight: '500' },
  forgot: { color: BrandColors.blueBright, fontSize: 13, fontWeight: '700' },
  error: { color: BrandColors.red, fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: 'center', fontWeight: '600' },
});
