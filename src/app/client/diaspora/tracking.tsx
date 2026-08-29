import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, ZoomIn,
  useAnimatedStyle, useSharedValue, withTiming, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import {
  ArrowLeft, MessageCircle, Bike, Home, CheckCircle, CheckCircle2, Package, ShoppingBag, User,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
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
  // Route ouverte soit depuis "Mes envois" (numero/commandeId d'une commande précise, y compris
  // plus ancienne que la dernière), soit juste après un paiement (aucun paramètre : on retombe sur
  // lastOrder). Avant ce correctif, l'écran ne lisait QUE lastOrder — un client avec 2 commandes en
  // cours perdait le suivi en direct de la première dès qu'il en passait une seconde.
  const params = useLocalSearchParams<{ numero?: string; commandeId?: string }>();
  const { lastOrder, selectedBeneficiary, getShipment } = useDiaspora();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [suivi, setSuivi] = useState<ApiDiasporaSuivi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const numeroCommande = params.numero || lastOrder?.numeroCommande;
  const commandeId = params.commandeId || lastOrder?.id;

  const loadSuivi = useCallback(async () => {
    if (!numeroCommande) { setLoading(false); return; }
    try {
      const data = await fetchDiasporaSuivi(numeroCommande);
      setSuivi(data);
      setError(null);
    } catch {
      setError(t('diaspora.tracking.error', 'Suivi indisponible pour le moment. Réessayez dans un instant.'));
    } finally {
      setLoading(false);
    }
  }, [numeroCommande, t]);

  useEffect(() => {
    loadSuivi();
    const interval = setInterval(loadSuivi, 15000); // Polling 15s pour mise à jour live, comme le suivi client local
    return () => clearInterval(interval);
  }, [loadSuivi]);

  // Le livreur n'est connu (nom) qu'une fois assigné : on le lit dans l'historique local s'il y est déjà,
  // jamais inventé. Aucune ETA ni numéro de livreur ne sont exposés par l'API à ce stade du suivi.
  const shipment = numeroCommande ? getShipment(numeroCommande) : undefined;
  const enRouteFait = suivi?.etapes.find((e) => e.code === 'en_route')?.fait ?? false;
  const livreeFait = suivi?.etapes.find((e) => e.code === 'livree')?.fait ?? false;

  if (!numeroCommande) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()}><ArrowLeft color={colors.primary} size={27} /></Pressable>
          <Text style={[styles.title, { color: colors.text }]}>{t('diaspora.tracking.title', 'Suivi de commande')}</Text>
        </Animated.View>
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('diaspora.tracking.emptyText', 'Aucune commande récente à suivre.')}</Text>
          <Pressable onPress={() => router.push('/client/diaspora/shipments' as any)} style={[styles.emptyButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.emptyButtonText, { color: colors.textInverse }]}>{t('diaspora.tracking.emptyButton', 'Voir mes envois précédents')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}><ArrowLeft color={colors.primary} size={27} /></Pressable>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t('diaspora.tracking.title', 'Suivi de commande')}</Text>
          <Text style={[styles.orderId, { color: colors.textSecondary }]}>#{numeroCommande}</Text>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {error && (
            <Animated.View entering={FadeInUp.duration(300)} style={[styles.errorBanner, { backgroundColor: colors.error + '15', borderColor: colors.error + '55' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </Animated.View>
          )}

          {/* Steps */}
          {suivi && (
            <Animated.View entering={FadeInUp.duration(400).delay(100).springify()} style={[styles.stepsCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
              <View style={styles.stepsRow}>
                {suivi.etapes.map((step, i) => {
                  const Icon = STEP_ICONS[step.code] || CheckCircle;
                  const isCurrent = !step.fait && (i === 0 || suivi.etapes[i - 1].fait);
                  return (
                    <View key={step.code} style={styles.stepGroup}>
                      <View style={[
                        styles.stepNode,
                        { backgroundColor: colors.border },
                        step.fait && { backgroundColor: colors.success },
                        isCurrent && { backgroundColor: colors.primary },
                      ]}>
                        <Icon color={step.fait || isCurrent ? colors.textInverse : colors.textTertiary} size={16} />
                      </View>
                      <Text style={[
                        styles.stepLabel,
                        { color: colors.textTertiary },
                        isCurrent && { color: colors.primary, fontWeight: '900' },
                        step.fait && !isCurrent && { color: colors.success, fontWeight: '800' },
                      ]}>
                        {step.label}
                      </Text>
                      {i < suivi.etapes.length - 1 && (
                        <View style={[styles.stepConnector, { backgroundColor: colors.border }, step.fait && { backgroundColor: colors.success }]} />
                      )}
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Map */}
          <Animated.View entering={ZoomIn.duration(500).delay(150).springify()} style={[styles.map, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
            <View style={styles.markerStart}>
              {enRouteFait && <PulseDot color="#2771EC" />}
              <View style={[styles.markerInner, { backgroundColor: '#2771EC', borderColor: colors.surface, shadowColor: colors.shadow }]}>
                <Bike color={colors.textInverse} size={20} />
              </View>
            </View>
            <View style={styles.markerEnd}>
              <PulseDot color="#E30613" />
              <View style={[styles.markerInner, { backgroundColor: colors.primary, borderColor: colors.surface, shadowColor: colors.shadow }]}>
                <Home color={colors.textInverse} size={20} />
              </View>
            </View>
            <Text style={[styles.mapLabel, { color: colors.textSecondary }]}>{selectedBeneficiary?.ville || suivi?.beneficiaire?.nom || t('diaspora.tracking.defaultCity', 'Brazzaville')}</Text>
            <Text style={[styles.mapArea, { color: colors.textTertiary }]}>{t('diaspora.tracking.defaultCity', 'Brazzaville')}</Text>
          </Animated.View>

          {/* Driver Card — uniquement si un livreur est réellement assigné */}
          {shipment?.livreur ? (
            <Animated.View entering={FadeInUp.duration(400).delay(220).springify()} style={[styles.driverCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
              <View style={[styles.driverAvatar, { backgroundColor: colors.primarySoft }]}><User color={colors.primary} size={26} /></View>
              <View style={styles.driverCopy}>
                <Text style={[styles.driverName, { color: colors.text }]}>{shipment.livreur}</Text>
                <Text style={[styles.driverRating, { color: colors.textSecondary }]}>{t('diaspora.tracking.driverLabel', 'Livreur')}</Text>
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.duration(400).delay(220).springify()} style={[styles.pendingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Package color={colors.textTertiary} size={20} />
              <Text style={[styles.pendingText, { color: colors.textTertiary }]}>{t('diaspora.tracking.pendingDriver', 'Livreur pas encore assigné')}</Text>
            </Animated.View>
          )}

          {/* Contact actions */}
          <Animated.View entering={FadeInUp.duration(400).delay(300).springify()} style={styles.actionsRow}>
            <Pressable
              onPress={() => selectedBeneficiary && Linking.openURL(`tel:${selectedBeneficiary.telephone.replace(/\s/g, '')}`)}
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.primarySoft }]}
            >
              <MessageCircle color={colors.primary} size={18} />
              <Text style={[styles.actionText, { color: colors.primary }]}>{t('diaspora.tracking.contactBeneficiary', 'Contacter le bénéficiaire')}</Text>
            </Pressable>
          </Animated.View>

          {/* Noter la commande — uniquement une fois livrée, comme le suivi client local */}
          {livreeFait && commandeId && (
            <Animated.View entering={FadeInUp.duration(400).delay(380).springify()}>
              <Pressable
                onPress={() => router.push(
                  (shipment?.livreur
                    ? `/client/rating?commandeId=${commandeId}&driverName=${encodeURIComponent(shipment.livreur)}`
                    : `/client/rating?commandeId=${commandeId}`) as any
                )}
                style={styles.rateLink}
              >
                <CheckCircle2 color={colors.primary} size={16} />
                <Text style={[styles.rateLinkText, { color: colors.primary }]}>{t('diaspora.tracking.rateLinkReady', 'Noter cette commande')}</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      )}
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
  title: { fontSize: 19, fontWeight: '900' },
  orderId: { fontSize: 12.5, marginTop: 2 },
  scrollContent: { padding: 18, gap: 16, paddingBottom: 30 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 16 },
  emptyText: { fontSize: 14.5, fontWeight: '600', textAlign: 'center' },
  emptyButton: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyButtonText: { fontSize: 14.5, fontWeight: '800' },

  errorBanner: { borderRadius: 14, padding: 14, borderWidth: 1 },
  errorText: { fontSize: 13, fontWeight: '700' },

  stepsCard: {
    borderRadius: 20, padding: 18,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  stepsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepGroup: { flex: 1, alignItems: 'center', position: 'relative' },
  stepNode: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  stepLabel: { fontSize: 9.5, marginTop: 6, textAlign: 'center', fontWeight: '600' },
  stepConnector: {
    position: 'absolute', top: 15, left: '50%', width: '100%', height: 3,
    zIndex: 1,
  },

  map: {
    height: 240, overflow: 'hidden', position: 'relative',
    borderRadius: 20, borderWidth: 1,
  },
  markerStart: { position: 'absolute', left: 40, top: '60%', alignItems: 'center', justifyContent: 'center' },
  markerEnd: { position: 'absolute', right: 40, top: '28%', alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 60, height: 60, borderRadius: 30, borderWidth: 3 },
  markerInner: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  mapLabel: { position: 'absolute', left: 100, top: '48%', fontSize: 15, fontWeight: '700' },
  mapArea: { position: 'absolute', left: 20, top: '38%', fontSize: 13 },

  driverCard: {
    padding: 16, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1,
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  driverAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  driverCopy: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '800' },
  driverRating: { fontSize: 13, marginTop: 2 },

  pendingCard: {
    padding: 16, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1,
  },
  pendingText: { fontSize: 13.5, fontWeight: '700' },

  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, height: 54, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5,
  },
  actionText: { fontSize: 12.5, fontWeight: '800', textAlign: 'center' },

  rateLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 6 },
  rateLinkText: { fontSize: 13, fontWeight: '700' },
});
