import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { alert } from '@/contexts/alert-context';

import { OtpVerificationLayout, authStyles } from '@/components/auth-ui';
import { useDeliverySignup } from '@/contexts/delivery-signup-context';
import { login, resendOtp, sendOtp, verifyOtp } from '@/services/api';

const RESEND_DELAY = 165;

export default function DeliveryVerifyEmailScreen() {
  const { data } = useDeliverySignup();
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (!otpSent && data.email && !data.registrationOtp) {
      setOtpSent(true);
      sendOtp(data.email, 'email').catch(() => {
        alert('Erreur', 'Impossible d\'envoyer le code de vérification par email. Vérifiez votre connexion.');
      });
    }
  }, [data.email, data.registrationOtp, otpSent]);

  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleResend = useCallback(async () => {
    if (!canResend || !data.email) return;
    setResendTimer(RESEND_DELAY);
    setCanResend(false);
    try {
      await resendOtp(data.email, 'email');
      alert('Code renvoyé', 'Un nouveau code de vérification vous a été envoyé par email.');
    } catch {
      alert('Erreur', 'Impossible de renvoyer le code. Veuillez réessayer.');
    }
  }, [canResend, data.email]);

  const handleComplete = useCallback(
    async (code: string) => {
      setVerifying(true);
      try {
        if (data.email && code) {
          const result = await verifyOtp(data.email, code);
          if (!result?.token) {
            throw new Error('Code invalide. Vérifiez le code reçu et réessayez.');
          }
        }
        // Même correctif que verify-phone.tsx (et le pattern déjà utilisé côté vendeur) : garantit
        // une session propre pour CE compte plutôt que de risquer de continuer avec un ancien
        // utilisateur mis en cache par le filet de sécurité "hors-ligne" de verifyOtp().
        await login(data.email, data.password);
        router.replace('/auth/signup/delivery/profile' as any);
      } catch (err) {
        alert('Code invalide', err instanceof Error ? err.message : 'Le code OTP est incorrect ou a expiré. Veuillez réessayer.');
      } finally {
        setVerifying(false);
      }
    },
    [data.email, data.password],
  );

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <OtpVerificationLayout
          accentLabel="adresse email"
          canResend={canResend}
          description={
            <>
              Nous avons envoyé un code de vérification à{' '}
              <Text style={styles.bold}>{data.email || 'email@exemple.com'}.</Text>
              {'\n'}Entrez le code ci-dessous pour continuer.
            </>
          }
          illustration={require('@/assets/images/auth-email-illustration.png')}
          onComplete={handleComplete}
          onResend={handleResend}
          recipient={data.email}
          resendTimer={resendTimer}
          verifying={verifying}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 8,
    paddingBottom: 36,
    alignItems: 'center',
  },
  bold: { color: '#0D347C', fontWeight: '800' },
});
