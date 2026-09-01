import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { alert } from '@/contexts/alert-context';

import { OtpVerificationLayout, authStyles } from '@/components/auth-ui';
import { useDeliverySignup } from '@/contexts/delivery-signup-context';
import { login, resendOtp, verifyOtp } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const RESEND_DELAY = 165;

export default function DeliveryVerifyPhoneScreen() {
  const { data, update } = useDeliverySignup();
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpKey, setOtpKey] = useState(0);

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
      if (!code || code.length < 6 || verifying) return;
      setVerifying(true);
      try {
        if (phoneCredential && code) {
          const result = await verifyOtp(phoneCredential, code);
          if (!result?.token) {
            throw new Error('Code invalide. Vérifiez le code reçu et réessayez.');
          }
        }
        // verifyOtp() peut, en cas de coupure réseau pendant l'inscription, retourner un ancien
        // utilisateur mis en cache sur l'appareil sans nouveau jeton (voir le même correctif côté
        // vendeur) — ce login() explicite garantit qu'on continue avec une session propre pour CE
        // compte, jamais celle d'un compte précédemment utilisé sur l'appareil.
        await login(phoneCredential, data.password);
        router.replace('/auth/signup/delivery/profile' as any);
      } catch (err: any) {
        alert(
          'Code invalide',
          err?.message || 'Le code OTP est incorrect ou a expiré. Veuillez réessayer.',
          [{ text: 'OK' }],
        );
      } finally {
        setVerifying(false);
      }
    },
    [phoneCredential, data.password, verifying],
  );

  // Pas d'effet dédié "auto-vérification" ici : OtpFields (voir auth-ui.tsx) reçoit initialCode via
  // OtpVerificationLayout ci-dessous et soumet déjà tout seul un code complet au montage — un second
  // déclencheur ici faisait doublon et envoyait deux vérifications quasi simultanées pour le même
  // code, la 2e échouant systématiquement contre "Code invalide" car le serveur avait déjà marqué le
  // code "utilise" après la 1re (même symptôme, même cause que le doublon d'envoi ci-dessous).

  // Pas de second envoi ici : AuthController::register() a déjà généré ET envoyé le vrai code SMS
  // (voir genererOTP() côté backend) — un second appel /otp/send à ce stade expirait ce premier
  // code avant même que l'utilisateur ait eu le temps de le saisir, d'où un "Code invalide"
  // systématique. Seul un appel explicite (bouton "Renvoyer le code", handleResend ci-dessous) doit
  // en générer un nouveau — même convention que les parcours local/vendeur.

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
    try {
      const code = await resendOtp(phoneCredential, 'sms');
      update({ registrationOtp: code || '' });
      setOtpKey((k) => k + 1);
      alert('Code renvoyé', 'Un nouveau code de vérification vous a été envoyé par SMS.');
    } catch {
      alert('Erreur', 'Impossible de renvoyer le code. Veuillez réessayer.');
    }
  }, [canResend, data.registrationPhone, phoneCredential, update]);

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <OtpVerificationLayout
          key={otpKey}
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
