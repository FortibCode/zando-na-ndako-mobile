import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Crosshair, User, Phone, Mail, MapPin, Store } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/theme-context';
import { useVendor } from '@/contexts/vendor-context';
import { useClient } from '@/contexts/client-context';
import { useLanguage } from '@/contexts/language-context';
import { uploadUserPhoto, resolveMediaUrl, updateVendeurProfil } from '@/services/api';

export default function VendorProfileInfoScreen() {
  const { colors, isDark } = useTheme();
  const { vendorFirstName, boutique } = useVendor();
  const { currentUser, refreshUser, updateProfile } = useClient();
  const { t } = useLanguage();

  const [prenom, setPrenom] = useState(vendorFirstName);
  const [telephone, setTelephone] = useState(currentUser?.telephone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [adresse, setAdresse] = useState(currentUser?.adresse || '');
  const [boutiqueNom, setBoutiqueNom] = useState(boutique.nom);
  const [boutiqueEmoji, setBoutiqueEmoji] = useState(boutique.emoji);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locating, setLocating] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(resolveMediaUrl(currentUser?.photo_profil) || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const isValid = prenom.trim().length >= 2 && boutiqueNom.trim().length >= 2;

  const handleUseCurrentPosition = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('vendorProfileInfo.locationPermTitle', 'Autorisation requise'), t('vendorProfileInfo.locationPermDesc', 'Activez la localisation pour renseigner automatiquement la position de votre boutique.'));
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(position.coords.latitude.toFixed(6));
      setLongitude(position.coords.longitude.toFixed(6));
    } catch {
      Alert.alert('Erreur', t('vendorProfileInfo.locationErrorDesc', 'Impossible de récupérer votre position actuelle.'));
    } finally {
      setLocating(false);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('vendorProfileInfo.photoPermTitle', 'Permission requise'), t('vendorProfileInfo.photoPermDesc', 'L\'accès aux photos est nécessaire pour changer l\'image.'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selected = result.assets[0];
        setUploadingPhoto(true);
        try {
          const uploadedUrl = await uploadUserPhoto({
            uri: selected.uri,
            fileName: selected.fileName || `vendeur_${Date.now()}.jpg`,
            type: selected.mimeType || 'image/jpeg',
          });
          setPhotoUri(resolveMediaUrl(uploadedUrl) || selected.uri);
          await refreshUser();
          Alert.alert(t('vendorProfileInfo.photoUpdatedTitle', '✅ Photo mise à jour'), t('vendorProfileInfo.photoUpdatedDesc', 'Votre photo a bien été enregistrée.'));
        } catch (err: any) {
          Alert.alert('Erreur', err.message || t('vendorProfileInfo.photoErrorDesc', 'Échec de l\'envoi de la photo.'));
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch (_err) {
      Alert.alert('Erreur', t('vendorProfileInfo.photoPickErrorDesc', 'Impossible de sélectionner la photo.'));
    }
  };

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      await updateProfile({
        prenom: prenom.trim(),
        email: email.trim() || undefined,
        adresse: adresse.trim() || undefined,
      });

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const hasCoords = latitude.trim().length > 0 && longitude.trim().length > 0 && !Number.isNaN(lat) && !Number.isNaN(lng);
      await updateVendeurProfil({
        nom_commerce: boutiqueNom.trim(),
        ...(hasCoords ? { coordonnees_gps: { lat, lng } } : {}),
      });

      Alert.alert(t('vendorProfileInfo.profileUpdatedTitle', '✅ Profil mis à jour'), t('vendorProfileInfo.profileUpdatedDesc', 'Vos informations ont bien été enregistrées.'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || t('vendorProfileInfo.profileErrorDesc', 'Impossible d\'enregistrer vos informations.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorProfileInfo.title', 'Informations personnelles')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).delay(60).springify()}>
          <Pressable onPress={handlePickPhoto} disabled={uploadingPhoto} style={[styles.avatarRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
              {uploadingPhoto ? (
                <ActivityIndicator color={colors.primary} />
              ) : photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarEmoji}>{boutiqueEmoji}</Text>
              )}
            </View>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {uploadingPhoto ? t('vendorProfileInfo.uploading', 'Téléversement...') : t('vendorProfileInfo.changePhoto', 'Modifier la photo')}
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(120).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('vendorProfileInfo.personalInfoSection', 'INFORMATIONS PERSONNELLES')}</Text>
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Field icon={User} label={t('vendorProfileInfo.fullName', 'Nom complet')} value={prenom} onChangeText={setPrenom} placeholder={t('vendorProfileInfo.fullNamePlaceholder', 'Votre nom')} colors={colors} />
            <Field icon={Phone} label={t('vendorProfileInfo.phoneDisabled', 'Téléphone (non modifiable)')} value={telephone} onChangeText={setTelephone} placeholder="+242..." keyboardType="phone-pad" colors={colors} disabled />
            <Field icon={Mail} label={t('vendorProfileInfo.email', 'Email')} value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" colors={colors} />
            <Field icon={MapPin} label={t('vendorProfileInfo.address', 'Adresse')} value={adresse} onChangeText={setAdresse} placeholder={t('vendorProfileInfo.addressPlaceholder', 'Avenue, quartier, ville')} colors={colors} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(200).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('vendorProfileInfo.storeInfoSection', 'INFORMATIONS BOUTIQUE')}</Text>
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Field icon={Store} label={t('vendorProfileInfo.storeName', 'Nom de la boutique')} value={boutiqueNom} onChangeText={setBoutiqueNom} placeholder={t('vendorProfileInfo.storeNamePlaceholder', 'Nom de la boutique')} colors={colors} />
            <View>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('vendorProfileInfo.storeEmoji', 'Emoji de la boutique')}</Text>
              <View style={styles.emojiRow}>
                {['🐟', '🥬', '🍅', '🛒', '🏪', '🛍️'].map((e) => (
                  <Pressable
                    key={e}
                    onPress={() => setBoutiqueEmoji(e)}
                    style={[styles.emojiOption, { borderColor: colors.border }, boutiqueEmoji === e && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
                  >
                    <Text style={styles.emojiText}>{e}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(240).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('vendorProfileInfo.storePositionSection', 'POSITION DE LA BOUTIQUE')}</Text>
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.locationHint, { color: colors.textSecondary }]}>
              {t('vendorProfileInfo.positionHint', "Sert à calculer le prix de livraison sur la vraie distance jusqu'au client.")}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field icon={MapPin} label={t('vendorProfileInfo.latitude', 'Latitude')} value={latitude} onChangeText={setLatitude} placeholder="-4.2634" keyboardType="numbers-and-punctuation" colors={colors} />
              </View>
              <View style={{ flex: 1 }}>
                <Field icon={MapPin} label={t('vendorProfileInfo.longitude', 'Longitude')} value={longitude} onChangeText={setLongitude} placeholder="15.2429" keyboardType="numbers-and-punctuation" colors={colors} />
              </View>
            </View>
            <Pressable onPress={handleUseCurrentPosition} disabled={locating} style={[styles.locateBtn, { borderColor: colors.primary }]}>
              {locating ? <ActivityIndicator color={colors.primary} size="small" /> : <Crosshair color={colors.primary} size={17} />}
              <Text style={[styles.locateBtnText, { color: colors.primary }]}>
                {locating ? t('vendorProfileInfo.locating', 'Localisation…') : t('vendorProfileInfo.useCurrentPosition', 'Utiliser ma position actuelle')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(300).springify()}>
          <Pressable onPress={handleSave} disabled={!isValid || saving} style={[styles.saveBtn, { backgroundColor: colors.primary }, (!isValid || saving) && { opacity: 0.5 }]}>
            {saving ? <ActivityIndicator color={colors.white} /> : <Text style={[styles.saveBtnText, { color: colors.white }]}>{t('vendorProfileInfo.saveChanges', 'Enregistrer les modifications')}</Text>}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ icon: Icon, label, value, onChangeText, placeholder, keyboardType, colors, disabled }: {
  icon: any; label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; keyboardType?: any; colors: any; disabled?: boolean;
}) {
  return (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: disabled ? colors.background : colors.backgroundAlt, borderColor: colors.border }, disabled && { opacity: 0.6 }]}>
        <Icon color={colors.primary} size={18} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          editable={!disabled}
          style={[styles.input, { color: colors.text }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '900' },
  content: { padding: 20, gap: 16, paddingBottom: 30 },

  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 16, borderWidth: 1 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 64, height: 64, borderRadius: 32 },
  avatarEmoji: { fontSize: 32 },
  avatarText: { fontSize: 14, fontWeight: '800' },

  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  formCard: {
    borderRadius: 18, padding: 16, gap: 14,
    borderWidth: 1,
  },

  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputWrap: {
    height: 52, borderRadius: 14, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 15 },

  emojiRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  emojiOption: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 22 },

  locationHint: { fontSize: 12.5, lineHeight: 18, marginTop: -2 },
  locateBtn: {
    height: 48, borderRadius: 14, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  locateBtnText: { fontSize: 13.5, fontWeight: '800' },

  saveBtn: {
    height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
saveBtnText: { fontSize: 16, fontWeight: '800' },
});
