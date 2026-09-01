import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { alert } from '@/contexts/alert-context';

import { OtpVerificationLayout, authStyles } from '@/components/auth-ui';
import { sendOtp, verifyOtp, resendOtp } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const RESEND_DELAY = 165;

/** Confirmation de l'adresse email avec le code recu. */
export default function EmailOtpScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const emailAddress = email || 'email@exemple.com';
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState('');

  useEffect(() => {
    // Envoyer le code OTP automatiquement au chargement
    if (!otpSent) {
      setOtpSent(true);
      sendOtp(emailAddress, 'email')
        .then((code) => {
          if (code) setDevCode(code);
        })
        .catch(() => {});
    }
  }, [emailAddress, otpSent]);

  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleResend = useCallback(async () => {
    if (!canResend) return;
    setResendTimer(RESEND_DELAY);
    setCanResend(false);
    try {
      await resendOtp(emailAddress, 'email');
      alert('Code renvoye', 'Un nouveau code de verification vous a ete envoye par email.');
    } catch {
      alert('Erreur', 'Impossible de renvoyer le code. Veuillez reessayer.');
    }
  }, [canResend, emailAddress]);

  const handleComplete = useCallback(async (code: string) => {
    setVerifying(true);
    try {
      const result = await verifyOtp(emailAddress, code);

      const role = result.user?.type_utilisateur;
      if (role === 'livreur') {
        router.replace('/delivery/(tabs)' as any);
      } else if (role === 'vendeur') {
        router.replace('/vendor' as any);
      } else if (role === 'client') {
        router.replace('/client/(tabs)' as any);
      } else {
        alert(
          'Erreur de connexion',
          'Impossible de déterminer votre type de compte. Veuillez contacter le support.',
        );
      }
    } catch (err: any) {
      alert(
        'Code invalide',
        err?.message || 'Le code OTP est incorrect ou a expiré. Veuillez réessayer.',
      );
    } finally {
      setVerifying(false);
    }
  }, [emailAddress]);

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <OtpVerificationLayout
          accentLabel="adresse email"
          canResend={canResend}
          initialCode={devCode}
          description={
            <>
              Nous avons envoye un code de verification a{' '}
              <Text style={styles.bold}>{emailAddress}.</Text>
              {'\n'}Entrez le code ci-dessous pour continuer.
            </>
          }
          illustration={require('@/assets/images/auth-email-illustration.png')}
          onComplete={handleComplete}
          onResend={handleResend}
          recipient={emailAddress}
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
  bold: { fontWeight: '800', color: '#0D347C' },
});
