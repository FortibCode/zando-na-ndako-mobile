import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { LocateFixed, Navigation2 } from 'lucide-react-native';
import { Card, DeliveryScreen, Header, OutlineButton, PrimaryButton, RouteCard, styles } from '@/components/delivery-ui';
import { LiveRouteMap, type LatLng } from '@/components/delivery/live-route-map';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

export default function Navigation() {
  const { currentMission } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [driverPosition, setDriverPosition] = useState<LatLng | null>(null);

  // Position affichée sur la carte pendant le trajet vers le vendeur — usage local uniquement
  // (contrairement au trajet vers le client, cette étape n'est pas remontée au backend).
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!cancelled) setDriverPosition({ latitude: initial.coords.latitude, longitude: initial.coords.longitude });
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 8000, distanceInterval: 25 },
        (pos) => setDriverPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      );
    })();
    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, []);

  const handleStartNav = useCallback(() => {
    router.push('/delivery/pickup' as any);
  }, []);

  const destination = currentMission?.adresse_vendeur ?? currentMission?.vendeur_nom;
  const distance = currentMission?.distance_km != null ? `${currentMission.distance_km} km` : '—';
  const duree = currentMission?.duree_estimee_min;
  // Heure d'arrivée calculée à partir de la durée estimée réelle (pas de champ dédié côté backend).
  const arrivee = duree
    ? new Date(Date.now() + duree * 60000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;

  const openGoogleMaps = useCallback(() => {
    if (!destination) return;
    const query = encodeURIComponent(destination);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
    Linking.openURL(url).catch(() => {});
  }, [destination]);

  if (!currentMission) {
    return (
      <DeliveryScreen>
        <Header title={t('deliveryNav.title', 'Navigation')} showStatus />
        <Animated.View entering={FadeInUp.duration(350).springify()} style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, textAlign: 'center' }]}>{t('deliveryNav.noMissionTitle', 'Aucune mission en cours')}</Text>
          <Text style={[styles.muted, { marginTop: 8, color: colors.textSecondary, textAlign: 'center' }]}>
            {t('deliveryNav.noMissionDesc', 'Acceptez une mission pour lancer la navigation.')}
          </Text>
        </Animated.View>
      </DeliveryScreen>
    );
  }

  return (
    <DeliveryScreen>
      <Header title={t('deliveryNav.title', 'Navigation')} showStatus />
      <Animated.View entering={FadeInUp.duration(350).springify()}>
        <RouteCard
          originLabel={t('deliveryNav.yourPosition', 'Votre position')}
          destinationLabel={destination ?? t('deliveryNav.pickupPoint', 'Point de collecte')}
          destinationSub={currentMission.vendeur_zone}
          distanceLabel={distance}
          durationLabel={duree != null ? `${duree} min` : undefined}
        />
        <LiveRouteMap
          driverPosition={driverPosition}
          destination={currentMission.coordonneesVendeur}
          destinationLabel={destination ?? t('deliveryNav.pickupPoint', 'Point de collecte')}
          originLabel={t('deliveryNav.yourPosition', 'Votre position')}
        />
      </Animated.View>
      <Animated.View entering={FadeInUp.duration(350).delay(80).springify()}>
        <Card style={{ marginTop: 14, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {[
              [distance, t('deliveryNav.distance', 'Distance')],
              [duree ? `${duree} min` : '—', t('deliveryNav.estimatedTime', 'Temps estimé')],
              [arrivee || '—', t('deliveryNav.arriveAt', 'Arriver à')],
            ].map((x) => (
              <View key={x[1]} style={{ alignItems: 'center' }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{x[0]}</Text>
                <Text style={[styles.muted, { marginTop: 6, fontSize: 13, color: colors.textSecondary }]}>{x[1]}</Text>
              </View>
            ))}
          </View>
          <PrimaryButton onPress={handleStartNav}>
            <LocateFixed color="#FFF" size={18} /> {t('deliveryNav.startNav', 'Démarrer la navigation')}
          </PrimaryButton>
          <OutlineButton onPress={openGoogleMaps}>
            <Navigation2 color={colors.primary} size={18} /> {t('deliveryNav.launchGoogleMaps', 'Lancer avec Google Maps')}
          </OutlineButton>
        </Card>
      </Animated.View>
    </DeliveryScreen>
  );
}
