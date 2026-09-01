import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { alert } from '@/contexts/alert-context';
import { OtpVerificationLayout, authStyles } from '@/components/auth-ui';
import { useVendorSignup } from '@/contexts/vendor-signup-context';
import { registerVendor, verifyOtp, login, resendOtp } from '@/services/api';
import { registerForPushNotificationsAsync } from '@/services/push-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';

const RESEND_DELAY = 165;

type Status = 'registering' | 'ready' | 'registration_failed';

export default function VendorVerifyPhoneScreen() {
  const { data } = useVendorSignup();
  const [resendTimer, setResendTimer] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<Status>('registering');
  const [otpDev, setOtpDev] = useState<string | null>(null);
  const [otpKey, setOtpKey] = useState(0);
  const registrationStarted = useRef(false);

  const phoneNumber = `+242${data.phone.replace(/\D/g, '')}`;

  useEffect(() => {
    if (registrationStarted.current) return;
    registrationStarted.current = true;

    const createAccount = async () => {
      try {
        const birthDateParts = data.birthDate.split(' / ');
        const dateOfBirth = birthDateParts.length === 3
          ? `${birthDateParts[2]}-${birthDateParts[1]}-${birthDateParts[0]}`
          : data.birthDate;

        const registration = await registerVendor({
          nom: data.lastName.trim(),
          prenom: data.firstName.trim(),
          date_naissance: dateOfBirth,
          sexe: data.gender === 'male' ? 'homme' : 'femme',
          email: data.email.trim(),
          telephone: phoneNumber,
          mot_de_passe: data.password,
          ville: data.city.trim(),
          adresse: data.address.trim(),
          nom_commerce: data.storeName.trim(),
          categorie_principale: data.storeCategory,
          zone_id: data.zoneId || undefined,
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
    if (resendTimer <= 0) { setCanResend(true); return; }
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleResend = useCallback(async () => {
    if (!canResend) return;
    try {
      const code = await resendOtp(phoneNumber, 'sms');
      setOtpDev(code || null);
      setResendTimer(RESEND_DELAY);
      setCanResend(false);
      setOtpKey((k) => k + 1);
      alert('Code renvoyé', 'Un nouveau code de vérification a été envoyé par SMS.');
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
      await login(data.email, data.password);
      registerForPushNotificationsAsync();
      router.push('/auth/signup/vendor/profile' as any);
    } catch (error) {
      setOtpKey((k) => k + 1);
      alert('Code incorrect', error instanceof Error ? error.message : 'Vérifiez le code reçu et réessayez.');
    } finally {
      setVerifying(false);
    }
  }, [status, verifying, phoneNumber, data.email, data.password]);

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {status === 'registering' ? (
          <ActivityIndicator color="#0D347C" style={{ marginTop: 60 }} />
        ) : (
          <OtpVerificationLayout
            accentLabel="numéro de téléphone"
            canResend={canResend}
            description={<Text>Nous avons envoyé un code de vérification par SMS. Entrez le code ci-dessous pour continuer.</Text>}
            illustration={require('@/assets/images/auth-sms-illustration.png')}
            initialCode={otpDev ?? undefined}
            key={otpKey}
            onComplete={handleComplete}
            onResend={handleResend}
            resendTimer={resendTimer}
            verifying={verifying}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 26, paddingTop: 8, paddingBottom: 36, alignItems: 'center' },
});
