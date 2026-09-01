import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ArrowLeft, User, Mail, Phone, Calendar, MapPin, Save, Camera,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { useClient } from '@/contexts/client-context';
import { resolveMediaUrl } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

// Le backend attend une date ISO (YYYY-MM-DD) ; l'utilisateur saisit/voit un format JJ/MM/AAAA.
function isoToFr(iso?: string | null): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y.slice(0, 4)}`;
}
function frToIso(fr: string): string | null {
  const match = fr.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m}-${d}`;
}

export default function MyInfoScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { currentUser, updateProfile, uploadPhoto } = useClient();

  const [isUpdating, setIsUpdating] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  // Aperçu local de la photo tout juste choisie — sans ça, l'écran continuait d'afficher l'ancienne
  // photo (juste assombrie par le spinner) pendant tout l'envoi, jamais celle réellement choisie.
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [dateError, setDateError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setDateError(null);
    // Seuls les champs éditables sont envoyés (le téléphone n'est pas modifiable côté serveur).
    const payload: Partial<{ nom: string; prenom: string; ville: string; adresse: string; email: string; date_naissance: string }> = {};
    if (editing.nom) payload.nom = editing.nom;
    if (editing.prenom) payload.prenom = editing.prenom;
    if (editing.ville) payload.ville = editing.ville;
    if (editing.adresse) payload.adresse = editing.adresse;
    if (editing.email) payload.email = editing.email;
    if (editing.dateNaissance) {
      const iso = frToIso(editing.dateNaissance);
      if (!iso) {
        setDateError('Format attendu : JJ/MM/AAAA');
        return;
      }
      payload.date_naissance = iso;
    }

    if (Object.keys(payload).length === 0) {
      alert(t('myInfo.noChange', 'Aucune modification'), t('myInfo.noChangeDesc', 'Modifiez un champ puis enregistrez.'));
      return;
    }

    setIsUpdating(true);
    try {
      await updateProfile(payload);
      setEditing({});
      alert(t('myInfo.saved', 'Informations mises à jour'), t('myInfo.savedDesc', 'Vos informations ont bien été enregistrées.'));
    } catch (e: any) {
      alert('Erreur', e.message || 'Impossible de mettre à jour vos informations.');
    } finally {
      setIsUpdating(false);
    }
  }, [editing, updateProfile, t]);

  const handleChangePhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert('Permission requise', "L'accès aux photos est nécessaire pour changer l'image.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setLocalPhotoUri(asset.uri);

      setPhotoLoading(true);
      try {
        await uploadPhoto({
          uri: asset.uri,
          fileName: asset.fileName,
          type: asset.mimeType,
        });
        alert('Photo mise à jour', 'Votre photo de profil a bien été enregistrée.');
      } catch (e: any) {
        alert('Erreur', e.message || 'Impossible d\'enregistrer la photo.');
        setLocalPhotoUri(null);
      } finally {
        setPhotoLoading(false);
      }
    } catch (_err) {
      alert('Erreur', 'Impossible de sélectionner une photo.');
    }
  }, [uploadPhoto]);

  const resolvedPhoto = localPhotoUri || resolveMediaUrl(currentUser?.photo_profil);

  const fields = [
    { icon: User, label: t('myInfo.lastName', 'Nom'), value: currentUser?.nom || '', key: 'nom' as const, autoCapitalize: 'words' as const },
    { icon: User, label: t('myInfo.firstName', 'Prénom'), value: currentUser?.prenom || '', key: 'prenom' as const, autoCapitalize: 'words' as const },
    { icon: Mail, label: 'Email', value: currentUser?.email || '', key: 'email' as const, inputMode: 'email' as const, keyboardType: 'email-address' as const, autoCapitalize: 'none' as const, autoCorrect: false },
    { icon: Phone, label: t('myInfo.phone', 'Téléphone'), value: currentUser?.telephone || '', key: 'telephone' as const, editable: false },
    { icon: Calendar, label: t('myInfo.birthDate', 'Date de naissance'), value: isoToFr(currentUser?.date_naissance), key: 'dateNaissance' as const, placeholder: 'JJ/MM/AAAA', keyboardType: 'number-pad' as const, maxLength: 10 },
    { icon: MapPin, label: t('myInfo.city', 'Ville'), value: currentUser?.ville || '', key: 'ville' as const, autoCapitalize: 'words' as const },
    { icon: MapPin, label: t('myInfo.address', 'Adresse'), value: currentUser?.adresse || '', key: 'adresse' as const, autoCapitalize: 'sentences' as const },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primaryLight }]}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.primary }]}>{t('myInfo.title', 'Mes informations')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Gérez vos données personnelles</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar / Photo */}
        <Animated.View entering={FadeInUp.duration(350).delay(80).springify()} style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight, overflow: 'hidden' }]}>
            {resolvedPhoto ? (
              <Image
                source={{ uri: resolvedPhoto }}
                style={styles.avatarImage}
                contentFit="cover"
                accessibilityLabel="Photo de profil"
              />
            ) : (
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(currentUser?.prenom?.[0] || 'B')}{(currentUser?.nom?.[0] || 'O')}
              </Text>
            )}
            {photoLoading && (
              <View style={styles.avatarLoading}>
                <ActivityIndicator color="#FFF" size="small" />
              </View>
            )}
          </View>
          <Pressable
            onPress={handleChangePhoto}
            disabled={photoLoading}
            style={[styles.photoBtn, { borderColor: colors.primary, backgroundColor: colors.primaryLight }]}
          >
            {photoLoading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <>
                <Camera color={colors.primary} size={14} />
                <Text style={[styles.photoBtnText, { color: colors.primary }]}>{t('myInfo.changePhoto', 'Changer la photo')}</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        {/* Fields */}
        {fields.map((field, i) => {
          const Icon = field.icon;
          const editKey = field.key;
          const currentValue = editing[editKey] ?? field.value;
          const isDisabled = field.editable === false;

          return (
            <Animated.View key={field.key} entering={FadeInUp.duration(350).delay(120 + i * 60).springify()}>
              <View style={[styles.fieldCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, isDisabled && { opacity: 0.6 }]}>
                <View style={[styles.fieldIcon, { backgroundColor: colors.primaryLight }]}>
                  <Icon color={colors.primary} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    {field.label}{isDisabled ? ` (${t('myInfo.notEditable', 'non modifiable')})` : ''}
                  </Text>
                  <TextInput
                    value={currentValue}
                    onChangeText={(text) => {
                      if (field.key === 'dateNaissance') setDateError(null);
                      setEditing((prev) => ({ ...prev, [editKey]: text }));
                    }}
                    editable={!isDisabled}
                    style={[styles.fieldInput, { color: colors.primary }]}
                    inputMode={field.inputMode || 'text'}
                    keyboardType={(field as any).keyboardType}
                    autoCapitalize={(field as any).autoCapitalize || 'sentences'}
                    autoCorrect={(field as any).autoCorrect ?? true}
                    maxLength={(field as any).maxLength}
                    placeholder={(field as any).placeholder}
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>
              {field.key === 'dateNaissance' && dateError ? (
                <Text style={{ color: colors.error, fontSize: 12, marginTop: 6, marginLeft: 4 }}>{dateError}</Text>
              ) : null}
            </Animated.View>
          );
        })}

        {/* Save Button */}
        <Animated.View entering={FadeInUp.duration(350).delay(540).springify()}>
          <Pressable
            onPress={handleSave}
            disabled={isUpdating}
            style={[styles.saveBtn, { backgroundColor: isUpdating ? colors.textTertiary : colors.primary }]}
          >
            <Save color="#FFF" size={18} />
            <Text style={styles.saveBtnText}>{isUpdating ? 'Enregistrement...' : t('myInfo.save', 'Enregistrer les modifications')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { fontSize: 12.5, marginTop: 2 },
  content: { padding: 20, gap: 10, paddingBottom: 30 },

  avatarSection: { alignItems: 'center', gap: 10, paddingBottom: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6,24,59,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '900' },
  photoBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  photoBtnText: { fontSize: 13, fontWeight: '700' },

  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  fieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: { fontSize: 11, fontWeight: '700' },
  fieldInput: { fontSize: 15, fontWeight: '600', marginTop: 2, padding: 0 },

  saveBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginTop: 6,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
