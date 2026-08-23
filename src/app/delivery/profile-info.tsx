import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Camera, Check, Mail, Phone, UserRound } from 'lucide-react-native';
import { DeliveryScreen, Header, PrimaryButton } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { updateUserProfile, uploadUserPhoto, resolveMediaUrl } from '@/services/api';
import { LoadingState } from '@/components/lottie-animations';

export default function DeliveryProfileInfo() {
  const { driver, fetchDashboard } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [prenom, setPrenom] = useState(driver?.prenom ?? '');
  const [nom, setNom] = useState(driver?.nom ?? '');
  const [email, setEmail] = useState(driver?.email ?? '');
  const [telephone, setTelephone] = useState(driver?.telephone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const resolvedPhoto = resolveMediaUrl(driver?.photo_profil);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile({ nom, prenom, email });
      await fetchDashboard();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert('Erreur', err.message || t('deliveryProfileInfo.saveErrorDesc', 'Impossible de mettre à jour le profil.'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert(t('deliveryProfileInfo.photoPermTitle', 'Permission requise'), t('deliveryProfileInfo.photoPermDesc', "L'accès aux photos est nécessaire pour changer l'image."));
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
      setPhotoLoading(true);
      try {
        await uploadUserPhoto({ uri: asset.uri, fileName: asset.fileName, type: asset.mimeType });
        await fetchDashboard();
      } catch (err: any) {
        alert('Erreur', err.message || t('deliveryProfileInfo.photoSaveErrorDesc', "Impossible d'enregistrer la photo."));
      } finally {
        setPhotoLoading(false);
      }
    } catch (_err) {
      alert('Erreur', t('deliveryProfileInfo.photoErrorDesc', 'Impossible de sélectionner une photo.'));
    }
  };

  if (saving) {
    return (
      <DeliveryScreen>
        <Header title={t('deliveryProfileInfo.title', 'Mes informations')} />
        <LoadingState message={t('deliveryProfileInfo.saving', 'Enregistrement…')} size={90} />
      </DeliveryScreen>
    );
  }

  const fields = [
    { label: t('deliveryProfileInfo.firstName', 'Prénom'), value: prenom, onChange: setPrenom, icon: UserRound },
    { label: t('deliveryProfileInfo.lastName', 'Nom'), value: nom, onChange: setNom, icon: UserRound },
    { label: t('deliveryProfileInfo.email', 'Email'), value: email, onChange: setEmail, icon: Mail, keyboard: 'email-address' as const },
    { label: t('deliveryProfileInfo.phone', 'Téléphone'), value: telephone, onChange: setTelephone, icon: Phone, editable: false },
  ];

  return (
    <DeliveryScreen>
      <Header title={t('deliveryProfileInfo.title', 'Mes informations')} />

      <Animated.View entering={FadeInUp.duration(300).springify()} style={{ alignItems: 'center', marginTop: 6 }}>
        <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: colors.border }}>
          {resolvedPhoto ? (
            <Image source={{ uri: resolvedPhoto }} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel="Photo de profil" />
          ) : (
            <UserRound color={colors.primary} size={40} />
          )}
          {photoLoading && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,.4)', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color="#FFF" size="small" />
            </View>
          )}
        </View>
        <Pressable
          onPress={handleChangePhoto}
          disabled={photoLoading}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <Camera color={colors.primary} size={15} />
          <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '800' }}>{t('deliveryProfileInfo.changePhoto', 'Changer la photo')}</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(300).springify()} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 20, marginTop: 8 }}>
        {fields.map(({ label, value, onChange, icon: Icon, keyboard, editable }, idx) => {
          const isDisabled = editable === false;
          return (
            <View key={label} style={{ marginBottom: idx === fields.length - 1 ? 0 : 18 }}>
              <Text style={{ fontSize: 12, fontWeight: '900', color: colors.textSecondary, marginBottom: 8 }}>
                {label}{isDisabled ? t('deliveryProfileInfo.notEditableSuffix', ' (non modifiable)') : ''}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 15, paddingHorizontal: 14, backgroundColor: isDisabled ? colors.backgroundAlt : colors.background, opacity: isDisabled ? 0.65 : 1 }}>
                <Icon color={colors.primary} size={19} />
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  editable={!isDisabled}
                  keyboardType={keyboard}
                  placeholder={label}
                  placeholderTextColor={colors.textTertiary}
                  style={{ flex: 1, marginLeft: 11, height: 52, fontSize: 15, color: colors.text }}
                />
              </View>
            </View>
          );
        })}
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(300).delay(100).springify()} style={{ marginTop: 22 }}>
        <PrimaryButton onPress={handleSave}>
          {saved ? <><Check color="#FFF" size={18} /> {t('deliveryProfileInfo.saved', 'Enregistré')}</> : t('deliveryProfileInfo.saveInfo', 'Enregistrer mes informations')}
        </PrimaryButton>
      </Animated.View>
      <Text style={{ textAlign: 'center', color: colors.textTertiary, fontSize: 13, marginTop: 16 }}>
        {t('deliveryProfileInfo.footerNote', 'Ces informations sont utilisées pour votre profil public de livreur.')}
      </Text>
    </DeliveryScreen>
  );
}
