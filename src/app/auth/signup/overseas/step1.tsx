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
import { Ionicons } from '@expo/vector-icons';

import { BackButton, InputField, PrimaryButton, authStyles } from '@/components/auth-ui';
import { DatePickerModal } from '@/components/signup/signup-picker-modal';
import { SignupPickerField, SignupRadioGroup, PAYS_OPTIONS } from '@/components/signup/signup-form-field';
import { SignupStepper } from '@/components/signup/signup-stepper';
import { useLocalSignup } from '@/contexts/local-signup-context';
import { BrandColors } from '@/constants/brand';
import { AUTH_ICONS } from '@/constants/icons';

/** Étape 1 — Informations personnelles du client Diaspora. */
export default function OverseasSignupStep1Screen() {
  const { data, update } = useLocalSignup();
  const [lastName, setLastName] = useState(data.lastName);
  const [firstName, setFirstName] = useState(data.firstName);
  const [birthDate, setBirthDate] = useState(data.birthDate);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [gender, setGender] = useState(data.gender);
  const [country, setCountry] = useState(data.country || 'France');

  const isValid = Boolean(lastName.trim() && firstName.trim() && birthDate.trim() && gender && country.trim());

  const handleContinue = () => {
    update({ lastName, firstName, birthDate, gender, city: country, country });
    router.push('/auth/signup/overseas/step2' as any);
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
          <SignupStepper currentStep={1} titles={['Identité', 'Coordonnées', 'Sécurité']} />

          {/* Badge "Diaspora" */}
          <View style={styles.diasporaBadge}>
            <Ionicons color={BrandColors.blueBright} name={AUTH_ICONS.country} size={16} />
            <Text style={styles.diasporaBadgeText}>Client Diaspora</Text>
          </View>

          <Text style={styles.title}>Votre Identité</Text>
          <Text style={styles.subtitle}>
            Renseignez vos informations personnelles telles qu'elles apparaissent sur votre pièce d'identité.
          </Text>

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

          {/* Date de naissance */}
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>
              Date de naissance <Text style={styles.required}>*</Text>
            </Text>
            <Pressable
              onPress={() => setDatePickerOpen(true)}
              style={({ pressed }) => [styles.dateInput, pressed && { borderColor: BrandColors.borderFocus }]}
            >
              <Ionicons color={birthDate ? BrandColors.blue : '#94A3B8'} name={AUTH_ICONS.birthDate} size={20} />
              <Text style={[styles.dateText, !birthDate && styles.datePlaceholder]}>
                {birthDate || 'JJ / MM / AAAA'}
              </Text>
              <Ionicons color="#CBD5E1" name="chevron-down" size={16} />
            </Pressable>
          </View>

          <DatePickerModal
            visible={datePickerOpen}
            value={birthDate}
            onSelect={setBirthDate}
            onClose={() => setDatePickerOpen(false)}
          />

          <SignupRadioGroup
            label="Genre"
            required
            value={gender}
            onChange={(id) => setGender(id as 'female' | 'male')}
            options={[
              { id: 'female', label: 'Femme' },
              { id: 'male', label: 'Homme' },
            ]}
          />

          <SignupPickerField
            label="Pays de résidence actuel"
            required
            options={PAYS_OPTIONS}
            value={country}
            onSelect={(option) => setCountry(option.label)}
            pickerTitle="Sélectionnez votre pays"
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
  diasporaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
    marginTop: 4,
  },
  diasporaBadgeText: { color: BrandColors.blueBright, fontSize: 13, fontWeight: '700' },
  title: { color: BrandColors.blue, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 18, marginTop: 4, lineHeight: 20 },
  dateField: { marginBottom: 16 },
  dateLabel: { color: BrandColors.blue, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  required: { color: '#E30613' },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: BrandColors.inputBg,
  },
  dateText: { flex: 1, color: BrandColors.blue, fontSize: 15, fontWeight: '500' },
  datePlaceholder: { color: '#94A3B8', fontWeight: '400' },
});
