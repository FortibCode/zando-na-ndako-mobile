import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderReadyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(350).springify()} style={[styles.badgeRow, { backgroundColor: colors.primarySoft }]}>
          <CheckCircle2 color={colors.primary} size={22} fill={colors.surface} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>{t('vendorReady.badge', 'Commande prête')}</Text>
        </Animated.View>

        <Animated.View entering={BounceIn.duration(600).springify()} style={styles.illusWrap}>
          <Text style={styles.emoji}>🛍️</Text>
          <View style={[styles.checkOverlay, { backgroundColor: colors.success }]}>
            <CheckCircle2 color={colors.white} size={26} />
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(400).delay(200).springify()} style={[styles.title, { color: colors.text }]}>
          {t('vendorReady.title', 'Commande prête !')}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.duration(400).delay(280).springify()} style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('vendorReady.subtitle', 'La commande est prête à être remise au livreur.')}
        </Animated.Text>
        <Animated.Text entering={FadeInUp.duration(400).delay(340).springify()} style={[styles.note, { color: colors.textTertiary }]}>
          {t('vendorReady.note', 'Le livreur sera notifié.')}
        </Animated.Text>
      </View>

      <Animated.View entering={FadeInUp.duration(400).delay(420).springify()} style={styles.footer}>
        <Pressable
          onPress={() => router.replace(`/vendor/orders/${id}/driver-arrived` as any)}
          style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        >
          <Text style={styles.buttonText}>{t('vendorReady.viewDriver', 'Voir le livreur')}</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },

  badgeRow: {
    position: 'absolute', top: 20, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  badgeText: { fontSize: 17, fontWeight: '900' },

  illusWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emoji: { fontSize: 110 },
  checkOverlay: { position: 'absolute', bottom: 6, right: 10, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: 8 },
  note: { fontSize: 14, textAlign: 'center', marginTop: 12 },

  footer: { padding: 20, paddingBottom: 26 },
  button: {
    height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
