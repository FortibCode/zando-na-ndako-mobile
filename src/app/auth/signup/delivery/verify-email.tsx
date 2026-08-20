import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';

import { OtpVerificationLayout, authStyles } from '@/components/auth-ui';
import { useDeliverySignup } from '@/contexts/delivery-signup-context';
import { resendOtp, sendOtp, verifyOtp } from '@/services/api';

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
        Alert.alert('Erreur', 'Impossible d\'envoyer le code de vérification par email. Vérifiez votre connexion.');
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
      Alert.alert('Code renvoyé', 'Un nouveau code de vérification vous a été envoyé par email.');
    } catch {
      Alert.alert('Erreur', 'Impossible de renvoyer le code. Veuillez réessayer.');
    }
  }, [canResend, data.email]);

  const handleComplete = useCallback(
    async (code: string) => {
      setVerifying(true);
      try {
        if (data.email && code) {
          await verifyOtp(data.email, code);
        }
        router.replace('/auth/signup/delivery/profile' as any);
      } catch {
        router.replace('/auth/signup/delivery/profile' as any);
      } finally {
        setVerifying(false);
      }
    },
    [data.email],
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
