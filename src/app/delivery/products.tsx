import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { CheckCircle2, Fish, Phone, Store } from 'lucide-react-native';
import { Card, DeliveryScreen, Header, PrimaryButton, deliveryStyles, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

type ProductItem = {
  name: string;
  quantity: string;
  price: string;
};

export default function Products() {
  const { currentMission, confirmCollecte } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [collecting, setCollecting] = useState(false);

  const handleConfirmCollecte = useCallback(async () => {
    if (!currentMission) {
      Alert.alert('Erreur', t('deliveryProducts.errorDesc', 'Aucune mission en cours.'));
      return;
    }
    setCollecting(true);
    try {
      await confirmCollecte();
      router.push('/delivery/delivery-navigation' as any);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || t('deliveryProducts.confirmErrorDesc', 'Impossible de confirmer la collecte.'));
      setCollecting(false);
    }
  }, [currentMission, confirmCollecte]);

  const vendeurNom = currentMission?.vendeur_nom ?? t('deliveryProducts.defaultVendorName', 'Vendeur');
  const vendeurZone = currentMission?.vendeur_zone ?? '';
  const vendeurTelephone = currentMission?.vendeur_telephone;
  const items: ProductItem[] = (currentMission?.produits as any) ?? [];
  const handleCallVendeur = useCallback(() => {
    if (vendeurTelephone) Linking.openURL(`tel:${vendeurTelephone}`);
  }, [vendeurTelephone]);

  return (
    <DeliveryScreen>
      <Header title={t('deliveryProducts.title', 'Collecte des produits')} />

      <Animated.View entering={FadeInDown.duration(300).springify()} style={{ backgroundColor: colors.freshSoft, borderColor: colors.fresh + '44', borderWidth: 1, padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <CheckCircle2 color={colors.fresh} size={21} />
        <Text style={{ color: colors.fresh, fontWeight: '900', fontSize: 15 }}>{t('deliveryProducts.arrivedAtVendor', 'Vous êtes arrivé chez le vendeur')}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(300).delay(40).springify()}>
        <Card style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Store color={colors.primary} size={27} />
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{vendeurNom}</Text>
            {vendeurZone ? <Text style={[styles.muted, { marginTop: 6, fontSize: 14, color: colors.textSecondary }]}>{vendeurZone}</Text> : null}
          </View>
          <Pressable accessibilityLabel={t('deliveryProducts.callVendorAria', 'Appeler le vendeur')} onPress={handleCallVendeur} hitSlop={8} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.freshSoft, alignItems: 'center', justifyContent: 'center', opacity: vendeurTelephone ? 1 : 0.4 }}>
            <Phone color={colors.fresh} size={19} />
          </Pressable>
        </Card>
      </Animated.View>

      <Text style={[styles.sectionTitle, { marginTop: 28, color: colors.text }]}>{t('deliveryProducts.productsToCollect', 'Produits à récupérer')}</Text>

      {items.length === 0 ? (
        <Text style={[styles.muted, { marginTop: 10, color: colors.textSecondary }]}>
          {t('deliveryProducts.noDetailsDesc', 'Détail des produits indisponible pour cette commande — vérifiez la liste directement avec le vendeur.')}
        </Text>
      ) : (
        items.map((item: ProductItem, i) => (
          <Card key={item.name} index={i + 1} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', padding: 14 }}>
            <View style={[deliveryStyles.listIcon, { backgroundColor: colors.backgroundAlt }]}>
              <Fish color={colors.primary} size={22} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.sectionTitle, { fontSize: 15, color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.muted, { marginTop: 4, fontSize: 13, color: colors.textSecondary }]}>{item.quantity}</Text>
            </View>
            <Text style={{ color: colors.fresh, fontSize: 15, fontWeight: '900' }}>{item.price}</Text>
          </Card>
        ))
      )}

      <Animated.View entering={FadeInUp.duration(300).delay(150).springify()}>
        <PrimaryButton onPress={handleConfirmCollecte}>
          {collecting ? t('deliveryProducts.confirming', 'Confirmation…') : t('deliveryProducts.orderCollected', 'Commande récupérée')}
        </PrimaryButton>
      </Animated.View>
    </DeliveryScreen>
  );
}
