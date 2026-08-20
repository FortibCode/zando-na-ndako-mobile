import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BackButton, InputField, PrimaryButton, StepProgress, authStyles } from '@/components/auth-ui';
import { DatePickerModal } from '@/components/signup/signup-picker-modal';
import { PAYS_OPTIONS, SignupPickerField } from '@/components/signup/signup-form-field';
import { useDeliverySignup } from '@/contexts/delivery-signup-context';
import { BrandColors } from '@/constants/brand';
import { AUTH_ICONS } from '@/constants/icons';

export default function DeliverySignupStep1Screen() {
  const { data, update } = useDeliverySignup();
  const [lastName, setLastName] = useState(data.lastName);
  const [firstName, setFirstName] = useState(data.firstName);
  const [birthDate, setBirthDate] = useState(data.birthDate);
  const [country, setCountry] = useState(data.country || 'Congo-Brazzaville');
  const [openDatePicker, setOpenDatePicker] = useState(false);

  const valid = Boolean(lastName.trim() && firstName.trim() && birthDate.trim() && country.trim());

  const handleNext = () => {
    update({ lastName, firstName, birthDate, country });
    router.push('/auth/signup/delivery/step2' as any);
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={authStyles.content} keyboardShouldPersistTaps="handled">
        <StepProgress currentStep={1} totalSteps={3} stepTitles={['Identité', 'Coordonnées', 'Sécurité']} />

        <Text style={styles.title}>Informations personnelles</Text>
        <Text style={styles.subtitle}>Saisissez votre identité telle qu'elle figure sur vos documents officiels.</Text>

        <InputField
          icon={AUTH_ICONS.lastName}
          label="Nom de famille"
          placeholder="ex: OKOMBI"
          required
          value={lastName}
          onChangeText={setLastName}
        />

        <InputField
          icon={AUTH_ICONS.firstName}
          label="Prénom(s)"
          placeholder="ex: Fortune Jean"
          required
          value={firstName}
          onChangeText={setFirstName}
        />

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Date de naissance <Text style={styles.requiredStar}>*</Text>
          </Text>
          <Pressable onPress={() => setOpenDatePicker(true)} style={styles.selectWrap}>
            <Ionicons color={birthDate ? BrandColors.blue : '#94A3B8'} name={AUTH_ICONS.birthDate} size={20} />
            <Text style={[styles.selectText, !birthDate && styles.placeholderText]}>
              {birthDate || 'JJ / MM / AAAA'}
            </Text>
            <Ionicons color="#CBD5E1" name="chevron-down" size={16} />
          </Pressable>
        </View>

        <DatePickerModal
          onClose={() => setOpenDatePicker(false)}
          onSelect={setBirthDate}
          value={birthDate}
          visible={openDatePicker}
        />

        <SignupPickerField
          label="Pays de résidence"
          options={PAYS_OPTIONS}
          pickerTitle="Sélectionnez votre pays"
          required
          value={country}
          onSelect={(option) => setCountry(option.label)}
        />

        <PrimaryButton
          disabled={!valid}
          icon={AUTH_ICONS.next}
          onPress={handleNext}
          title="Continuer vers l'étape 2"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 8 },
  title: { color: BrandColors.blue, fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  subtitle: { color: '#64748B', fontSize: 14, textAlign: 'center', marginBottom: 20, marginTop: 4 },
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
    backgroundColor: BrandColors.inputBg,
  },
  selectText: { flex: 1, color: BrandColors.textDark, fontSize: 15, fontWeight: '500' },
  placeholderText: { color: '#94A3B8' },
});
