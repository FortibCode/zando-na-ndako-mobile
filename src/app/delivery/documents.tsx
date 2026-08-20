import { Alert, Pressable, Text, View } from 'react-native';
import { Car, CheckCircle2, Clock3, FileText, IdCard, ShieldCheck } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card, DeliveryScreen, Header, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

export default function DeliveryDocuments() {
  const { driver } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const statutValidation = driver?.statut_validation ?? 'valide';
  const isValide = statutValidation === 'valide';

  const docs = [
    { key: 'cni', label: t('deliveryDocuments.cniLabel', "Carte nationale d'identité"), sub: t('deliveryDocuments.cniSub', "Pièce d'identité en cours de validité"), icon: IdCard },
    { key: 'permis', label: t('deliveryDocuments.licenseLabel', 'Permis de conduire'), sub: driver?.type_vehicule ?? t('deliveryDocuments.defaultCategory', 'Catégorie A'), icon: Car },
    { key: 'vehicule', label: t('deliveryDocuments.registrationLabel', 'Carte grise du véhicule'), sub: driver?.immatriculation_vehicule ?? t('deliveryDocuments.registrationSub', 'Immatriculation fournie'), icon: FileText },
    { key: 'assurance', label: t('deliveryDocuments.insuranceLabel', 'Assurance'), sub: t('deliveryDocuments.insuranceSub', 'Assurance responsabilité civile'), icon: ShieldCheck },
  ];

  // L'envoi de documents depuis l'app n'est pas encore supporté côté serveur : plutôt que de
  // simuler un succès (photo prise puis "enregistrée" nulle part), on l'affiche honnêtement comme
  // une fonctionnalité à venir, cohérent avec les sections "Paramètres"/"Sécurité" du profil.
  const handleUpload = () => {
    Alert.alert(
      t('deliveryDocuments.uploadComingSoonTitle', 'Bientôt disponible'),
      t('deliveryDocuments.uploadComingSoonDesc', "L'envoi de documents depuis l'application arrive dans une prochaine mise à jour. En attendant, contactez le support pour transmettre vos documents.")
    );
  };

  return (
    <DeliveryScreen>
      <Header title={t('deliveryDocuments.title', 'Mes documents')} />

      <Animated.View entering={FadeInDown.duration(300).springify()} style={{ backgroundColor: isValide ? colors.freshSoft : colors.goldSoft, borderWidth: 1, borderColor: isValide ? colors.fresh + '44' : colors.gold + '44', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CheckCircle2 color={isValide ? colors.fresh : colors.gold} size={22} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: isValide ? colors.fresh : colors.gold, fontWeight: '900', fontSize: 15 }}>
            {isValide ? t('deliveryDocuments.verifiedTitle', 'Compte vérifié') : t('deliveryDocuments.pendingTitle', 'Documents en cours de vérification')}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
{isValide ? t('deliveryDocuments.verifiedSub', 'Vous pouvez recevoir des missions.') : t('deliveryDocuments.pendingSub', 'Votre dossier est en cours de validation.')}
          </Text>
        </View>
      </Animated.View>

      <Text style={[styles.sectionTitle, { marginTop: 26, color: colors.text }]}>{t('deliveryDocuments.requiredDocs', 'Documents requis')}</Text>

      {docs.map(({ key, label, sub, icon: Icon }, i) => (
        <Card key={key} index={i + 1} style={{ marginTop: 12, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon color={colors.primary} size={24} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.sectionTitle, { fontSize: 16, color: colors.text }]}>{label}</Text>
            <Text style={[styles.muted, { fontSize: 13, marginTop: 4, color: colors.textSecondary }]}>{sub}</Text>
          </View>
          {isValide ? (
            <View style={{ backgroundColor: colors.freshSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <CheckCircle2 color={colors.fresh} size={13} />
              <Text style={{ color: colors.fresh, fontSize: 12, fontWeight: '900' }}>{t('deliveryDocuments.validated', 'Validé')}</Text>
            </View>
          ) : (
            <Pressable onPress={handleUpload} style={{ backgroundColor: colors.backgroundAlt, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock3 color={colors.textSecondary} size={14} />
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '900' }}>{t('deliveryDocuments.pending', 'En attente')}</Text>
            </Pressable>
          )}
        </Card>
      ))}

      <Text style={{ marginTop: 24, color: colors.textTertiary, fontSize: 13, lineHeight: 20, textAlign: 'center' }}>
        {isValide
          ? t('deliveryDocuments.verifiedFooter', 'Votre dossier a été validé par notre équipe.')
          : t('deliveryDocuments.pendingFooter', "Votre dossier est en cours de vérification. L'envoi de documents depuis l'application arrive prochainement — contactez le support si besoin.")}
      </Text>
    </DeliveryScreen>
  );
}
