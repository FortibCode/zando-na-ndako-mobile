import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { alert } from '@/contexts/alert-context';

import { AuthBrand, BackButton, SecurityNote } from '@/components/auth-ui';
import { SignupOtpFields } from '@/components/signup/signup-otp-fields';
import { useLocalSignup } from '@/contexts/local-signup-context';
import { login, registerLocalClient, resendOtp, verifyOtp } from '@/services/api';
import { registerForPushNotificationsAsync } from '@/services/push-notifications';

const RESEND_DELAY = 165;

type Status = 'registering' | 'ready' | 'registration_failed';

/** Vérification OTP du numéro de téléphone lors de l'inscription client local. */
export default function LocalSignupVerifyPhoneScreen() {
  const { data } = useLocalSignup();
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<Status>('registering');
  const [otpDev, setOtpDev] = useState<string | null>(null);
  const [otpKey, setOtpKey] = useState(0);
  const registrationStarted = useRef(false);

  const phoneDisplay = data.phone ? `+242 ${data.phone}` : '+242 06 123 45 67';
  const phoneNumber = `+242${data.phone.replace(/\D/g, '')}`;
  const canResend = resendTimer <= 0;

  useEffect(() => {
    if (registrationStarted.current) return;
    registrationStarted.current = true;

    const createAccount = async () => {
      try {
        const birthDateParts = data.birthDate.split(' / ');
        const dateOfBirth = birthDateParts.length === 3
          ? `${birthDateParts[2]}-${birthDateParts[1]}-${birthDateParts[0]}`
          : data.birthDate;

        const registration = await registerLocalClient({
          nom: data.lastName.trim(),
          prenom: data.firstName.trim(),
          date_naissance: dateOfBirth,
          sexe: data.gender === 'male' ? 'homme' : 'femme',
          email: data.email.trim() || undefined,
          telephone: phoneNumber,
          mot_de_passe: data.password,
          ville: data.city.trim(),
          adresse: data.address.trim(),
        });

        // otp_dev n'est renvoyé qu'en environnement local (voir AuthController::register) — sert
        // uniquement à préremplir le code en développement, jamais à contourner la vérification :
        // la validation réelle passe toujours par verifyOtp() avec le code affiché à l'écran.
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
    if (resendTimer <= 0) return;
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
      const code = await resendOtp(phoneNumber, 'sms');
      setOtpDev(code || null);
      setResendTimer(RESEND_DELAY);
      setOtpKey((k) => k + 1);
      alert('Code renvoyé', 'Un nouveau code vous a été envoyé.');
    } catch (error) {
      alert('Erreur', error instanceof Error ? error.message : "Impossible de renvoyer le code.");
    }
  }, [canResend, phoneNumber]);

  const handleComplete = useCallback(async (code: string) => {
    if (status !== 'ready' || !code || verifying) return;
    setVerifying(true);
    try {
      const result = await verifyOtp(phoneNumber, code);
      if (!result?.token) {
        throw new Error('Code invalide. Vérifiez le code reçu et réessayez.');
      }
      await login(phoneNumber, data.password);
      registerForPushNotificationsAsync();
      router.replace('/auth/signup/local/success' as any);
    } catch (error) {
      setOtpKey((k) => k + 1);
      alert('Code incorrect', error instanceof Error ? error.message : 'Vérifiez le code reçu et réessayez.');
    } finally {
      setVerifying(false);
    }
  }, [status, verifying, phoneNumber, data.password]);

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
          source={require('@/assets/images/auth-sms-illustration.png')}
          style={styles.illustration}
        />
        <Text style={styles.title}>
          Confirmez votre{'\n'}
          <Text style={styles.titleAccent}>numéro de téléphone</Text>
        </Text>
        <Text style={styles.description}>
          Nous avons envoyé un code de vérification par SMS au <Text style={styles.bold}>{phoneDisplay}.</Text>{'\n'}
          Entrez le code ci-dessous pour continuer.
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
          Vous n&apos;avez pas reçu le code ?{' '}
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
