import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn, BounceIn } from 'react-native-reanimated';
import { Smartphone, MessageSquare, Check } from 'lucide-react-native';
import { BLUE, RED, GREEN } from '@/components/client-ui';
import { useLanguage } from '@/contexts/language-context';

export default function NotificationSentScreen() {
  const { t } = useLanguage();

  const CHECKS = [
    t('diaspora.notificationSent.check1', 'Numéro de commande'),
    t('diaspora.notificationSent.check2', 'Détails de la livraison'),
    t('diaspora.notificationSent.check3', 'Lien pour suivre la commande'),
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Animated.View entering={ZoomIn.duration(600).springify()} style={styles.illusWrap}>
          <View style={styles.phoneCircle}>
            <Smartphone color={BLUE} size={56} strokeWidth={1.5} />
          </View>
          <Animated.View entering={BounceIn.duration(500).delay(300).springify()} style={styles.envelope}>
            <MessageSquare color="#FFF" size={26} fill={GREEN} />
          </Animated.View>
        </Animated.View>

        <Animated.Text entering={FadeInDown.duration(400).delay(200).springify()} style={styles.title}>
          {t('diaspora.notificationSent.title', 'Notification envoyée !')}
        </Animated.Text>

        <Animated.Text entering={FadeInDown.duration(400).delay(280).springify()} style={styles.subtitle}>
          {t('diaspora.notificationSent.subtitle', 'Votre bénéficiaire a reçu un SMS\nde notification.')}
        </Animated.Text>

        <Animated.View entering={FadeInUp.duration(400).delay(380).springify()} style={styles.checkList}>
          {CHECKS.map((text, i) => (
            <Animated.View key={text} entering={FadeInUp.duration(350).delay(420 + i * 100).springify()} style={styles.checkRow}>
              <View style={styles.checkIcon}>
                <Check color="#FFF" size={14} strokeWidth={3} />
              </View>
              <Text style={styles.checkText}>{text}</Text>
            </Animated.View>
          ))}
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.duration(400).delay(600).springify()} style={styles.footer}>
        <Pressable onPress={() => router.replace('/client/diaspora/tracking' as any)} style={styles.button}>
          <Text style={styles.buttonText}>{t('diaspora.notificationSent.button', 'Parfait')}</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFE' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 10 },

  illusWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  phoneCircle: {
    width: 140, height: 140, borderRadius: 40, backgroundColor: '#EEF4FF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: BLUE + '30',
  },
  envelope: {
    position: 'absolute', bottom: -4, right: -4,
    width: 52, height: 52, borderRadius: 18, backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#FFF',
    shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },

  title: { color: BLUE, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: '#64748B', fontSize: 15, textAlign: 'center', lineHeight: 22 },

  checkList: { width: '100%', gap: 14, marginTop: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: '#334155', fontSize: 15, fontWeight: '600' },

  footer: { padding: 20, paddingBottom: 26 },
  button: {
    height: 60, borderRadius: 18, backgroundColor: RED, alignItems: 'center', justifyContent: 'center',
    shadowColor: RED, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});
