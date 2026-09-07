import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BackButton, InputField, PrimaryButton, authStyles } from '@/components/auth-ui';
import { PhoneInput } from '@/components/phone-input';
import { SignupStepper } from '@/components/signup/signup-stepper';
import { DEFAULT_COUNTRY, validatePhoneNumber } from '@/constants/countries';
import { useLocalSignup } from '@/contexts/local-signup-context';
import { BrandColors } from '@/constants/brand';
import { AUTH_ICONS } from '@/constants/icons';

/** Étape 2 — Adresse et coordonnées du client local. */
export default function LocalSignupStep2Screen() {
  const { data, update } = useLocalSignup();
  const [address, setAddress] = useState(data.address);
  const [addressCity, setAddressCity] = useState(data.addressCity || 'Brazzaville');
  const [phone, setPhone] = useState(data.phone);
  const [email, setEmail] = useState(data.email);

  const phoneValidation = validatePhoneNumber(phone, DEFAULT_COUNTRY);
  const isValid = Boolean(address.trim() && addressCity.trim() && phoneValidation.isValid);

  const handleContinue = () => {
    update({ address, addressCity, phone, email, dialCode: '+242' });
    router.push('/auth/signup/local/step3');
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <BackButton />
        </View>
        <ScrollView contentContainerStyle={authStyles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <SignupStepper currentStep={2} titles={['Informations', 'Coordonnées', 'Sécurité']} />
          <Text style={styles.title}>Adresse et coordonnées</Text>
          <Text style={styles.subtitle}>Ces informations permettent d'acheminer vos livraisons.</Text>

          <InputField
            icon={AUTH_ICONS.address}
            label="Adresse résidentielle"
            placeholder="ex: Avenue de la Paix, Poto-Poto"
            required
            value={address}
            onChangeText={setAddress}
          />

          <InputField
            autoCapitalize="words"
            icon={AUTH_ICONS.location}
            label="Ville d'habitation"
            placeholder="ex: Brazzaville"
            required
            value={addressCity}
            onChangeText={setAddressCity}
          />

          <PhoneInput
            country={DEFAULT_COUNTRY}
            required
            value={phone}
            onChangeText={setPhone}
            error={phone.length > 0 && !phoneValidation.isValid ? phoneValidation.error : undefined}
          />

          <InputField
            autoCapitalize="none"
            icon={AUTH_ICONS.email}
            keyboardType="email-address"
            label="Adresse email (optionnel)"
            placeholder="ex: ruth.okombi@gmail.com"
            value={email}
            onChangeText={setEmail}
          />

          <PrimaryButton
            disabled={!isValid}
            icon={AUTH_ICONS.next}
            onPress={handleContinue}
            title="Continuer vers la sécurité"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 22, paddingTop: 8 },
  title: { color: BrandColors.blue, fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  subtitle: { color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 18, marginTop: 4 },
  fieldContainer: { marginTop: 16, width: '100%' },
  label: { color: BrandColors.textDark, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  requiredStar: { color: BrandColors.red, fontWeight: '800' },
  phoneInput: {
    minHeight: 52,
    borderWidth: 1.2,
    borderColor: BrandColors.border,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: BrandColors.inputBg,
  },
  flag: { fontSize: 18 },
  separator: { width: 1, height: 22, backgroundColor: '#CBD5E1', marginHorizontal: 10 },
  prefix: { color: BrandColors.blue, fontSize: 15, fontWeight: '800' },
  phoneField: { flex: 1, marginLeft: 10, color: BrandColors.textDark, fontSize: 15, fontWeight: '500' },
});
