import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Contenu visuel partagé — composant fonctionnel pour pouvoir utiliser useTheme(),
// consommé à la fois par la classe DeliveryErrorBoundary et par DeliveryErrorState.
function ErrorFallbackContent({
  variant = 'inline',
  title,
  message,
  iconSize,
  onRetry,
}: {
  variant?: 'boundary' | 'inline';
  title?: string;
  message?: string;
  iconSize: number;
  onRetry?: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const resolvedTitle = title ?? (variant === 'boundary'
    ? t('deliveryErrorState.boundaryTitle', 'Oups ! Une erreur est survenue')
    : t('deliveryErrorState.title', 'Erreur'));
  const resolvedMessage = message || (variant === 'boundary'
    ? t('deliveryErrorState.boundaryDefaultMessage', "L'application a rencontré un problème inattendu.")
    : t('deliveryErrorState.defaultMessage', 'Une erreur est survenue'));
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.animationWrapper}>
        <LottieView
          source={require('../../../assets/animations/error.json')}
          autoPlay
          loop={false}
          style={{ width: iconSize, height: iconSize }}
        />
      </View>
      <Text style={[styles.title, { color: colors.error }]}>{resolvedTitle}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{resolvedMessage}</Text>
      {onRetry && (
        <Pressable style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={onRetry}>
          <Text style={styles.retryText}>{t('deliveryErrorState.retry', 'Réessayer')}</Text>
        </Pressable>
      )}
    </View>
  );
}

export class DeliveryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DeliveryErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallbackContent
          variant="boundary"
          message={this.state.error?.message}
          iconSize={100}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// ─── Inline Error State (for API errors without full boundary) ───
export function DeliveryErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return <ErrorFallbackContent variant="inline" message={message} iconSize={80} onRetry={onRetry} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  animationWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
