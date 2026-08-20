import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, ZoomIn, FadeIn,
  useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { ArrowLeft, Globe2, ShieldCheck, Truck, Radar, MapPin, Info } from 'lucide-react-native';
import { BLUE, RED, GREEN } from '@/components/client-ui';
import { useDiaspora } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';

function OrbitDot({ delay = 0 }: { delay?: number }) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1400, easing: Easing.bezier(0.22, 1, 0.36, 1) }),
        withTiming(0.6, { duration: 1400 }),
      ),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1400 }),
        withTiming(0.3, { duration: 1400 }),
      ),
      -1,
      true,
    );
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return <Animated.View style={[styles.orbitDot, style]} />;
}

export default function DiasporaIntroScreen() {
  const { activateDiasporaMode } = useDiaspora();
  const { t } = useLanguage();

  const FEATURES = [
    { icon: ShieldCheck, text: t('diaspora.intro.feature1', 'Paiement sécurisé en € ou $') },
    { icon: Truck, text: t('diaspora.intro.feature2', 'Livraison rapide à Brazzaville') },
    { icon: Radar, text: t('diaspora.intro.feature3', 'Suivi en temps réel') },
  ];

  const globeRotate = useSharedValue(0);
  useEffect(() => {
    globeRotate.value = withRepeat(withTiming(1, { duration: 26000, easing: Easing.linear }), -1, false);
  }, []);
  const globeStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${globeRotate.value * 360}deg` }],
  }));

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />

      <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={BLUE} size={22} />
        </Pressable>
        <Pressable onPress={() => router.push('/client/diaspora/about' as any)} style={styles.infoBtn}>
          <Info color={BLUE} size={20} />
        </Pressable>
      </Animated.View>

      <View style={styles.content}>
        {/* Illustration */}
        <Animated.View entering={ZoomIn.duration(600).springify()} style={styles.illusWrap}>
          <View style={styles.orbitRing}>
            <OrbitDot />
          </View>
          <Animated.View style={[styles.globeCircle, globeStyle]}>
            <Globe2 color="#FFF" size={64} strokeWidth={1.4} />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(500).delay(300)} style={styles.routeDash} />

          <Animated.View entering={ZoomIn.duration(500).delay(350).springify()} style={styles.avatarCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>🧑🏾</Text>
            </View>
            <View style={styles.avatarPin}>
              <MapPin color="#FFF" size={13} />
            </View>
          </Animated.View>
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(450).delay(150).springify()} style={styles.title}>
          {t('diaspora.intro.title', 'Envoyez des courses\nà vos proches au Congo')}
        </Animated.Text>

        <Animated.View entering={FadeInUp.duration(450).delay(250).springify()} style={styles.featureList}>
          {FEATURES.map(({ icon: Icon, text }, i) => (
            <Animated.View
              key={text}
              entering={FadeInUp.duration(400).delay(320 + i * 90).springify()}
              style={styles.featureRow}
            >
              <View style={styles.featureCheck}>
                <Icon color={GREEN} size={16} />
              </View>
              <Text style={styles.featureText}>{text}</Text>
            </Animated.View>
          ))}
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.duration(400).delay(600).springify()} style={styles.footer}>
        <Pressable
          onPress={() => {
            activateDiasporaMode();
            router.push('/client/diaspora/beneficiaries' as any);
          }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{t('diaspora.intro.cta', 'Activer le Mode Diaspora')}</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.later}>
          <Text style={styles.laterText}>{t('diaspora.intro.later', 'Plus tard')}</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFE' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center',
  },
  infoBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center',
  },

  content: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', gap: 8 },

  illusWrap: {
    width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  orbitRing: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    borderWidth: 1.5, borderColor: '#D8E5FF', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'flex-start',
  },
  orbitDot: {
    position: 'absolute', top: -6, width: 14, height: 14, borderRadius: 7,
    backgroundColor: GREEN,
  },
  globeCircle: {
    width: 156, height: 156, borderRadius: 78,
    backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center',
    shadowColor: BLUE, shadowOpacity: 0.35, shadowRadius: 24, elevation: 10,
    borderWidth: 4, borderColor: '#EEF4FF',
  },
  routeDash: {
    position: 'absolute', width: 2, height: 60, top: 100, right: 24,
    backgroundColor: RED, opacity: 0.35, borderRadius: 2,
    transform: [{ rotate: '35deg' }],
  },
  avatarCard: {
    position: 'absolute', right: -6, top: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarCircle: {
    width: 58, height: 58, borderRadius: 20,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: BLUE,
    shadowColor: '#0D1B3E', shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  avatarEmoji: { fontSize: 30 },
  avatarPin: {
    position: 'absolute', bottom: -8, alignSelf: 'center',
    width: 24, height: 24, borderRadius: 12, backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },

  title: { color: BLUE, fontSize: 25, fontWeight: '900', textAlign: 'center', lineHeight: 32 },

  featureList: { width: '100%', gap: 14, marginTop: 22 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureCheck: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center',
  },
  featureText: { color: '#334155', fontSize: 15, fontWeight: '600', flex: 1 },

  footer: { padding: 20, paddingBottom: 26, gap: 12 },
  cta: {
    height: 60, borderRadius: 18, backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: RED, shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  ctaText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  later: { alignItems: 'center', paddingVertical: 4 },
  laterText: { color: '#64748B', fontSize: 15, fontWeight: '700' },
});
