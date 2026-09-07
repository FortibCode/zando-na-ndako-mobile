import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BackButton, InputField, PrimaryButton, StepProgress, authStyles } from '@/components/auth-ui';
import { PhoneInput } from '@/components/phone-input';
import { DEFAULT_COUNTRY, validatePhoneNumber } from '@/constants/countries';
import { useDeliverySignup } from '@/contexts/delivery-signup-context';
import { BrandColors } from '@/constants/brand';
import { AUTH_ICONS } from '@/constants/icons';

// Les id doivent correspondre exactement à l'enum Postgres livreurs.type_vehicule ('moto'/'voiture').
const VEHICLES = [
  { id: 'moto', label: 'Moto / Scooter', icon: 'speedometer-outline' as const },
  { id: 'voiture', label: 'Voiture / Camionnette', icon: 'car-outline' as const },
];

export default function DeliverySignupStep2Screen() {
  const { data, update } = useDeliverySignup();

  const [address, setAddress] = useState(data.address);
  const [phone, setPhone] = useState(data.driverPhone);
  const [email, setEmail] = useState(data.email);
  const [license, setLicense] = useState(data.licenseNumber);
  const [vehicle, setVehicle] = useState(data.vehicleType || 'moto');

  const phoneValidation = validatePhoneNumber(phone, DEFAULT_COUNTRY);

  const valid = Boolean(
    address.trim() &&
    phoneValidation.isValid &&
    license.trim() &&
    vehicle.trim(),
  );

  const handleNext = () => {
    update({
      address,
      driverPhone: phone,
      email,
      licenseNumber: license,
      vehicleType: vehicle,
    });
    router.push('/auth/signup/delivery/step3' as any);
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <BackButton />
      </View>

      <ScrollView contentContainerStyle={authStyles.content} keyboardShouldPersistTaps="handled">
        <StepProgress currentStep={2} totalSteps={3} stepTitles={['Identité', 'Coordonnées', 'Sécurité']} />

        <Text style={styles.title}>Coordonnées & Véhicule</Text>
        <Text style={styles.subtitle}>Informations requises pour l'attribution de vos livraisons.</Text>

        <InputField
          icon={AUTH_ICONS.address}
          label="Adresse résidentielle complète"
          placeholder="ex: Quartier Mfilou, Rue des Écoles, Brazzaville"
          required
          value={address}
          onChangeText={setAddress}
        />

        <InputField
          autoCapitalize="none"
          icon={AUTH_ICONS.emailWork}
          keyboardType="email-address"
          label="Adresse email professionnelle"
          placeholder="ex: jean.okombi@gmail.com"
          required
          value={email}
          onChangeText={setEmail}
        />

        <PhoneInput
          country={DEFAULT_COUNTRY}
          required
          value={phone}
          onChangeText={setPhone}
          error={phone.length > 0 && !phoneValidation.isValid ? phoneValidation.error : undefined}
        />

        <InputField
          icon={AUTH_ICONS.idCard}
          label="N° de permis de conduire / Pièce"
          placeholder="ex: N°3456F67890"
          required
          value={license}
          onChangeText={setLicense}
        />

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Type de véhicule de livraison <Text style={styles.requiredStar}>*</Text>
          </Text>
          <View style={styles.vehicleRow}>
            {VEHICLES.map((v) => {
              const selected = vehicle === v.id || vehicle === v.label;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => setVehicle(v.id)}
                  style={[styles.vehicleCard, selected && styles.vehicleCardSelected]}
                >
                  <Ionicons
                    color={selected ? BrandColors.blueBright : BrandColors.textMuted}
                    name={v.icon}
                    size={22}
                  />
                  <Text style={[styles.vehicleText, selected && styles.vehicleTextSelected]}>
                    {v.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <PrimaryButton
          disabled={!valid}
          icon={AUTH_ICONS.next}
          onPress={handleNext}
          title="Continuer vers la sécurité"
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
  phoneBox: {
    minHeight: 52,
    borderWidth: 1.2,
    borderColor: BrandColors.border,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: BrandColors.inputBg,
  },
  prefixBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  prefixText: { color: BrandColors.blue, fontSize: 14, fontWeight: '800' },
  phoneInput: { flex: 1, color: BrandColors.textDark, fontSize: 15, fontWeight: '500', paddingVertical: 12 },
  helperText: { color: BrandColors.textMuted, fontSize: 12, marginTop: 4 },
  vehicleRow: { flexDirection: 'column', gap: 8, marginTop: 4 },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.2,
    borderColor: BrandColors.border,
    borderRadius: 14,
    backgroundColor: BrandColors.inputBg,
  },
  vehicleCardSelected: {
    borderColor: BrandColors.blueBright,
    backgroundColor: '#EFF6FF',
  },
  vehicleText: { color: BrandColors.textDark, fontSize: 14, fontWeight: '600' },
  vehicleTextSelected: { color: BrandColors.blueBright, fontWeight: '800' },
});