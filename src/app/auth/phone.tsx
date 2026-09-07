import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBrand, BackButton, GoogleButton, PrimaryButton, authStyles } from '@/components/auth-ui';
import { PhoneInput } from '@/components/phone-input';
import { BrandColors } from '@/constants/brand';
import { DEFAULT_COUNTRY, validatePhoneNumber } from '@/constants/countries';

/** Saisie du numéro : première étape de la connexion par téléphone. */
export default function PhoneLoginScreen() {
  const [phone, setPhone] = useState('');
  
  const validation = validatePhoneNumber(phone, DEFAULT_COUNTRY);
  const isValid = validation.isValid;

  return (
    <SafeAreaView style={authStyles.screenMuted}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={authStyles.contentCentered}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <BackButton />
          <AuthBrand />
          <View style={authStyles.card}>
            <Text style={authStyles.screenTitle}>Connexion par téléphone</Text>
            <Text style={authStyles.screenDescription}>
              Entrez votre numéro mobile congolais pour recevoir un code de vérification sécurisé (OTP).
            </Text>

            <PhoneInput
              country={DEFAULT_COUNTRY}
              value={phone}
              onChangeText={setPhone}
              error={phone.length > 0 && !isValid ? validation.error : undefined}
            />

            <PrimaryButton
              disabled={!isValid}
              icon="arrow-forward"
              onPress={() =>
                router.push(
                  `/auth/phone-otp?phone=${encodeURIComponent(
                    `+242${phone.replace(/\D/g, '')}`
                  )}` as any
                )
              }
              title="Recevoir le code OTP"
            />

            <View style={authStyles.dividerRow}>
              <View style={authStyles.divider} />
              <Text style={authStyles.dividerText}>OU</Text>
              <View style={authStyles.divider} />
            </View>

            <GoogleButton onPress={() => router.push('/auth/google-picker')} />
          </View>

          <Text style={authStyles.accountText}>
            Vous n'avez pas de compte ?{' '}
            <Text style={authStyles.accountLink} onPress={() => router.push('/auth/signup')}>
              Inscrivez-vous
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
