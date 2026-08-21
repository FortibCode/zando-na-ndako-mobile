import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';

import { OtpVerificationLayout, authStyles } from '@/components/auth-ui';
import { sendOtp, verifyOtp, resendOtp } from '@/services/api';

const RESEND_DELAY = 165;

/** Verification du code OTP envoye au numero de telephone. */
export default function PhoneOtpScreen() {
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  // Décoder l'URL et normaliser : garder uniquement chiffres + indicatif
  const rawPhone = phone ? decodeURIComponent(phone) : '+242061234567';
  const phoneNumber = rawPhone.startsWith('+') ? rawPhone : `+242${rawPhone.replace(/\D/g, '')}`;
  // Credential propre (chiffres uniquement) envoyé au backend
  const phoneCredential = phoneNumber.replace(/[^0-9]/g, '');
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState('');

  useEffect(() => {
    // Envoyer le code OTP automatiquement au chargement
    if (!otpSent) {
      setOtpSent(true);
      sendOtp(phoneCredential, 'sms')
        .then((code) => {
          if (code) setDevCode(code);
        })
        .catch(() => {});
    }
  }, [phoneNumber, otpSent]);

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
      await resendOtp(phoneCredential, 'sms');
      Alert.alert('Code renvoye', 'Un nouveau code de verification vous a ete envoye par SMS.');
    } catch {
      Alert.alert('Erreur', 'Impossible de renvoyer le code. Veuillez reessayer.');
    }
  }, [canResend, phoneNumber]);

  const handleComplete = useCallback(async (code: string) => {
    setVerifying(true);
    try {
      const result = await verifyOtp(phoneCredential, code);

      // Mode dev sans backend et sans user local : sélecteur de rôle
      if ((result as any).__devMode) {
        setVerifying(false);
        Alert.alert(
          '🛠 Mode développement',
          'Backend non disponible. Choisissez l\'interface à tester :',
          [
            { text: 'Client', onPress: () => router.replace('/client/(tabs)' as any) },
            { text: 'Livreur', onPress: () => router.replace('/delivery/(tabs)' as any) },
            { text: 'Vendeur', onPress: () => router.replace('/vendor' as any) },
          ],
        );
        return;
      }

      const role = result.user?.type_utilisateur;
      if (role === 'livreur') {
        router.replace('/delivery/(tabs)' as any);
      } else if (role === 'vendeur') {
        router.replace('/vendor' as any);
      } else if (role === 'client') {
        router.replace('/client/(tabs)' as any);
      } else {
        Alert.alert(
          'Erreur de connexion',
          'Impossible de déterminer votre type de compte. Veuillez contacter le support.',
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Code invalide',
        err?.message || 'Le code OTP est incorrect ou a expiré. Veuillez réessayer.',
      );
    } finally {
      setVerifying(false);
    }
  }, [phoneNumber]);

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <OtpVerificationLayout
          accentLabel="numero de telephone"
          canResend={canResend}
          initialCode={devCode}
          description={
            <>
              Nous avons envoye un code de verification par SMS au{' '}
              <Text style={styles.bold}>{phoneNumber}.</Text>
              {'\n'}Entrez le code ci-dessous pour continuer.
            </>
          }
          illustration={require('@/assets/images/auth-sms-illustration.png')}
          onComplete={handleComplete}
          onResend={handleResend}
          recipient={phoneNumber}
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
