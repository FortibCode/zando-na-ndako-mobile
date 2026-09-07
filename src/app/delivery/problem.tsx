import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { AlertTriangle, Camera, Headphones, MapPin, PackageX, Store, Trash2, UserRound, XCircle } from 'lucide-react-native';
import { DeliveryScreen, Header, OutlineButton, PrimaryButton, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { LoadingState, SuccessState } from '@/components/lottie-animations';
import { DeliveryErrorState } from '@/components/delivery/error-boundary';

export default function Problem() {
  const { currentMission, signalerProbleme } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const PROBLEM_OPTIONS = [
    { title: t('deliveryProblem.reason1Title', 'Client absent'), subtitle: t('deliveryProblem.reason1Sub', "Personne ne répond à l'adresse"), icon: UserRound },
    { title: t('deliveryProblem.reason2Title', 'Vendeur absent'), subtitle: t('deliveryProblem.reason2Sub', "Le vendeur n'est pas présent"), icon: Store },
    { title: t('deliveryProblem.reason3Title', 'Produit manquant'), subtitle: t('deliveryProblem.reason3Sub', 'Un ou plusieurs produits manquent'), icon: PackageX },
    { title: t('deliveryProblem.reason4Title', 'Mauvaise adresse'), subtitle: t('deliveryProblem.reason4Sub', "L'adresse fournie est incorrecte"), icon: MapPin },
    { title: t('deliveryProblem.reason5Title', 'Livraison impossible'), subtitle: t('deliveryProblem.reason5Sub', 'Accès impossible ou autre raison'), icon: XCircle },
  ];

  const [selected, setSelected] = useState('');
  const [details, setDetails] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleTakePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert(t('deliveryProblem.photoPermTitle', 'Autorisation requise'), t('deliveryProblem.photoPermDesc', "Activez l'accès à l'appareil photo pour joindre une photo au signalement."));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: false });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhoto(result.assets[0].uri);
    }
  }, [t]);

  const handleSubmit = useCallback(async () => {
    if (!selected) {
      alert(t('deliveryProblem.selectReasonTitle', 'Motif requis'), t('deliveryProblem.selectReasonDesc', 'Veuillez sélectionner le motif du problème ci-dessus avant de valider.'));
      return;
    }
    if (status === 'loading') return;
    if (!currentMission) {
      alert('Erreur', t('deliveryProblem.noMissionAlertDesc', 'Aucune mission en cours sélectionnée.'));
      return;
    }
    setStatus('loading');
    try {
      await signalerProbleme(details, selected, photo || undefined);
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || t('deliveryProblem.sendErrorDesc', "Erreur lors de l'envoi du signalement."));
      setStatus('error');
    }
  }, [selected, status, details, photo, currentMission, signalerProbleme, t]);

  if (status === 'loading') {
    return (
      <DeliveryScreen>
        <Header title={t('deliveryProblem.submittingTitle', 'Signalement en cours...')} />
        <LoadingState message={t('deliveryProblem.submittingMessage', 'Envoi de votre signalement...')} size={100} />
      </DeliveryScreen>
    );
  }

  if (status === 'success') {
    return (
      <DeliveryScreen>
        <Header title={t('deliveryProblem.sentTitle', 'Signalement envoyé')} />
        <SuccessState message={t('deliveryProblem.sentMessage', 'Votre signalement a été transmis à notre équipe. Nous vous répondrons dans les plus brefs délais.')} size={120} />
        <PrimaryButton onPress={() => setStatus('idle')}>{t('deliveryProblem.reportAnother', 'Signaler un autre problème')}</PrimaryButton>
      </DeliveryScreen>
    );
  }

  if (status === 'error') {
    return (
      <DeliveryScreen>
        <Header title={t('deliveryProblem.errorTitle', 'Erreur')} />
        <DeliveryErrorState message={errorMsg} onRetry={() => setStatus('idle')} />
      </DeliveryScreen>
    );
  }

  return (
    <DeliveryScreen>
      <Header
        title={t('deliveryProblem.title', 'Signaler un problème')}
        action={
          <Pressable accessibilityLabel={t('deliveryProblem.contactSupportAria', 'Contacter le support')} onPress={() => router.push('/delivery/support' as any)} hitSlop={10}>
            <Headphones color={colors.primary} size={22} />
          </Pressable>
        }
      />

      <Animated.View entering={FadeInDown.duration(300).springify()} style={{ backgroundColor: colors.error + '14', borderColor: colors.error + '44', borderWidth: 1, padding: 17, borderRadius: 18, flexDirection: 'row', gap: 12 }}>
        <AlertTriangle color={colors.error} size={25} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.error, fontSize: 18, fontWeight: '900' }}>{t('deliveryProblem.bannerTitle', "Dites-nous ce qui s'est passé")}</Text>
          <Text style={[styles.muted, { marginTop: 6, fontSize: 14, lineHeight: 21, color: colors.textSecondary }]}>{t('deliveryProblem.bannerDesc', 'Votre signalement sera traité par notre équipe support.')}</Text>
        </View>
      </Animated.View>

      <Text style={[styles.sectionTitle, { marginTop: 27, fontSize: 19, color: colors.text }]}>{t('deliveryProblem.whatProblem', 'Quel est le problème ?')}</Text>

      {PROBLEM_OPTIONS.map(({ title, subtitle, icon: Icon }, i) => (
        <Animated.View key={title} entering={FadeInUp.duration(300).delay(60 + i * 50).springify()}>
          <Pressable
            onPress={() => setSelected(title)}
            style={{
              borderWidth: 1.5,
              borderColor: selected === title ? colors.error : colors.border,
              backgroundColor: selected === title ? colors.error + '10' : colors.surface,
              borderRadius: 16,
              padding: 14,
              marginTop: 9,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: selected === title ? colors.error + '18' : colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Icon color={selected === title ? colors.error : colors.primary} size={21} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.muted, { fontSize: 13, marginTop: 4, color: colors.textSecondary }]}>{subtitle}</Text>
            </View>
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected === title ? colors.error : colors.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
              {selected === title && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error }} />}
            </View>
          </Pressable>
        </Animated.View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: 25, fontSize: 18, color: colors.text }]}>
        {t('deliveryProblem.addDetails', 'Ajouter des détails')} <Text style={[styles.muted, { color: colors.textSecondary }]}>{t('deliveryProblem.optional', '(optionnel)')}</Text>
      </Text>

      <TextInput
        multiline
        placeholder={t('deliveryProblem.detailsPlaceholder', 'Décrivez le problème en détails...')}
        placeholderTextColor={colors.textTertiary}
        value={details}
        onChangeText={setDetails}
        style={{
          height: 110,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 14,
          marginTop: 10,
          textAlignVertical: 'top',
          fontSize: 15,
          color: colors.text,
          backgroundColor: colors.surface,
        }}
      />

      {photo ? (
        <View style={{ marginTop: 14, position: 'relative' }}>
          <Image source={{ uri: photo }} style={{ width: '100%', height: 160, borderRadius: 16 }} />
          <Pressable
            onPress={() => setPhoto(null)}
            accessibilityLabel={t('deliveryProblem.removePhotoAria', 'Supprimer la photo')}
            style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Trash2 color="#FFF" size={16} />
          </Pressable>
        </View>
      ) : (
        <View style={{ marginTop: 14 }}>
          <OutlineButton onPress={handleTakePhoto}>
            <Camera color={colors.primary} size={19} /> {t('deliveryProblem.addPhoto', 'Ajouter une photo')}
          </OutlineButton>
        </View>
      )}

      <PrimaryButton red onPress={handleSubmit}>
        <AlertTriangle color="#FFF" size={18} /> {t('deliveryProblem.sendReport', 'Envoyer le signalement')}
      </PrimaryButton>
    </DeliveryScreen>
  );
}
