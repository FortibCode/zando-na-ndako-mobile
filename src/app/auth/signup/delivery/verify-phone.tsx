import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const autoVerifiedRef = useRef(false);

  const rawPhone = data.registrationPhone || data.driverPhone || '061234567';
  const cleanDigits = rawPhone.replace(/\D/g, '').replace(/^242/, '');
  const phoneDisplay = `+242 ${cleanDigits}`;

  // Credential propre envoyé au backend (chiffres uniquement)
  const phoneCredential = data.registrationPhone
    ? data.registrationPhone.replace(/[^0-9]/g, '')
    : cleanDigits;

  // ── Handler principal de vérification OTP ──
  const handleComplete = useCallback(
    async (code: string) => {
      if (!code || code.length < 6) return;
      setVerifying(true);
      try {
        if (phoneCredential && code) {
          await verifyOtp(phoneCredential, code);
        }
        router.replace('/auth/signup/delivery/profile' as any);
      } catch (err: any) {
        Alert.alert(
          'Code invalide',
          err?.message || 'Le code OTP est incorrect ou a expiré. Veuillez réessayer.',
          [{ text: 'OK' }],
        );
      } finally {
        setVerifying(false);
      }
    },
    [phoneCredential],
  );

  // ── Auto-vérification : si otp_dev retourné par le backend, soumettre auto après 800ms ──
  useEffect(() => {
    if (data.registrationOtp && data.registrationOtp.length === 6 && !autoVerifiedRef.current) {
      autoVerifiedRef.current = true;
      const timer = setTimeout(() => {
        handleComplete(data.registrationOtp);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [data.registrationOtp, handleComplete]);

  // ── Envoi OTP par SMS si pas de otp_dev (backend prod) ──
  useEffect(() => {
    if (!otpSent && data.registrationPhone && !data.registrationOtp) {
      setOtpSent(true);
      sendOtp(phoneCredential, 'sms').catch(() => {
        Alert.alert('Erreur', "Impossible d'envoyer le code de vérification. Vérifiez votre connexion.");
      });
    }
  }, [data.registrationPhone, data.registrationOtp, otpSent, phoneCredential]);

  // ── Compte à rebours renvoi ──
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
    autoVerifiedRef.current = false;
    try {
      await resendOtp(phoneCredential, 'sms');
      Alert.alert('Code renvoyé', 'Un nouveau code de vérification vous a été envoyé par SMS.');
    } catch {
      Alert.alert('Erreur', 'Impossible de renvoyer le code. Veuillez réessayer.');
    }
  }, [canResend, data.registrationPhone, phoneCredential]);

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <OtpVerificationLayout
          accentLabel="numéro de téléphone"
          canResend={canResend}
          initialCode={data.registrationOtp || ''}
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
