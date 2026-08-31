import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GoogleLogo } from '@/components/auth-ui';
import { BrandColors } from '@/constants/brand';
import { AUTH_ICONS } from '@/constants/icons';
import { Palette, Radii, Shadows, Spacing } from '@/design/tokens';

const logo = require('@/assets/images/zando-logo.jpeg');

function MethodButton({
  icon,
  label,
  detail,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.methodButton}>
      <View style={styles.methodIcon}>
        <Ionicons color={BrandColors.blue} name={icon} size={24} />
      </View>
      <View style={styles.methodCopy}>
        <Text style={styles.methodLabel}>{label}</Text>
        <Text style={styles.methodDetail}>{detail}</Text>
      </View>
      <Ionicons color={BrandColors.textMuted} name={AUTH_ICONS.chevronRight} size={20} />
    </Pressable>
  );
}

/** Page native des options de connexion, séparée du parcours onboarding. */
export default function AuthOptionsScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={ZoomIn.duration(500).springify()} style={styles.logoWrap}>
          <Image contentFit="contain" source={logo} style={styles.logo} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.duration(400).delay(150).springify()} style={styles.welcome}>Bienvenue</Animated.Text>
        <Animated.Text entering={FadeInDown.duration(400).delay(200).springify()} style={styles.welcomeAccent}>Zando na Ndako</Animated.Text>
        <Animated.Text entering={FadeInDown.duration(400).delay(250).springify()} style={styles.subtitle}>
          Votre marché, livré chez vous en toute simplicité.
        </Animated.Text>

        <View style={styles.tabs}>
          <Pressable style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Connexion</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/auth/signup')} style={styles.tab}>
            <Text style={styles.tabText}>Inscription</Text>
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>SE CONNECTER AVEC</Text>
          <View style={styles.divider} />
        </View>

        <MethodButton
          detail="Nous vous enverrons un code OTP"
          icon={AUTH_ICONS.phoneMobile}
          label="Par numéro de téléphone"
          onPress={() => router.push('/auth/phone')}
        />
        <MethodButton
          detail="Connectez-vous avec votre email"
          icon={AUTH_ICONS.email}
          label="Par email"
          onPress={() => router.push('/auth/email')}
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.divider} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/auth/google-picker')}
          style={styles.google}
        >
          <GoogleLogo size={32} />
          <Text style={styles.googleText}>Se connecter avec Google</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/auth/forgot-password' as any)} style={styles.forgot}>
          <Ionicons color={BrandColors.blue} name={AUTH_ICONS.key} size={18} />
          <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
        </Pressable>

<Pressable onPress={() => router.push('/auth/signup')}>
          <Text style={styles.account}>
            Vous n’avez pas de compte ?{' '}
            <Text style={styles.accountLink}>Inscrivez-vous</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  content: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: 28,
    paddingBottom: 44,
    alignItems: 'center',
  },
  logoWrap: {
    width: 140,
    height: 140,
    borderRadius: 32,
    backgroundColor: Palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Palette.navy,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: 'hidden',
  },
  logo: {
    width: 130,
    height: 130,
  },
  welcome: {
    color: Palette.navy,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  welcomeAccent: {
    color: Palette.navy,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: Palette.ink,
    fontSize: 15,
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  tabs: {
    width: '100%',
    height: 60,
    padding: 4,
    borderRadius: Radii.full,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    flexDirection: 'row',
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.full,
  },
  activeTab: {
    backgroundColor: Palette.navy,
  },
  tabText: {
    color: Palette.navyMuted,
    fontSize: 17,
    fontWeight: '700',
  },
  activeTabText: {
    color: Palette.white,
  },
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.border,
  },
  dividerText: {
    color: Palette.ink,
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  methodButton: {
    width: '100%',
    minHeight: 88,
    borderColor: Palette.border,
    borderWidth: 1.3,
    borderRadius: Radii.lg,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: Palette.surface,
    ...Shadows.card,
  },
  methodIcon: {
    width: 52,
    height: 52,
    borderRadius: Radii.sm,
    backgroundColor: Palette.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodCopy: {
    flex: 1,
    marginLeft: 14,
  },
  methodLabel: {
    color: Palette.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  methodDetail: {
    color: Palette.muted,
    fontSize: 14,
    marginTop: 4,
  },
  google: {
    width: '100%',
    height: 60,
    borderRadius: Radii.lg,
    borderWidth: 1.3,
    borderColor: Palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: Palette.surface,
  },
  googleText: {
    color: Palette.navy,
    fontSize: 17,
    fontWeight: '800',
  },
  forgot: {
    marginTop: 28,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  forgotText: {
    color: Palette.navy,
    fontSize: 15.5,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  account: {
    color: Palette.ink,
    marginTop: 24,
    fontSize: 15,
    textAlign: 'center',
  },
  accountLink: {
    color: Palette.navy,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
