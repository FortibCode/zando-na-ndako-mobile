import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, type ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '@/contexts/theme-context';

interface LottieAnimationProps {
  style?: ViewStyle;
  size?: number;
  autoPlay?: boolean;
  loop?: boolean;
}

// Loading State Component
export function LoadingState({
  message = 'Chargement...',
  size = 120,
  style,
}: {
  message?: string;
  size?: number;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, style]}
    >
      <View style={[styles.animationWrapper, { width: size, height: size }]}>
        <LottieView
          source={require('../../assets/animations/loading.json')}
          autoPlay
          loop
          style={{ width: size, height: size }}
        />
      </View>
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{message}</Text>
    </Animated.View>
  );
}

// Success State Component
export function SuccessState({
  message = 'Opération réussie !',
  size = 140,
  style,
}: {
  message?: string;
  size?: number;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(400).springify()}
      exiting={FadeOut.duration(200)}
      style={[styles.container, style]}
    >
      <View style={[styles.animationWrapper, { width: size, height: size }]}>
        <LottieView
          source={require('../../assets/animations/success.json')}
          autoPlay
          loop={false}
          style={{ width: size, height: size }}
        />
      </View>
      <Text style={[styles.successText, { color: colors.success }]}>{message}</Text>
    </Animated.View>
  );
}

// Error State Component
export function ErrorState({
  message = 'Une erreur est survenue',
  size = 120,
  style,
  onRetry,
}: {
  message?: string;
  size?: number;
  style?: ViewStyle;
  onRetry?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, style]}
    >
      <View style={[styles.animationWrapper, { width: size, height: size }]}>
        <LottieView
          source={require('../../assets/animations/error.json')}
          autoPlay
          loop={false}
          style={{ width: size, height: size }}
        />
      </View>
      <Text style={[styles.errorText, { color: colors.error }]}>{message}</Text>
      {onRetry && (
        <Text style={[styles.retryButton, { color: colors.primary }]} onPress={onRetry}>
          Réessayer
        </Text>
      )}
    </Animated.View>
  );
}

// Empty State Component
export function EmptyState({
  title = 'Aucun contenu',
  message = 'Il n\'y a rien à afficher pour le moment.',
  size = 100,
  style,
}: {
  title?: string;
  message?: string;
  size?: number;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(400).springify()}
      exiting={FadeOut.duration(200)}
      style={[styles.container, style]}
    >
      <View style={[styles.animationWrapper, { width: size, height: size }]}>
        <LottieView
          source={require('../../assets/animations/empty.json')}
          autoPlay
          loop
          style={{ width: size, height: size }}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>{message}</Text>
    </Animated.View>
  );
}

// Success animation reused for confirmation moments until a dedicated confetti asset is added.
export function ConfettiAnimation({
  size = 200,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.animationWrapper, { width: size, height: size }, style]}>
      <LottieView
        source={require('../../assets/animations/success.json')}
        autoPlay
        loop={false}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

// Progress animation uses the loading asset so it remains safe in offline builds.
export function ProgressAnimation({
  size = 100,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.animationWrapper, { width: size, height: size }, style]}>
      <LottieView
        source={require('../../assets/animations/loading.json')}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
    </View>
  );
}

// Shopping cart empty state animation.
export function CartAnimation({
  size = 120,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.animationWrapper, { width: size, height: size }, style]}>
      <LottieView
        source={require('../../assets/animations/empty.json')}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  animationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  successText: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
