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
import { SignupPickerField, type PickerOption } from '@/components/signup/signup-form-field';
import { SignupStepper } from '@/components/signup/signup-stepper';
import { useVendorSignup } from '@/contexts/vendor-signup-context';
import { BrandColors } from '@/constants/brand';
import { AUTH_ICONS } from '@/constants/icons';
import { fetchZones } from '@/services/api';

const CATEGORIES = [
  { id: 'poissonnier', label: 'Poissonnier & Produits de mer' },
  { id: 'boucher', label: 'Boucher & Charcutier' },
  { id: 'maraicher', label: 'Maraîcher & Fruits / Légumes' },
  { id: 'epicier', label: 'Épicier & Produits alimentaires' },
  { id: 'artisan', label: 'Artisanat & Fait maison' },
  { id: 'mode', label: 'Mode & Habillement' },
  { id: 'autre', label: 'Autre commerce' },
];

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

  // Les zones venaient d'une liste codée en dur incluant des villes (Pointe-Noire, Dolisie,
  // Nkayi) qui n'existent pas dans zones_livraison — le choix de l'utilisateur n'était jamais
  // envoyé au backend de toute façon (aucun champ zone_id transmis). On charge maintenant les
  // vraies zones et on transmet leur identifiant réel.
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
    phone.replace(/\D/g, '').length >= 7 &&
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

          <SignupPickerField
            label="Catégorie principale de produits"
            options={CATEGORIES}
            pickerTitle="Sélectionnez une catégorie"
            required
            value={storeCategory}
            onSelect={(option) => setStoreCategory(option.label)}
          />

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

          <InputField
            icon={AUTH_ICONS.phone}
            keyboardType="phone-pad"
            label="Téléphone professionnel"
            placeholder="ex: 06 123 45 67"
            required
            value={phone}
            onChangeText={(val) => setPhone(val.replace(/[^0-9 ]/g, ''))}
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
