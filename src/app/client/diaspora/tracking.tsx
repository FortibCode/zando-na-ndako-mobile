import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, ZoomIn,
  useAnimatedStyle, useSharedValue, withTiming, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import {
  ArrowLeft, MessageCircle, Bike, Home, CheckCircle, CheckCircle2, Package, ShoppingBag,
} from 'lucide-react-native';
import { BLUE, RED } from '@/components/client-ui';
import { useDiaspora } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';
import { fetchDiasporaSuivi, type ApiDiasporaSuivi } from '@/services/api';

const STEP_ICONS: Record<string, any> = {
  confirmee: CheckCircle,
  achat_marche: ShoppingBag,
  en_route: Bike,
  livree: Home,
};

function PulseDot({ color = '#2771EC' }: { color?: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 1200, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
        withTiming(1, { duration: 1200 }),
      ), -1, true,
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 1200 }), withTiming(0.7, { duration: 1200 })), -1, true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return <Animated.View style={[styles.pulse, { backgroundColor: color, borderColor: color }, animStyle]} />;
}

export default function DiasporaTrackingScreen() {
  const { lastOrder, selectedBeneficiary, getShipment } = useDiaspora();
  const { t } = useLanguage();
  const [suivi, setSuivi] = useState<ApiDiasporaSuivi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lastOrder?.id) { setLoading(false); return; }
    (async () => {
      try {
        const data = await fetchDiasporaSuivi(lastOrder.id);
        setSuivi(data);
      } catch {
        setError(t('diaspora.tracking.error', 'Suivi indisponible pour le moment. Réessayez dans un instant.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [lastOrder?.id]);

  // Le livreur n'est connu (nom) qu'une fois assigné : on le lit dans l'historique local s'il y est déjà,
  // jamais inventé. Aucune ETA ni numéro de livreur ne sont exposés par l'API à ce stade du suivi.
  const shipment = lastOrder?.id ? getShipment(lastOrder.id) : undefined;
  const enRouteFait = suivi?.etapes.find((e) => e.code === 'en_route')?.fait ?? false;

  if (!lastOrder) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.header}>
          <Pressable onPress={() => router.back()}><ArrowLeft color={BLUE} size={27} /></Pressable>
          <Text style={styles.title}>{t('diaspora.tracking.title', 'Suivi de commande')}</Text>
        </Animated.View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{t('diaspora.tracking.emptyText', 'Aucune commande récente à suivre.')}</Text>
          <Pressable onPress={() => router.push('/client/diaspora/shipments' as any)} style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>{t('diaspora.tracking.emptyButton', 'Voir mes envois précédents')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.header}>
        <Pressable onPress={() => router.back()}><ArrowLeft color={BLUE} size={27} /></Pressable>
        <View>
          <Text style={styles.title}>{t('diaspora.tracking.title', 'Suivi de commande')}</Text>
          <Text style={styles.orderId}>#{lastOrder.id}</Text>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color={BLUE} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {error && (
            <Animated.View entering={FadeInUp.duration(300)} style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}

          {/* Steps */}
          {suivi && (
            <Animated.View entering={FadeInUp.duration(400).delay(100).springify()} style={styles.stepsCard}>
              <View style={styles.stepsRow}>
                {suivi.etapes.map((step, i) => {
                  const Icon = STEP_ICONS[step.code] || CheckCircle;
                  const isCurrent = !step.fait && (i === 0 || suivi.etapes[i - 1].fait);
                  return (
                    <View key={step.code} style={styles.stepGroup}>
                      <View style={[
                        styles.stepNode,
                        step.fait && styles.stepNodeDone,
                        isCurrent && styles.stepNodeCurrent,
                      ]}>
                        <Icon color={step.fait || isCurrent ? '#FFF' : '#C8D0DE'} size={16} />
                      </View>
                      <Text style={[
                        styles.stepLabel,
                        isCurrent && styles.stepLabelCurrent,
                        step.fait && !isCurrent && styles.stepLabelDone,
                      ]}>
                        {step.label}
                      </Text>
                      {i < suivi.etapes.length - 1 && (
                        <View style={[styles.stepConnector, step.fait && styles.stepConnectorDone]} />
                      )}
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Map */}
          <Animated.View entering={ZoomIn.duration(500).delay(150).springify()} style={styles.map}>
            <View style={styles.markerStart}>
              {enRouteFait && <PulseDot color="#2771EC" />}
              <View style={[styles.markerInner, { backgroundColor: '#2771EC' }]}>
                <Bike color="#FFF" size={20} />
              </View>
            </View>
            <View style={styles.markerEnd}>
              <PulseDot color="#E30613" />
              <View style={[styles.markerInner, { backgroundColor: RED }]}>
                <Home color="#FFF" size={20} />
              </View>
            </View>
            <Text style={styles.mapLabel}>{selectedBeneficiary?.ville || suivi?.beneficiaire?.nom || t('diaspora.tracking.defaultCity', 'Brazzaville')}</Text>
            <Text style={styles.mapArea}>{t('diaspora.tracking.defaultCity', 'Brazzaville')}</Text>
          </Animated.View>

          {/* Driver Card — uniquement si un livreur est réellement assigné */}
          {shipment?.livreur ? (
            <Animated.View entering={FadeInUp.duration(400).delay(220).springify()} style={styles.driverCard}>
              <View style={styles.driverAvatar}><Text style={styles.driverEmoji}>👨🏾</Text></View>
              <View style={styles.driverCopy}>
                <Text style={styles.driverName}>{shipment.livreur}</Text>
                <Text style={styles.driverRating}>{t('diaspora.tracking.driverLabel', 'Livreur')}</Text>
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.duration(400).delay(220).springify()} style={styles.pendingCard}>
              <Package color="#94A3B8" size={20} />
              <Text style={styles.pendingText}>{t('diaspora.tracking.pendingDriver', 'Livreur pas encore assigné')}</Text>
            </Animated.View>
          )}

          {/* Contact actions */}
          <Animated.View entering={FadeInUp.duration(400).delay(300).springify()} style={styles.actionsRow}>
            <Pressable
              onPress={() => selectedBeneficiary && Linking.openURL(`tel:${selectedBeneficiary.telephone.replace(/\s/g, '')}`)}
              style={styles.actionBtn}
            >
              <MessageCircle color={BLUE} size={18} />
              <Text style={styles.actionText}>{t('diaspora.tracking.contactBeneficiary', 'Contacter le bénéficiaire')}</Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(400).delay(380).springify()}>
            <Pressable
              onPress={() => router.push(
                (shipment?.livreur
                  ? `/client/rating?commandeId=${lastOrder.id}&driverName=${encodeURIComponent(shipment.livreur)}`
                  : `/client/rating?commandeId=${lastOrder.id}`) as any
              )}
              style={styles.rateLink}
            >
              <CheckCircle2 color={BLUE} size={16} />
              <Text style={styles.rateLinkText}>{t('diaspora.tracking.rateLink', 'Noter cette commande une fois livrée')}</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFE' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    padding: 20, paddingTop: 15, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E8ECF2',
  },
  title: { color: BLUE, fontSize: 19, fontWeight: '900' },
  orderId: { color: '#64748B', fontSize: 12.5, marginTop: 2 },
  scrollContent: { padding: 18, gap: 16, paddingBottom: 30 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 16 },
  emptyText: { color: '#64748B', fontSize: 14.5, fontWeight: '600', textAlign: 'center' },
  emptyButton: { height: 52, borderRadius: 16, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyButtonText: { color: '#FFF', fontSize: 14.5, fontWeight: '800' },

  errorBanner: { backgroundColor: '#FEF2F2', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FCA5A5' },
  errorText: { color: '#B91C1C', fontSize: 13, fontWeight: '700' },

  stepsCard: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: '#F0F3F8',
    shadowColor: '#1A2744', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  stepsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepGroup: { flex: 1, alignItems: 'center', position: 'relative' },
  stepNode: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  stepNodeDone: { backgroundColor: '#24B365' },
  stepNodeCurrent: { backgroundColor: RED },
  stepLabel: { color: '#94A3B8', fontSize: 9.5, marginTop: 6, textAlign: 'center', fontWeight: '600' },
  stepLabelDone: { color: '#24B365', fontWeight: '800' },
  stepLabelCurrent: { color: RED, fontWeight: '900' },
  stepConnector: {
    position: 'absolute', top: 15, left: '50%', width: '100%', height: 3,
    backgroundColor: '#E2E8F0', zIndex: 1,
  },
  stepConnectorDone: { backgroundColor: '#24B365' },

  map: {
    height: 240, backgroundColor: '#F0F4F6', overflow: 'hidden', position: 'relative',
    borderRadius: 20, borderWidth: 1, borderColor: '#E2E7EF',
  },
  markerStart: { position: 'absolute', left: 40, top: '60%', alignItems: 'center', justifyContent: 'center' },
  markerEnd: { position: 'absolute', right: 40, top: '28%', alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 3 },
  markerInner: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  mapLabel: { position: 'absolute', left: 100, top: '48%', color: '#5D6A78', fontSize: 15, fontWeight: '700' },
  mapArea: { position: 'absolute', left: 20, top: '38%', color: '#687895', fontSize: 13 },

  driverCard: {
    padding: 16, borderRadius: 18, backgroundColor: '#FFF',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#F0F3F8',
    shadowColor: '#1A2744', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  driverAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#E7EDF7', alignItems: 'center', justifyContent: 'center' },
  driverEmoji: { fontSize: 30 },
  driverCopy: { flex: 1 },
  driverName: { color: BLUE, fontSize: 16, fontWeight: '800' },
  driverRating: { color: '#71809C', fontSize: 13, marginTop: 2 },

  pendingCard: {
    padding: 16, borderRadius: 18, backgroundColor: '#FFF',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#F0F3F8',
  },
  pendingText: { color: '#94A3B8', fontSize: 13.5, fontWeight: '700' },

  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, height: 54, borderRadius: 16, backgroundColor: '#FFF',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#D0E1FF',
  },
  actionText: { color: BLUE, fontSize: 12.5, fontWeight: '800', textAlign: 'center' },

  rateLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 6 },
  rateLinkText: { color: BLUE, fontSize: 13, fontWeight: '700' },
});
