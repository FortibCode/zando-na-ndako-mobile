import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Bike, Clock3, MapPin, Phone, Store, UserRound, WalletCards, X, PackageSearch } from 'lucide-react-native';
import { Card, D, DeliveryScreen, Header, OutlineButton, PrimaryButton, deliveryStyles, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { MissionDetailSkeleton } from '@/components/delivery/skeleton-loader';

type MissionDetails = {
  id: string;
  numero: string;
  collecte: { nom: string; adresse: string };
  livraison: { adresse: string; client: string };
  distance: number | null;
  duree: number | null;
  montant: number;
  gain: number;
};

const ACCEPT_WINDOW_SECONDS = 30;

export default function Mission() {
  const { missions, currentMission, acceptMission, refuseMission, missionsLoading } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [timer, setTimer] = useState(ACCEPT_WINDOW_SECONDS);
  const [accepted, setAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulse = useSharedValue(1);

  const mission = currentMission ?? (missions[0] ?? null);
  const details: MissionDetails | null = mission ? {
    id: mission.id,
    numero: mission.numero_commande,
    collecte: { nom: mission.adresse_vendeur ?? mission.vendeur_nom ?? t('deliveryMission.defaultVendorName', 'Vendeur'), adresse: mission.vendeur_zone ?? '' },
    livraison: { adresse: mission.adresse_livraison, client: mission.beneficiaire_nom ?? mission.client_nom ?? t('deliveryMission.defaultClientName', 'Client') },
    distance: mission.distance_km ?? null,
    duree: mission.duree_estimee_min ?? null,
    montant: mission.montant_total ?? 0,
    // Le gain du livreur est le tarif de livraison réel de la course (calculé à la distance
    // parcourue) — pas la somme avec le montant de la commande, qui revient au vendeur/client.
    gain: mission.montant_livraison ?? 0,
  } : null;

  // Le décompte ne démarre qu'une fois la mission réellement chargée — sinon une connexion lente
  // grignotait la fenêtre d'acceptation avant même que le livreur voie l'offre.
  useEffect(() => {
    if (accepted || accepting || !details) return;
    setTimer(ACCEPT_WINDOW_SECONDS);
    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [accepted, accepting, details?.id]);

  useEffect(() => {
    if (timer <= 10 && timer > 0) {
      pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 350 }), withTiming(1, { duration: 350 })), -1, true);
    } else {
      pulse.value = withTiming(1, { duration: 150 });
    }
  }, [timer <= 10]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const handleAccept = useCallback(async () => {
    if (!details) return;
    setAccepting(true);
    try {
      await acceptMission(details.id);
      setAccepted(true);
      router.push('/delivery/navigation' as any);
    } catch (err: any) {
      Alert.alert(t('deliveryMission.unavailableAlertTitle', 'Mission indisponible'), err.message || t('deliveryMission.unavailableAlertDesc', "Cette mission n'est plus disponible, elle a probablement déjà été prise."));
      setAccepting(false);
    }
  }, [details, acceptMission]);

  const handleRefuse = useCallback(() => {
    if (details) refuseMission(details.id);
    router.back();
  }, [details, refuseMission]);

  if (missionsLoading && !mission) {
    return (
      <DeliveryScreen>
        <Header title={t('deliveryMission.title', 'Nouvelle mission')} showStatus />
        <MissionDetailSkeleton />
      </DeliveryScreen>
    );
  }

  // Aucune mission réelle disponible : on ne simule plus une fausse offre avec boutons Accepter/Refuser actifs.
  if (!details) {
    return (
      <DeliveryScreen>
        <Header title={t('deliveryMission.title', 'Nouvelle mission')} showStatus />
        <Animated.View entering={FadeInUp.duration(400).springify()} style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <PackageSearch color={colors.primary} size={44} />
          </View>
          <Text style={[styles.sectionTitle, { marginTop: 20, color: colors.text, textAlign: 'center' }]}>{t('deliveryMission.noMissionTitle', 'Aucune mission disponible')}</Text>
          <Text style={[styles.muted, { marginTop: 8, color: colors.textSecondary, textAlign: 'center' }]}>
            {t('deliveryMission.noMissionDesc', "Restez en ligne, une nouvelle mission vous sera proposée dès qu'elle sera disponible.")}
          </Text>
          <View style={{ marginTop: 28, width: '100%' }}>
            <PrimaryButton onPress={() => router.back()}>{t('deliveryMission.backToDashboard', 'Retour au tableau de bord')}</PrimaryButton>
          </View>
        </Animated.View>
      </DeliveryScreen>
    );
  }

  const timerMinutes = Math.floor(timer / 60);
  const timerSeconds = timer % 60;

  return (
    <DeliveryScreen>
      <Header title={t('deliveryMission.title', 'Nouvelle mission')} showStatus />
      <Animated.View entering={FadeInDown.duration(350).springify()} style={{ alignItems: 'center', marginBottom: 22 }}>
        <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>{t('deliveryMission.availableLabel', 'MISSION DISPONIBLE')}</Text>
        <Text style={[styles.muted, { marginTop: 5, color: colors.textSecondary }]}>#{details.numero}  •  {t('deliveryMission.receivedNow', 'Reçue maintenant')}</Text>
      </Animated.View>

      <Card index={1}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('deliveryMission.rideDetails', 'Détails de la course')}</Text>
          <View style={[styles.badge, { backgroundColor: colors.freshSoft }]}>
            <Clock3 color={D.green} size={14} />
            <Text style={[styles.badgeText, { color: D.green }]}>{details.duree != null ? `${details.duree} min` : '—'}</Text>
          </View>
        </View>

        <View style={{ marginTop: 25, flexDirection: 'row' }}>
          <View style={{ alignItems: 'center', width: 32 }}>
            <View style={deliveryStyles.timelineDotBlue} />
            <View style={[deliveryStyles.timelineLine, { backgroundColor: colors.border }]} />
            <View style={deliveryStyles.timelineDotGreen} />
          </View>
          <View style={{ flex: 1, gap: 26 }}>
            <View>
              <Text style={[styles.muted, { color: colors.textSecondary }]}>{t('deliveryMission.collectAt', 'COLLECTE CHEZ')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <Store color={D.blue} size={19} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{details.collecte.nom}</Text>
              </View>
              <Text style={[styles.muted, { marginTop: 5, marginLeft: 27, fontSize: 14, color: colors.textSecondary }]}>{details.collecte.adresse}</Text>
            </View>
            <View>
              <Text style={[styles.muted, { color: colors.textSecondary }]}>{t('deliveryMission.deliverTo', 'LIVRAISON À')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <MapPin color={D.green} size={19} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{details.livraison.adresse}</Text>
              </View>
              <Text style={[styles.muted, { marginTop: 5, marginLeft: 27, fontSize: 14, color: colors.textSecondary }]}>{details.livraison.client}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[
            [details.distance != null ? `${details.distance} km` : '—', t('deliveryMission.distance', 'Distance'), Bike, false],
            [details.duree != null ? `${details.duree} min` : '—', t('deliveryMission.duration', 'Durée'), Clock3, false],
            [`${details.gain.toLocaleString('fr-FR')} FCFA`, t('deliveryMission.youEarn', 'Vous gagnez'), WalletCards, true],
          ].map(([value, label, Icon, highlight]: any) => (
            <View key={label} style={{ alignItems: 'center', flex: 1 }}>
              <Icon color={highlight ? D.green : D.blue} size={19} />
              <Text style={[styles.sectionTitle, { fontSize: 18, marginTop: 8, color: highlight ? D.green : colors.text }]}>
                {value}
              </Text>
              <Text style={[styles.muted, { fontSize: 12, marginTop: 3, color: colors.textSecondary }]}>{label}</Text>
            </View>
          ))}
        </View>
      </Card>

{/* Seller & Client contact info */}
      <Card index={2} style={{ marginTop: 16 }}>
        <Text style={[styles.sectionTitle, { fontSize: 17, color: colors.text }]}>{t('deliveryMission.contactPoints', 'Points de contact')}</Text>
        <View style={{ marginTop: 14, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Store color={D.blue} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.muted, { fontSize: 12, color: colors.textSecondary }]}>{t('deliveryMission.seller', 'VENDEUR')}</Text>
              <Text style={[styles.sectionTitle, { fontSize: 16, color: colors.text }]}>{details.collecte.nom}</Text>
            </View>
            <Pressable onPress={() => mission?.vendeur_telephone && Linking.openURL(`tel:${mission.vendeur_telephone}`)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.freshSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Phone color={D.green} size={18} />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <UserRound color={D.blue} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.muted, { fontSize: 12, color: colors.textSecondary }]}>{t('deliveryMission.client', 'CLIENT')}</Text>
              <Text style={[styles.sectionTitle, { fontSize: 16, color: colors.text }]}>{details.livraison.client}</Text>
            </View>
            <Pressable onPress={() => mission?.client_telephone && Linking.openURL(`tel:${mission.client_telephone}`)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.freshSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Phone color={D.green} size={18} />
            </Pressable>
          </View>
        </View>
      </Card>

      {/* Instructions */}
      {mission?.instructions_particulieres ? (
        <Card style={{ marginTop: 14 }}>
          <Text style={[styles.sectionTitle, { fontSize: 16, color: colors.text }]}>{t('deliveryMission.specialInstructions', 'Instructions particulières')}</Text>
          <Text style={[styles.muted, { marginTop: 8, fontSize: 14, lineHeight: 21, color: colors.textSecondary }]}>{mission.instructions_particulieres}</Text>
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, opacity: accepting ? 0.6 : 1 }}>
        <View style={{ flex: 1 }}>
          <OutlineButton red onPress={accepting ? undefined : handleRefuse}>
            <X color={D.red} size={18} /> {t('deliveryMission.refuse', 'Refuser')}
          </OutlineButton>
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton onPress={accepting ? undefined : handleAccept}>{accepting ? t('deliveryMission.accepting', 'Acceptation…') : t('deliveryMission.accept', 'Accepter')}</PrimaryButton>
        </View>
      </View>

      <Animated.View style={pulseStyle}>
        <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 14, marginTop: 18 }}>
          {t('deliveryMission.expiresIn', 'Cette mission expirera dans')}{' '}
          <Text style={{ color: timer <= 10 ? colors.error : colors.primary, fontWeight: '900' }}>
            {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
          </Text>
        </Text>
      </Animated.View>
    </DeliveryScreen>
  );
}
