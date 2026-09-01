import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { alert } from '@/contexts/alert-context';

import { AuthBrand, BackButton, SecurityNote } from '@/components/auth-ui';
import { SignupOtpFields } from '@/components/signup/signup-otp-fields';
import { useLocalSignup } from '@/contexts/local-signup-context';
import { login, registerDiasporaClient, resendOtp, verifyOtp } from '@/services/api';
import { registerForPushNotificationsAsync } from '@/services/push-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';

const RESEND_DELAY = 165;

type Status = 'registering' | 'ready' | 'registration_failed';

// Le téléphone international saisi à l'étape 2 (placeholder "+33 6 12 34 56 78") porte déjà son
// propre indicatif pays — il ne faut jamais lui imposer +242 (bug précédent : un numéro français
// ou belge saisi correctement était silencieusement transformé en numéro congolais avant envoi).
function normalizeInternationalPhone(raw: string): string {
  const trimmed = raw.trim().replace(/[\s-]/g, '');
  if (!trimmed) return '';
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

/** Vérification OTP de l'email lors de l'inscription client Diaspora. */
export default function OverseasSignupVerifyEmailScreen() {
  const { data } = useLocalSignup();
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<Status>('registering');
  const [otpDev, setOtpDev] = useState<string | null>(null);
  const [otpKey, setOtpKey] = useState(0);
  const registrationStarted = useRef(false);

  const emailDisplay = data.email || 'ruth.okombi@gmail.com';
  const phoneNumber = normalizeInternationalPhone(data.phone);

  useEffect(() => {
    if (registrationStarted.current) return;
    registrationStarted.current = true;

    const createAccount = async () => {
      try {
        const birthDateParts = data.birthDate.split(' / ');
        const dateOfBirth = birthDateParts.length === 3
          ? `${birthDateParts[2]}-${birthDateParts[1]}-${birthDateParts[0]}`
          : data.birthDate;

        const registration = await registerDiasporaClient({
          nom: data.lastName.trim(),
          prenom: data.firstName.trim(),
          date_naissance: dateOfBirth,
          sexe: data.gender === 'male' ? 'homme' : 'femme',
          email: data.email.trim(),
          telephone: phoneNumber,
          mot_de_passe: data.password,
          pays_residence: data.country,
          adresse: data.address.trim(),
          // data.currency porte désormais l'id de l'option choisie ('euro'/'franc_cfa'/'dollar'),
          // pas son libellé affiché — l'ancienne comparaison sur le libellé exact ('US Dollar ($)')
          // ne correspondait jamais à l'option réelle ('Dollar ($)') et retombait toujours sur FCFA.
          devise_preferee: data.currency === 'euro' ? 'EUR' : data.currency === 'dollar' ? 'USD' : 'FCFA',
        });

        setOtpDev(registration.otp_dev ?? null);
        setStatus('ready');
      } catch (error) {
        setStatus('registration_failed');
        alert(
          'Inscription impossible',
          error instanceof Error ? error.message : 'Vérifiez les informations saisies et le serveur.',
        );
      }
    };

    createAccount();
  }, [data, phoneNumber]);

  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleResend = useCallback(async () => {
    if (!canResend) return;
    try {
      const code = await resendOtp(data.email, 'email');
      setOtpDev(code || null);
      setResendTimer(RESEND_DELAY);
      setCanResend(false);
      setOtpKey((k) => k + 1);
      alert('Code renvoyé', "Un nouveau code de vérification a été envoyé à votre adresse e-mail.");
    } catch (error) {
      alert('Erreur', error instanceof Error ? error.message : "Impossible de renvoyer le code.");
    }
  }, [canResend, data.email]);

  const handleComplete = useCallback(async (code: string) => {
    if (status !== 'ready' || !code || verifying) return;
    setVerifying(true);
    try {
      const result = await verifyOtp(data.email, code);
      if (!result?.token) {
        throw new Error('Code invalide. Vérifiez le code reçu et réessayez.');
      }
      await login(data.email, data.password);
      registerForPushNotificationsAsync();
      router.replace('/auth/signup/overseas/success' as any);
    } catch (error) {
      setOtpKey((k) => k + 1);
      alert('Code incorrect', error instanceof Error ? error.message : 'Vérifiez le code reçu et réessayez.');
    } finally {
      setVerifying(false);
    }
  }, [status, verifying, data.email, data.password]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <AuthBrand compact />
        <Image
          contentFit="contain"
          source={require('@/assets/images/auth-email-illustration.png')}
          style={styles.illustration}
        />
        <Text style={styles.title}>
          Confirmez votre <Text style={styles.titleAccent}>adresse email</Text>
        </Text>
        <Text style={styles.description}>
          Nous avons envoyé un code de vérification à <Text style={styles.bold}>{emailDisplay}.</Text> Entrez le code ci-dessous pour continuer.
        </Text>

        {status === 'registering' ? (
          <ActivityIndicator color="#0D347C" style={{ marginTop: 24 }} />
        ) : (
          <SignupOtpFields key={otpKey} initialCode={otpDev ?? undefined} onComplete={handleComplete} />
        )}

        <View style={styles.timer}>
          <Ionicons color="#4A90E2" name="shield-checkmark-outline" size={16} />
          <Text style={styles.timerText}>
            Ce code expirera dans <Text style={styles.timerAccent}>{formatTimer(resendTimer)}</Text>
          </Text>
        </View>
        <Text style={styles.resend}>
          Vous n'avez pas reçu le code ?{' '}
          {canResend ? (
            <Text onPress={handleResend} style={styles.resendLink}>Renvoyer le code</Text>
          ) : (
            <Text style={styles.resendMuted}>Renvoyer le code ({formatTimer(resendTimer)})</Text>
          )}
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={status !== 'ready' || verifying}
          onPress={() => handleComplete(otpDev ?? '')}
          style={[styles.verify, (verifying || status !== 'ready') && styles.verifyActive]}
        >
          <Text style={styles.verifyText}>{verifying ? 'Vérification…' : 'Vérifier'}</Text>
        </Pressable>
        <SecurityNote />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 24, paddingTop: 8 },
  content: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 35, alignItems: 'center' },
  illustration: { width: 235, height: 130, marginTop: 6 },
  title: {
    marginTop: 14,
    color: '#0D347C',
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  titleAccent: { color: '#E30613' },
  description: {
    marginTop: 14,
    color: '#51617C',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },
  bold: { fontWeight: '800', color: '#0D347C' },
  timer: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    marginTop: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  timerText: { color: '#53627A', fontSize: 13, fontWeight: '600' },
  timerAccent: { color: '#E30613', fontWeight: '800' },
  resend: { color: '#6B7485', textAlign: 'center', fontSize: 13, marginTop: 18 },
  resendLink: { color: '#1672CD', fontWeight: '800' },
  resendMuted: { color: '#9CA3AF' },
  verify: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: '#E30613',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  verifyActive: { opacity: 0.7 },
  verifyText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
