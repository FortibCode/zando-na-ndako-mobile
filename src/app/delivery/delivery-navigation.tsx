import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { AlertTriangle, Camera, CheckCircle2, LocateFixed, Navigation2, RefreshCw } from 'lucide-react-native';
import { Card, DeliveryScreen, Header, OutlineButton, PrimaryButton, RouteCard, styles } from '@/components/delivery-ui';
import { LiveRouteMap, type LatLng } from '@/components/delivery/live-route-map';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { reportDeliveryPosition } from '@/services/api';

export default function DeliveryNavigation() {
  const { currentMission, confirmDepart, confirmLivraison } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [departing, setDeparting] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [driverPosition, setDriverPosition] = useState<LatLng | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const distance = currentMission?.distance_km != null ? `${currentMission.distance_km} km` : '—';
  const duree = currentMission?.duree_estimee_min;
  // Heure d'arrivée calculée à partir de la durée estimée réelle (pas de champ dédié côté backend).
  const arrivee = duree
    ? new Date(Date.now() + duree * 60000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : null;
  const destination = currentMission?.adresse_livraison;

  // Position GPS partagée pendant la course : signalée périodiquement au backend tant que le
  // livreur est en route vers le client, uniquement au premier plan (pas de suivi en arrière-plan).
  const livraisonId = currentMission?.livraison_id;
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  useEffect(() => {
    if (!livraisonId) return;
    let cancelled = false;
    (async () => {
      setLocationError(null);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setLocationError(t('deliveryNav.locationPermissionDenied', 'Localisation refusée — autorisez-la dans les réglages pour voir votre position.'));
          return;
        }
        const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) setDriverPosition({ latitude: initial.coords.latitude, longitude: initial.coords.longitude });
        watchRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 20000, distanceInterval: 50 },
          (pos) => {
            setDriverPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
            reportDeliveryPosition(livraisonId, pos.coords.latitude, pos.coords.longitude).catch(() => {});
          }
        );
      } catch {
        if (!cancelled) setLocationError(t('deliveryNav.locationError', 'Impossible de récupérer votre position.'));
      }
    })();
    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [livraisonId, retryToken, t]);

  const openGoogleMaps = useCallback(() => {
    if (!destination) return;
    const query = encodeURIComponent(destination);
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${query}`).catch(() => {});
  }, [destination]);

  const handleComplete = useCallback(() => {
    router.push('/delivery/complete' as any);
  }, []);

  const handleConfirmDepart = useCallback(async () => {
    setDeparting(true);
    try {
      await confirmDepart();
      alert(t('deliveryToClient.departConfirmedTitle', 'Départ confirmé'), t('deliveryToClient.departConfirmedDesc', 'Vous êtes en route vers le client.'));
    } catch (err: any) {
      alert('Erreur', err.message || t('deliveryToClient.departErrorDesc', 'Impossible de confirmer le départ.'));
    } finally {
      setDeparting(false);
    }
  }, [confirmDepart]);

  const handleTakeProofPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert(t('deliveryToClient.photoPermTitle', 'Autorisation requise'), t('deliveryToClient.photoPermDesc', "Activez l'accès à l'appareil photo pour prendre la preuve de livraison."));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setProofPhoto(result.assets[0].uri);
    }
  }, []);

  const handleConfirmLivraison = useCallback(async () => {
    if (!proofPhoto) {
      alert(t('deliveryToClient.photoRequiredTitle', 'Photo requise'), t('deliveryToClient.photoRequiredDesc', 'Prenez une photo de preuve de livraison avant de confirmer.'));
      return;
    }
    setDelivering(true);
    try {
      await confirmLivraison(proofPhoto);
      handleComplete();
    } catch (err: any) {
      alert('Erreur', err.message || t('deliveryToClient.deliverErrorDesc', 'Impossible de confirmer la livraison.'));
      setDelivering(false);
    }
  }, [confirmLivraison, handleComplete, proofPhoto]);

  if (!currentMission) {
    return (
      <DeliveryScreen>
        <Header title={t('deliveryToClient.title', 'Vers le client')} showStatus />
        <Animated.View entering={FadeInUp.duration(350).springify()} style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, textAlign: 'center' }]}>{t('deliveryToClient.noMissionTitle', 'Aucune mission en cours')}</Text>
          <Text style={[styles.muted, { marginTop: 8, color: colors.textSecondary, textAlign: 'center' }]}>
            {t('deliveryToClient.noMissionDesc', 'Acceptez une mission pour démarrer la livraison.')}
          </Text>
        </Animated.View>
      </DeliveryScreen>
    );
  }

  return (
    <DeliveryScreen scroll={false}>
      <Header title={t('deliveryToClient.title', 'Vers le client')} showStatus />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <RouteCard
          originLabel={currentMission.adresse_vendeur ?? currentMission.vendeur_nom ?? t('deliveryToClient.pickupPoint', 'Point de collecte')}
          originSub={currentMission.vendeur_zone}
          destinationLabel={destination ?? t('deliveryToClient.clientAddress', 'Adresse du client')}
          destinationSub={currentMission.beneficiaire_nom ?? currentMission.client_nom}
          distanceLabel={distance}
          durationLabel={duree != null ? `${duree} min` : undefined}
        />
        <LiveRouteMap
          driverPosition={driverPosition}
          destination={currentMission.coordonneesLivraison}
          destinationLabel={destination ?? t('deliveryToClient.clientAddress', 'Adresse du client')}
          originLabel={t('deliveryNav.yourPosition', 'Votre position')}
        />
        {locationError ? (
          <Pressable
            onPress={() => setRetryToken((n) => n + 1)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: colors.error + '14' }}
          >
            <AlertTriangle color={colors.error} size={18} />
            <Text style={{ flex: 1, color: colors.error, fontSize: 12.5, fontWeight: '700' }}>{locationError}</Text>
            <RefreshCw color={colors.error} size={16} />
          </Pressable>
        ) : null}

        <Animated.View entering={FadeInUp.duration(350).delay(80).springify()}>
          <Card style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {[
                [distance, t('deliveryToClient.distance', 'Distance')],
                [duree ? `${duree} min` : '—', t('deliveryToClient.estimatedTime', 'Temps estimé')],
                [arrivee || '—', t('deliveryToClient.arriveAt', 'Arriver à')],
              ].map((x) => (
                <View key={x[1]} style={{ alignItems: 'center' }}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{x[0]}</Text>
                  <Text style={[styles.muted, { marginTop: 6, fontSize: 13, color: colors.textSecondary }]}>{x[1]}</Text>
                </View>
              ))}
            </View>

            <PrimaryButton onPress={openGoogleMaps}>
              <LocateFixed color="#FFF" size={18} /> {t('deliveryToClient.launchGoogleMaps', 'Lancer Google Maps')}
            </PrimaryButton>

            <OutlineButton onPress={handleConfirmDepart}>
              <Navigation2 color={colors.primary} size={18} /> {departing ? t('deliveryToClient.confirming', 'Confirmation…') : t('deliveryToClient.confirmDeparture', 'Confirmer le départ')}
            </OutlineButton>

            {proofPhoto ? (
              <Pressable
                onPress={handleTakeProofPhoto}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}
              >
                <Image source={{ uri: proofPhoto }} style={{ width: 52, height: 52, borderRadius: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { fontSize: 14, color: colors.text }]}>{t('deliveryToClient.proofOfDelivery', 'Preuve de livraison')}</Text>
                  <Text style={[styles.muted, { fontSize: 12, color: colors.textSecondary }]}>{t('deliveryToClient.photoReady', 'Photo prête · touchez pour reprendre')}</Text>
                </View>
              </Pressable>
            ) : (
              <OutlineButton onPress={handleTakeProofPhoto}>
                <Camera color={colors.primary} size={18} /> {t('deliveryToClient.takeProofPhoto', 'Prendre la photo de preuve')}
              </OutlineButton>
            )}

            <View style={{ opacity: proofPhoto ? 1 : 0.45 }}>
              <OutlineButton onPress={handleConfirmLivraison}>
                <CheckCircle2 color={colors.fresh} size={18} /> {delivering ? t('deliveryToClient.deliveringLabel', 'Livraison…') : t('deliveryToClient.confirmDelivery', 'Confirmer la livraison')}
              </OutlineButton>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </DeliveryScreen>
  );
}
