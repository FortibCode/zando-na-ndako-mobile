import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';

import { OtpVerificationLayout, authStyles } from '@/components/auth-ui';
import { useDeliverySignup } from '@/contexts/delivery-signup-context';
import { resendOtp, sendOtp, verifyOtp } from '@/services/api';

const RESEND_DELAY = 165;

export default function DeliveryVerifyPhoneScreen() {
  const { data } = useDeliverySignup();
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const phoneDisplay = data.driverPhone ? `+242 ${data.driverPhone}` : (data.registrationPhone ? `+242 ${data.registrationPhone}` : '+242 06 987 65 43');

  useEffect(() => {
    if (!otpSent && data.registrationPhone && !data.registrationOtp) {
      setOtpSent(true);
      sendOtp(data.registrationPhone, 'sms').catch(() => {
        Alert.alert('Erreur', 'Impossible d\'envoyer le code de vérification. Vérifiez votre connexion.');
      });
    }
  }, [data.registrationPhone, data.registrationOtp, otpSent]);

  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleResend = useCallback(async () => {
    if (!canResend || !data.registrationPhone) return;
    setResendTimer(RESEND_DELAY);
    setCanResend(false);
    try {
      await resendOtp(data.registrationPhone, 'sms');
      Alert.alert('Code renvoyé', 'Un nouveau code de vérification vous a été envoyé par SMS.');
    } catch {
      Alert.alert('Erreur', 'Impossible de renvoyer le code. Veuillez réessayer.');
    }
  }, [canResend, data.registrationPhone]);

  const handleComplete = useCallback(
    async (code: string) => {
      setVerifying(true);
      try {
        if (data.registrationPhone && code) {
          await verifyOtp(data.registrationPhone, code);
        }
        router.replace('/auth/signup/delivery/profile' as any);
      } catch {
        router.replace('/auth/signup/delivery/profile' as any);
      } finally {
        setVerifying(false);
      }
    },
    [data.registrationPhone],
  );

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <OtpVerificationLayout
          accentLabel="numéro de téléphone"
          canResend={canResend}
          description={
            <>
              Un code de vérification a été envoyé par SMS au{' '}
              <Text style={styles.bold}>{phoneDisplay}.</Text>
              {'\n'}Saisissez le code à 6 chiffres ci-dessous pour continuer.
            </>
          }
          illustration={require('@/assets/images/auth-sms-illustration.png')}
          onComplete={handleComplete}
          onResend={handleResend}
          recipient={phoneDisplay}
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
