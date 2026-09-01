import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Linking } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { ArrowLeft, Phone, MessageCircle, Bike, Home, MapPin, CheckCircle, Package, RefreshCw, User } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { fetchClientCommandeSuivi, type ApiCommandeSuivi } from '@/services/api';
import { LiveRouteMap } from '@/components/delivery/live-route-map';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const DEFAULT_STEPS = [
    { label: t('tracking.stepConfirmed', 'Confirmée'), icon: CheckCircle, done: true },
    { label: t('tracking.stepPurchase', 'Achat'), icon: Package, done: true },
    { label: t('tracking.stepPreparing', 'Préparation'), icon: Package, done: true },
    { label: t('tracking.stepEnRoute', 'En route'), icon: Bike, done: true },
    { label: t('tracking.stepOut', 'Sortie'), icon: MapPin, done: false },
    { label: t('tracking.stepDelivered', 'Livrée'), icon: Home, done: false },
  ];

  const [suivi, setSuivi] = useState<ApiCommandeSuivi | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSuivi = useCallback(async () => {
    if (!id || id.startsWith('demo')) return;
    setLoading(true);
    try {
      const data = await fetchClientCommandeSuivi(id);
      setSuivi(data);
    } catch (_err) {
      // mode démo / fallback
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSuivi();
    const interval = setInterval(loadSuivi, 15000); // Polling 15s pour mise à jour live
    return () => clearInterval(interval);
  }, [loadSuivi]);

  const commandeTitle = `${t('orderDetail.order', 'Commande')} #${suivi ? suivi.numero_commande : `ZNND-2024-${id || '000123'}`}`;
  const driverName = suivi?.livreur?.nom || null;
  const driverPhone = suivi?.livreur?.telephone;

  // Calcul du taux d'avancement (0 étape faite est un état réel et valide, pas un cas "à ignorer")
  const etapesData = suivi?.etapes || [];
  const totalEtapes = etapesData.length || 5;
  const doneEtapesCount = etapesData.length > 0 ? etapesData.filter((e) => e.fait).length : 3;
  const progressPercent = Math.min(100, Math.round((doneEtapesCount / totalEtapes) * 100));

  const stepsToRender = etapesData.length > 0
    ? etapesData.map((e) => {
        let Icon = Package;
        if (e.code === 'confirmee') Icon = CheckCircle;
        else if (e.code === 'achat_marche') Icon = Package;
        else if (e.code === 'preparation') Icon = Package;
        else if (e.code === 'en_route') Icon = Bike;
        else if (e.code === 'livree') Icon = Home;
        return { label: e.label, icon: Icon, done: e.fait };
      })
    : DEFAULT_STEPS;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <Pressable onPress={() => router.back()}><ArrowLeft color={colors.primary} size={27} /></Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{commandeTitle}</Text>
        <Pressable onPress={loadSuivi} style={[styles.refreshBtn, { backgroundColor: colors.primarySoft }]}>
          <RefreshCw color={colors.primary} size={18} />
        </Pressable>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Map */}
        {suivi?.destination ? (
          <Animated.View entering={ZoomIn.duration(500).springify()} style={styles.mapWrap}>
            <LiveRouteMap
              driverPosition={suivi.derniere_position ? { latitude: suivi.derniere_position.lat, longitude: suivi.derniere_position.lng } : null}
              destination={{ latitude: suivi.destination.lat, longitude: suivi.destination.lng }}
              destinationLabel={t('tracking.deliveryAddress', 'Adresse de livraison')}
              originLabel={driverName ?? t('tracking.driverLabel', 'Livreur Zando')}
              height={300}
            />
            {!suivi.derniere_position ? (
              <View style={[styles.mapHint, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.mapHintText, { color: colors.textSecondary }]}>
                  {t('tracking.noDriverPositionYet', 'La position du livreur apparaîtra ici une fois la course commencée.')}
                </Text>
              </View>
            ) : null}
          </Animated.View>
        ) : (
          <Animated.View
            entering={ZoomIn.duration(500).springify()}
            style={[styles.map, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}
          >
            <MapPin color={colors.textTertiary} size={28} />
            <Text style={[styles.mapLabel, { position: 'relative', left: 0, top: 0, marginTop: 10, color: colors.textSecondary }]}>
              {t('tracking.mapUnavailable', 'Carte indisponible pour cette commande')}
            </Text>
          </Animated.View>
        )}

        {/* Driver Card — uniquement si un livreur est réellement assigné */}
        {driverName ? (
          <Animated.View
            entering={FadeInUp.duration(400).delay(200).springify()}
            style={[styles.driverCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.driverAvatar, { backgroundColor: colors.primarySoft }]}>
              <User color={colors.primary} size={32} />
            </View>
            <View style={styles.driverCopy}>
              <Text style={[styles.driverName, { color: colors.text }]}>{driverName}</Text>
              <Text style={[styles.driverRating, { color: colors.textSecondary }]}>{t('tracking.driverLabel', 'Livreur Zando')}</Text>
            </View>
            <Pressable
              onPress={() => driverPhone && Linking.openURL(`tel:${driverPhone}`)}
              style={[styles.contactBtn, { borderColor: colors.border }]}
            >
              <Phone color={colors.primary} size={22} />
            </Pressable>
            <Pressable
              onPress={() => driverPhone && Linking.openURL(`sms:${driverPhone}`)}
              style={[styles.contactBtn, { borderColor: colors.border }]}
            >
              <MessageCircle color={colors.primary} size={22} />
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeInUp.duration(400).delay(200).springify()}
            style={[styles.driverCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.driverRating, { color: colors.textSecondary }]}>{t('tracking.driverNotAssigned', 'Livreur pas encore assigné')}</Text>
          </Animated.View>
        )}

        {/* Status */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(300).springify()}
          style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.statusTitle, { color: colors.text }]}>
            {suivi?.statut_label || t('tracking.defaultStatus', 'Votre commande est en cours de livraison')}
          </Text>

          {/* Progress */}
          <View style={styles.progress}>
            <View style={[styles.progressTrack, { backgroundColor: colors.backgroundAlt }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.success, width: `${progressPercent}%` }]} />
            </View>
            <View style={styles.stepsRow}>
              {stepsToRender.map((step, i) => {
                const Icon = step.icon;
                return (
                  <View key={`${step.label}-${i}`} style={styles.stepWrap}>
                    <View style={[styles.node, step.done ? { backgroundColor: colors.success } : { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
                      <Icon color={step.done ? '#FFF' : colors.textTertiary} size={14} />
                    </View>
                    <Text style={[styles.stepLabel, { color: step.done ? colors.primary : colors.textTertiary }]}>{step.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    padding: 20, paddingTop: 15,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '800', flex: 1 },
  refreshBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 30 },

  map: {
    height: 300,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 18,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  mapWrap: {
    marginHorizontal: 18,
    marginTop: 16,
  },
  mapHint: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  mapHintText: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  mapLabel: {
    fontSize: 15,
    fontWeight: '700',
  },

  driverCard: {
    margin: 18, marginTop: 14,
    padding: 18, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1,
    shadowColor: '#1A2744', shadowOpacity: 0.06, shadowRadius: 14, elevation: 3,
  },
  driverAvatar: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  driverCopy: { flex: 1 },
  driverName: { fontSize: 19, fontWeight: '800' },
  driverRating: { fontSize: 15, marginTop: 4 },
  contactBtn: {
    width: 46, height: 46, borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 4,
  },

  statusCard: {
    marginHorizontal: 18,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#1A2744', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  statusTitle: { fontSize: 21, fontWeight: '800' },
  arrival: { fontSize: 16, marginTop: 12 },
  arrivalStrong: { fontWeight: '800' },

  progress: { marginTop: 28 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    width: '70%',
    height: '100%',
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepWrap: {
    alignItems: 'center',
    width: '16.66%',
  },
  node: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center', marginTop: 6,
  },
});
