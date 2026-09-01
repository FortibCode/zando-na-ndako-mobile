import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, authStyles } from '@/components/auth-ui';
import { useLocalSignup } from '@/contexts/local-signup-context';
import { BrandColors } from '@/constants/brand';
import { SafeAreaView } from 'react-native-safe-area-context';

function SuccessCheck({ label }: { label: string }) {
  return (
    <View style={styles.checkRow}>
      <View style={styles.checkIcon}>
        <Ionicons color={BrandColors.white} name="checkmark" size={14} />
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </View>
  );
}

/** Écran de confirmation après inscription réussie du client local. */
export default function LocalSignupSuccessScreen() {
  const { reset } = useLocalSignup();

  const handleStart = () => {
    reset();
    router.replace('/');
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <View style={styles.iconGlow} />
          <View style={styles.iconCircle}>
            <Ionicons color={BrandColors.white} name="checkmark" size={44} />
          </View>
          <View style={[styles.confetti, styles.confettiOrange]} />
          <View style={[styles.confetti, styles.confettiBlue]} />
          <View style={[styles.confetti, styles.confettiGreen]} />
        </View>
        <Text style={styles.title}>Compte créé avec succès !</Text>
        <Text style={styles.message}>
          Bienvenue sur <Text style={styles.brand}>Zando na Ndako</Text>. Votre compte est maintenant activé et prêt à être utilisé.
        </Text>
        <View style={styles.checks}>
          <SuccessCheck label="Numéro de téléphone vérifié" />
          <SuccessCheck label="Profil client activé" />
          <SuccessCheck label="Données sécurisées" />
        </View>

        <View style={styles.buttonWrap}>
          <PrimaryButton
            icon="rocket-outline"
            onPress={handleStart}
            title="Découvrir le marché"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#D1FAE5',
    opacity: 0.7,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: BrandColors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BrandColors.green,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  confetti: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  confettiOrange: { top: 10, right: 5, backgroundColor: BrandColors.yellow },
  confettiBlue: { top: 30, left: 0, backgroundColor: BrandColors.blueBright },
  confettiGreen: { bottom: 15, right: 10, backgroundColor: BrandColors.green },
  title: {
    color: BrandColors.blue,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  brand: { fontWeight: '800', color: BrandColors.blue },
  checks: { alignSelf: 'stretch', gap: 10, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BrandColors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: { color: BrandColors.textDark, fontSize: 14, fontWeight: '600' },
  buttonWrap: { width: '100%' },
});
