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
  View,
} from 'react-native';

import { BackButton, InputField, PrimaryButton, authStyles } from '@/components/auth-ui';
import { PhoneInput } from '@/components/phone-input';
import { SignupPickerField, DEVISE_OPTIONS } from '@/components/signup/signup-form-field';
import { SignupStepper } from '@/components/signup/signup-stepper';
import { getCountryByLabel, validatePhoneNumber } from '@/constants/countries';
import { useLocalSignup } from '@/contexts/local-signup-context';
import { BrandColors } from '@/constants/brand';
import { AUTH_ICONS } from '@/constants/icons';

/** Étape 2 — Adresse et coordonnées du client Diaspora. */
export default function OverseasSignupStep2Screen() {
  const { data, update } = useLocalSignup();
  const [address, setAddress] = useState(data.address);
  const [addressCity, setAddressCity] = useState(data.addressCity);
  const [postalCode, setPostalCode] = useState(data.postalCode);
  const [phone, setPhone] = useState(data.phone);
  const [email, setEmail] = useState(data.email);
  // Stocke l'id de l'option ('euro'/'franc_cfa'/'dollar'), pas son libellé affiché
  const [currency, setCurrency] = useState(data.currency || 'euro');

  const countryInfo = getCountryByLabel(data.country);
  const phoneValidation = validatePhoneNumber(phone, countryInfo);

  const isValid = Boolean(
    address.trim() &&
    addressCity.trim() &&
    postalCode.trim() &&
    phoneValidation.isValid,
  );

  const handleContinue = () => {
    update({ address, addressCity, postalCode, phone, email, currency, dialCode: countryInfo.dialCode });
    router.push('/auth/signup/overseas/step3' as any);
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <BackButton />
        </View>
        <ScrollView
          contentContainerStyle={authStyles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SignupStepper currentStep={2} titles={['Identité', 'Coordonnées', 'Sécurité']} />

          <Text style={styles.title}>Coordonnées à l'Étranger</Text>
          <Text style={styles.subtitle}>
            Ces informations nous permettront de vous contacter et de traiter vos paiements internationaux.
          </Text>

          <InputField
            icon={AUTH_ICONS.address}
            label="Adresse postale complète"
            placeholder="ex: 12 rue de la Paix, Appartement 3B"
            required
            value={address}
            onChangeText={setAddress}
          />

          <InputField
            autoCapitalize="words"
            icon={AUTH_ICONS.location}
            label="Ville de résidence"
            placeholder="ex: Paris, Lyon, Marseille..."
            required
            value={addressCity}
            onChangeText={setAddressCity}
          />

          <InputField
            icon={AUTH_ICONS.postalCode}
            keyboardType="numeric"
            label="Code postal"
            placeholder="ex: 75015"
            required
            value={postalCode}
            onChangeText={setPostalCode}
          />

          <InputField
            autoCapitalize="none"
            icon={AUTH_ICONS.email}
            keyboardType="email-address"
            label="Adresse email"
            placeholder="ex: ruth.okombi@gmail.com"
            value={email}
            onChangeText={setEmail}
          />

          <PhoneInput
            country={countryInfo}
            label={`Téléphone (${countryInfo.label})`}
            required
            value={phone}
            onChangeText={setPhone}
            error={phone.length > 0 && !phoneValidation.isValid ? phoneValidation.error : undefined}
          />

          <SignupPickerField
            label="Devise préférée pour les paiements"
            required
            options={DEVISE_OPTIONS}
            value={currency}
            onSelect={(option) => setCurrency(option.id)}
            pickerTitle="Choisissez votre devise"
          />

          <PrimaryButton
            disabled={!isValid}
            icon={AUTH_ICONS.next}
            onPress={handleContinue}
            title="Continuer"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: 22, paddingTop: 8 },
  title: { color: BrandColors.blue, fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  subtitle: { color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 18, marginTop: 4, lineHeight: 20 },
});
