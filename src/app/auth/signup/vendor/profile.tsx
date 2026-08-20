import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BackButton, PrimaryButton, authStyles } from '@/components/auth-ui';
import { BrandColors } from '@/constants/brand';
import { uploadUserPhoto, uploaderDocumentsVendeur } from '@/services/api';

type DocKey = 'shop' | 'id' | 'rccm' | 'avatar';

type UploadDoc = {
  key: DocKey;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  required: boolean;
};

const DOCUMENTS: UploadDoc[] = [
  { key: 'shop', label: 'Photo de la boutique', hint: 'Façade ou intérieur visible', icon: 'storefront-outline', required: true },
  { key: 'id', label: "Pièce d'identité nationale", hint: 'CNI, passeport ou permis', icon: 'id-card-outline', required: true },
  { key: 'rccm', label: 'Registre de commerce (RCCM)', hint: 'Document officiel du commerce', icon: 'document-text-outline', required: true },
  { key: 'avatar', label: 'Photo de profil', hint: 'Votre photo personnelle', icon: 'person-circle-outline', required: false },
];

type DocState = { uri?: string; uploading?: boolean; uploaded?: boolean };

function UploadCard({ doc, state, onPress }: { doc: UploadDoc; state: DocState; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={state.uploading}
      style={({ pressed }) => [styles.uploadCard, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.uploadIconWrap}>
        {state.uri ? (
          <Image source={{ uri: state.uri }} style={styles.uploadThumb} />
        ) : (
          <Ionicons color={BrandColors.blue} name={doc.icon} size={30} />
        )}
      </View>
      <View style={styles.uploadInfo}>
        <View style={styles.uploadLabelRow}>
          <Text style={styles.uploadLabel}>{doc.label}</Text>
          {doc.required && <Text style={styles.uploadRequired}> *</Text>}
        </View>
        <Text style={styles.uploadHint}>{state.uploaded ? 'Envoyé ✓' : doc.hint}</Text>
      </View>
      <View style={styles.uploadAction}>
        {state.uploading ? (
          <ActivityIndicator color={BrandColors.blue} size="small" />
        ) : (
          <Ionicons
            color={state.uploaded ? '#16A34A' : '#94A3B8'}
            name={state.uploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
            size={22}
          />
        )}
      </View>
    </Pressable>
  );
}

export default function VendorSignupProfileScreen() {
  const [docs, setDocs] = useState<Record<DocKey, DocState>>({ shop: {}, id: {}, rccm: {}, avatar: {} });
  const [saving, setSaving] = useState(false);

  const finish = () => router.push('/auth/signup/vendor/success' as any);

  const handlePick = async (doc: UploadDoc) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "L'accès aux photos est nécessaire pour ajouter ce document.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    setDocs((prev) => ({ ...prev, [doc.key]: { uri: asset.uri, uploading: true } }));
    try {
      const upload = { uri: asset.uri, fileName: asset.fileName, type: asset.mimeType || 'image/jpeg' };
      if (doc.key === 'avatar') {
        await uploadUserPhoto(upload);
      } else {
        const champ = doc.key === 'shop' ? 'photo_boutique' : doc.key === 'id' ? 'document_identite' : 'registre_commerce';
        await uploaderDocumentsVendeur({ [champ]: upload });
      }
      setDocs((prev) => ({ ...prev, [doc.key]: { uri: asset.uri, uploaded: true } }));
    } catch (error) {
      setDocs((prev) => ({ ...prev, [doc.key]: {} }));
      Alert.alert('Erreur', error instanceof Error ? error.message : "Impossible d'envoyer ce document.");
    }
  };

  const handleFinish = () => {
    setSaving(true);
    finish();
  };

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
            <Ionicons color="#FFFFFF" name="document-attach-outline" size={36} />
          </View>
          <Text style={styles.title}>Documents du Vendeur</Text>
          <Text style={styles.subtitle}>
            Ajoutez vos documents pour accélérer la validation de votre boutique.
          </Text>
        </View>

        {DOCUMENTS.map((doc) => (
          <UploadCard key={doc.key} doc={doc} state={docs[doc.key]} onPress={() => handlePick(doc)} />
        ))}

        <View style={styles.infoBox}>
          <Ionicons color={BrandColors.blue} name="information-circle-outline" size={20} />
          <Text style={styles.infoText}>
            Vos documents sont sécurisés et utilisés uniquement pour la vérification de votre identité.
          </Text>
        </View>

        <PrimaryButton disabled={saving} icon="checkmark-circle-outline" onPress={handleFinish} title="Enregistrer et terminer" />

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
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadThumb: { width: 54, height: 54 },
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
  skipBtn: { alignItems: 'center', marginTop: 12 },
  skipText: { color: BrandColors.blueBright, fontSize: 15, fontWeight: '600' },
});
