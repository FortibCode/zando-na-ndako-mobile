import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BackButton, InputField, PrimaryButton, authStyles } from '@/components/auth-ui';
import { DatePickerModal } from '@/components/signup/signup-picker-modal';
import { SignupRadioGroup } from '@/components/signup/signup-form-field';
import { SignupStepper } from '@/components/signup/signup-stepper';
import { useLocalSignup } from '@/contexts/local-signup-context';
import { BrandColors } from '@/constants/brand';
import { AUTH_ICONS } from '@/constants/icons';

/** Étape 1 — Informations personnelles du client local. */
export default function LocalSignupStep1Screen() {
  const { data, update } = useLocalSignup();
  const [lastName, setLastName] = useState(data.lastName);
  const [firstName, setFirstName] = useState(data.firstName);
  const [birthDate, setBirthDate] = useState(data.birthDate);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [gender, setGender] = useState(data.gender);
  const [city, setCity] = useState(data.city);

  const isValid = Boolean(lastName.trim() && firstName.trim() && birthDate.trim() && gender && city.trim());

  const handleContinue = () => {
    update({ lastName, firstName, birthDate, gender, city });
    router.push('/auth/signup/local/step2');
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <BackButton />
        </View>
        <ScrollView contentContainerStyle={authStyles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <SignupStepper currentStep={1} titles={['Informations', 'Coordonnées', 'Sécurité']} />
          <Text style={styles.title}>Vos informations personnelles</Text>
          <Text style={styles.subtitle}>Saisissez votre identité pour créer votre compte client.</Text>

          <InputField
            autoCapitalize="words"
            icon={AUTH_ICONS.lastName}
            label="Nom de famille"
            placeholder="ex: OKOMBI"
            required
            value={lastName}
            onChangeText={setLastName}
          />
          <InputField
            autoCapitalize="words"
            icon={AUTH_ICONS.firstName}
            label="Prénom(s)"
            placeholder="ex: Ruth Marie"
            required
            value={firstName}
            onChangeText={setFirstName}
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Date de naissance <Text style={styles.requiredStar}>*</Text>
            </Text>
            <Pressable onPress={() => setDatePickerOpen(true)} style={styles.selectWrap}>
              <Ionicons color={birthDate ? BrandColors.blue : '#94A3B8'} name={AUTH_ICONS.birthDate} size={20} />
              <Text style={[styles.selectText, !birthDate && styles.placeholder]}>
                {birthDate || 'JJ / MM / AAAA'}
              </Text>
              <Ionicons color="#CBD5E1" name="chevron-down" size={16} />
            </Pressable>
          </View>
          <DatePickerModal
            onClose={() => setDatePickerOpen(false)}
            onSelect={setBirthDate}
            value={birthDate}
            visible={datePickerOpen}
          />

          <SignupRadioGroup
            label="Genre / Sexe"
            options={[
              { id: 'female', label: 'Femme' },
              { id: 'male', label: 'Homme' },
            ]}
            required
            value={gender}
            onChange={(id) => setGender(id as 'female' | 'male')}
          />

          <InputField
            autoCapitalize="words"
            icon={AUTH_ICONS.location}
            label="Ville de résidence"
            placeholder="ex: Brazzaville"
            required
            value={city}
            onChangeText={setCity}
          />

          <PrimaryButton
            disabled={!isValid}
            icon={AUTH_ICONS.next}
            onPress={handleContinue}
            title="Continuer vers l'étape 2"
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
  selectWrap: {
    minHeight: 52,
    borderWidth: 1.2,
    borderColor: BrandColors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    backgroundColor: BrandColors.inputBg,
  },
  selectText: { flex: 1, color: BrandColors.textDark, fontSize: 15, fontWeight: '500' },
  placeholder: { color: '#94A3B8' },
});
