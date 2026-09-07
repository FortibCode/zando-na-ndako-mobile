import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { SignupPickerField, type PickerOption } from '@/components/signup/signup-form-field';
import { SignupStepper } from '@/components/signup/signup-stepper';
import { DEFAULT_COUNTRY, validatePhoneNumber } from '@/constants/countries';
import { useVendorSignup } from '@/contexts/vendor-signup-context';
import { BrandColors } from '@/constants/brand';
import { AUTH_ICONS } from '@/constants/icons';
import { fetchVendeurTypesDisponibles, fetchZones } from '@/services/api';

export default function VendorSignupStep2Screen() {
  const { data, update } = useVendorSignup();
  const [storeName, setStoreName] = useState(data.storeName);
  const [storeCategory, setStoreCategory] = useState(data.storeCategory);
  const [storeZone, setStoreZone] = useState(data.storeZone);
  const [zoneId, setZoneId] = useState(data.zoneId);
  const [address, setAddress] = useState(data.address);
  const [phone, setPhone] = useState(data.phone);
  const [email, setEmail] = useState(data.email);
  const [zones, setZones] = useState<PickerOption[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [categories, setCategories] = useState<PickerOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const phoneValidation = validatePhoneNumber(phone, DEFAULT_COUNTRY);

  useEffect(() => {
    fetchVendeurTypesDisponibles()
      .then((types) => setCategories(types.map((t) => ({ id: t, label: t }))))
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    fetchZones()
      .then((apiZones) => {
        setZones(apiZones.map((z) => ({ id: z.id, label: `${z.nom_zone} — ${z.ville}` })));
      })
      .catch(() => setZones([]))
      .finally(() => setZonesLoading(false));
  }, []);

  const isValid = Boolean(
    storeName.trim() &&
    storeCategory.trim() &&
    zoneId.trim() &&
    address.trim() &&
    phoneValidation.isValid &&
    email.includes('@'),
  );

  const handleContinue = () => {
    update({ storeName, storeCategory, storeZone, zoneId, address, phone, email });
    router.push('/auth/signup/vendor/step3');
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <BackButton />
        </View>
        <ScrollView contentContainerStyle={authStyles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <SignupStepper currentStep={2} titles={['Commerçant', 'Boutique', 'Sécurité']} />
          <Text style={styles.title}>Informations de la Boutique</Text>
          <Text style={styles.subtitle}>Détails de votre commerce pour l'ouverture de votre vitrine.</Text>

          <InputField
            icon={AUTH_ICONS.storeName}
            label="Nom commercial de la boutique"
            placeholder="ex: Échoppe du Marché Total"
            required
            value={storeName}
            onChangeText={setStoreName}
          />

          {categoriesLoading ? (
            <ActivityIndicator color={BrandColors.blue} style={{ marginVertical: 12 }} />
          ) : (
            <SignupPickerField
              label="Catégorie principale de produits"
              options={categories}
              pickerTitle="Sélectionnez une catégorie"
              required
              value={storeCategory}
              onSelect={(option) => setStoreCategory(option.label)}
            />
          )}

          {zonesLoading ? (
            <ActivityIndicator color={BrandColors.blue} style={{ marginVertical: 12 }} />
          ) : (
            <SignupPickerField
              label="Zone principale de livraison"
              options={zones}
              pickerTitle="Sélectionnez votre zone"
              required
              value={storeZone}
              onSelect={(option) => { setStoreZone(option.label); setZoneId(option.id); }}
            />
          )}

          <InputField
            icon={AUTH_ICONS.address}
            label="Adresse physique du commerce"
            placeholder="ex: Avenue de la Liberté, Poto-Poto"
            required
            value={address}
            onChangeText={setAddress}
          />

          <PhoneInput
            country={DEFAULT_COUNTRY}
            label="Téléphone professionnel"
            required
            value={phone}
            onChangeText={setPhone}
            error={phone.length > 0 && !phoneValidation.isValid ? phoneValidation.error : undefined}
          />

          <InputField
            autoCapitalize="none"
            icon={AUTH_ICONS.emailWork}
            keyboardType="email-address"
            label="Adresse email professionnelle"
            placeholder="ex: contact@maboutique.cg"
            required
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
});
