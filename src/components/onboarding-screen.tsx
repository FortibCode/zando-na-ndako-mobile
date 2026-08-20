import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ImageSourcePropType,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BrandColors } from '@/constants/brand';
import { Palette, Radii, Spacing } from '@/design/tokens';

const STEP_ROUTES: Record<number, '/onboarding/first' | '/onboarding/second' | '/onboarding/third'> = {
  1: '/onboarding/first',
  2: '/onboarding/second',
  3: '/onboarding/third',
};

type OnboardingScreenProps = {
  artwork: ImageSourcePropType;
  title: string;
  accentTitle?: string;
  /** Couleur de la ligne accentuée ; par défaut rouge. Mettre BrandColors.blue pour un titre entièrement bleu. */
  accentColor?: string;
  description: string;
  activeStep: 1 | 2 | 3;
  nextRoute: '/onboarding/second' | '/onboarding/third' | '/auth';
  /** Variante « branded » : logo en haut, illustration au centre, texte en dessous (écran 3). */
  variant?: 'standard' | 'branded';
};

function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <Image
      contentFit="contain"
      source={require('@/assets/images/zando-logo.jpeg')}
      style={compact ? styles.brandCompact : styles.brand}
    />
  );
}

function TitleBlock({
  title,
  accentTitle,
  accentColor = BrandColors.red,
  description,
  centered = false,
}: {
  title: string;
  accentTitle?: string;
  accentColor?: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <View style={centered ? styles.titleBlockCentered : undefined}>
      <Text style={[styles.title, centered && styles.titleCentered]}>{title}</Text>
      {accentTitle ? (
        <Text style={[styles.title, { color: accentColor }, centered && styles.titleCentered]}>
          {accentTitle}
        </Text>
      ) : null}
      <Text style={[styles.description, centered && styles.descriptionCentered]}>{description}</Text>
    </View>
  );
}

function FooterBar({
  activeStep,
  nextRoute,
}: {
  activeStep: 1 | 2 | 3;
  nextRoute: '/onboarding/second' | '/onboarding/third' | '/auth';
}) {
  const isLast = activeStep === 3;

  return (
    <View style={styles.footer}>
      {/* Dot stepper */}
      <View style={styles.dots}>
        {[1, 2, 3].map((step) => (
          <Pressable
            key={step}
            accessibilityLabel={`Aller à l'étape ${step}`}
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              if (step !== activeStep) router.push(STEP_ROUTES[step]);
            }}
          >
            <View style={[styles.dot, activeStep === step && styles.activeDot]} />
          </Pressable>
        ))}
      </View>

      {/* Skip button — visible only if not last step */}
      {!isLast && (
        <Pressable
          hitSlop={8}
          onPress={() => router.push('/auth')}
          style={styles.skipBtn}
        >
          {/* <Text style={styles.skipText}>Passer</Text> */}
        </Pressable>
      )}

      {/* Next / Start button */}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push(nextRoute)}
        style={({ pressed }) => [styles.nextButton, pressed && { opacity: 0.88 }]}
      >
        <Text style={styles.nextText}>{isLast ? 'Commencer' : 'Suivant'}</Text>
        <Ionicons color="#FFFFFF" name={isLast ? 'rocket-outline' : 'arrow-forward'} size={18} style={{ marginLeft: 6 }} />
      </Pressable>
    </View>
  );
}

/** Écran onboarding natif aligné sur les maquettes Zando na Ndako. */
export function OnboardingScreen({
  artwork,
  title,
  accentTitle,
  accentColor = BrandColors.red,
  description,
  activeStep,
  nextRoute,
  variant = 'standard',
}: OnboardingScreenProps) {
  const isBranded = variant === 'branded';

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {isBranded ? (
          <>
            <BrandHeader compact />
            <View style={styles.brandedArtworkArea}>
              <Image contentFit="contain" source={artwork} style={styles.brandedArtwork} />
            </View>
            <TitleBlock
              accentColor={accentColor}
              accentTitle={accentTitle}
              centered
              description={description}
              title={title}
            />
          </>
        ) : (
          <>
            <TitleBlock
              accentColor={accentColor}
              accentTitle={accentTitle}
              description={description}
              title={title}
            />
            <View style={styles.artworkArea}>
              <Image contentFit="contain" source={artwork} style={styles.artwork} />
            </View>
          </>
        )}
      </View>
      <FooterBar activeStep={activeStep} nextRoute={nextRoute} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
  },
  brand: {
    width: 210,
    height: 150,
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  brandCompact: {
    width: 185,
    height: 130,
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: 4,
  },
  titleBlockCentered: {
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  title: {
    color: Palette.navy,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  titleCentered: {
    textAlign: 'center',
  },
  description: {
    marginTop: 18,
    color: Palette.muted,
    fontSize: 16.5,
    lineHeight: 27,
    fontWeight: '500',
  },
  descriptionCentered: {
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 6,
  },
  artworkArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginBottom: -8,
    minHeight: 280,
  },
  artwork: {
    width: '108%',
    height: '96%',
  },
  brandedArtworkArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    minHeight: 260,
  },
  brandedArtwork: {
    width: '100%',
    height: '100%',
  },
  footer: {
    minHeight: 110,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 18,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
    backgroundColor: Palette.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Palette.navy,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -3 },
    elevation: 6,
    gap: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.faint,
  },
  activeDot: {
    backgroundColor: BrandColors.red,
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  skipText: {
    color: Palette.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 140,
    height: 54,
    paddingHorizontal: 22,
    borderRadius: Radii.md,
    backgroundColor: BrandColors.red,
    justifyContent: 'center',
    shadowColor: BrandColors.red,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  nextText: {
    color: Palette.white,
    fontSize: 17,
    fontWeight: '800',
  },
});
