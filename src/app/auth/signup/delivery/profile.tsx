import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton, PrimaryButton, authStyles } from '@/components/auth-ui';
import { BrandColors } from '@/constants/brand';

type UploadDoc = {
  key: string;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  required: boolean;
};

const DOCUMENTS: UploadDoc[] = [
  { key: 'avatar', label: 'Photo de profil professionnelle', hint: 'Visage dégagé et souriant', icon: 'camera-outline', required: true },
  { key: 'id', label: "Pièce d'identité officielle", hint: 'CNI, Passeport ou Permis de conduire', icon: 'id-card-outline', required: true },
  { key: 'vehicle', label: 'Carte grise / Preuve du véhicule', hint: 'Moto ou voiture de livraison', icon: 'car-outline', required: true },
];

function UploadCard({ doc, onPress }: { doc: UploadDoc; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.uploadCard, pressed && { opacity: 0.88 }]}
    >
      <View style={styles.uploadIconWrap}>
        <Ionicons color={BrandColors.blue} name={doc.icon} size={28} />
      </View>
      <View style={styles.uploadInfo}>
        <View style={styles.uploadLabelRow}>
          <Text style={styles.uploadLabel}>{doc.label}</Text>
          {doc.required && <Text style={styles.uploadRequired}> *</Text>}
        </View>
        <Text style={styles.uploadHint}>{doc.hint}</Text>
      </View>
      <View style={styles.uploadAction}>
        <Ionicons color="#94A3B8" name="cloud-upload-outline" size={22} />
      </View>
    </Pressable>
  );
}

export default function DeliverySignupProfileScreen() {
  const finish = () => router.push('/auth/signup/delivery/success' as any);

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <Ionicons color="#FFFFFF" name="car-outline" size={38} />
          </View>
          <Text style={styles.title}>Profil du Livreur</Text>
          <Text style={styles.subtitle}>
            Téléchargez les pièces requises pour faire valider votre profil de livreur partenaire.
          </Text>
        </View>

        {DOCUMENTS.map((doc) => (
          <UploadCard key={doc.key} doc={doc} onPress={finish} />
        ))}

        <View style={styles.infoBox}>
          <Ionicons color={BrandColors.blue} name="shield-checkmark-outline" size={20} />
          <Text style={styles.infoText}>
            Vos documents sont sécurisés et traités en toute confidentialité par l'équipe Zando na Ndako.
          </Text>
        </View>

        <PrimaryButton icon="checkmark-done-circle-outline" onPress={finish} title="Enregistrer et terminer" />

        <Pressable onPress={finish} style={styles.skipBtn}>
          <Text style={styles.skipText}>Compléter plus tard</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 8 },
  content: { paddingHorizontal: 22, paddingBottom: 32 },
  heroRow: { alignItems: 'center', paddingTop: 8, paddingBottom: 22 },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: BrandColors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: BrandColors.blue,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: { color: BrandColors.blue, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#64748B', fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F4',
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  uploadIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadInfo: { flex: 1 },
  uploadLabelRow: { flexDirection: 'row', alignItems: 'center' },
  uploadLabel: { color: '#1E293B', fontSize: 14, fontWeight: '700' },
  uploadRequired: { color: '#E30613', fontSize: 14, fontWeight: '700' },
  uploadHint: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  uploadAction: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#EEF4FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 22,
    marginTop: 6,
  },
  infoText: { flex: 1, color: '#334155', fontSize: 12.5, lineHeight: 19 },
  skipBtn: { alignItems: 'center', marginTop: 14 },
  skipText: { color: BrandColors.blueBright, fontSize: 15, fontWeight: '600' },
});
