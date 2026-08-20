import { router } from 'expo-router';
import { Linking, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { CheckCircle2, ChevronRight, Phone, Store } from 'lucide-react-native';
import { Card, DeliveryScreen, Header, PrimaryButton, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

export default function Pickup() {
  const { currentMission } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();

  if (!currentMission) {
    return (
      <DeliveryScreen>
        <Header title={t('deliveryPickup.title', 'Collecte au marché')} showStatus />
        <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, textAlign: 'center' }]}>{t('deliveryPickup.noMissionTitle', 'Aucune mission en cours')}</Text>
          <Text style={[styles.muted, { marginTop: 8, color: colors.textSecondary, textAlign: 'center' }]}>
            {t('deliveryPickup.noMissionDesc', 'Acceptez une mission pour démarrer une collecte.')}
          </Text>
        </Animated.View>
      </DeliveryScreen>
    );
  }

  const vendeurNom = currentMission.vendeur_nom ?? t('deliveryPickup.defaultVendorName', 'Vendeur');
  const vendeurZone = currentMission.vendeur_zone ?? '';
  const vendeurTelephone = currentMission.vendeur_telephone;

  return (
    <DeliveryScreen>
      <Header title={t('deliveryPickup.title', 'Collecte au marché')} showStatus />
      <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>{t('deliveryPickup.missionPrefix', 'MISSION')} {currentMission.numero_commande}</Text>

      <Animated.View entering={FadeInUp.duration(350).springify()} style={{ backgroundColor: colors.freshSoft, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.fresh, alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 color="#FFF" size={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.fresh, fontWeight: '900', fontSize: 15 }}>{t('deliveryPickup.arrivedTitle', 'Vous êtes arrivé')}</Text>
          <Text style={[styles.muted, { fontSize: 12.5, marginTop: 3, color: colors.textSecondary }]}>{t('deliveryPickup.arrivedSub', 'Au point de collecte indiqué')}</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(60).springify()}>
        <Card style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Store color={colors.primary} size={26} />
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={[styles.sectionTitle, { fontSize: 17, color: colors.text }]}>{vendeurNom}</Text>
            {vendeurZone ? <Text style={[styles.muted, { marginTop: 4, fontSize: 13.5, color: colors.textSecondary }]}>{vendeurZone}</Text> : null}
          </View>
          <Pressable
            accessibilityLabel={t('deliveryPickup.callVendorAria', 'Appeler le vendeur')}
            onPress={() => vendeurTelephone && Linking.openURL(`tel:${vendeurTelephone}`)}
            hitSlop={8}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.freshSoft, alignItems: 'center', justifyContent: 'center', opacity: vendeurTelephone ? 1 : 0.4 }}
          >
            <Phone color={colors.fresh} size={19} />
          </Pressable>
        </Card>
      </Animated.View>

      <PrimaryButton onPress={() => router.push('/delivery/products' as any)}>
        {t('deliveryPickup.viewProducts', 'Voir les produits à récupérer')} <ChevronRight color="#FFF" size={18} />
      </PrimaryButton>
    </DeliveryScreen>
  );
}
