import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

function EmptyAnimation({ source, size = 100 }: { source: any; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <LottieView source={source} autoPlay loop style={{ width: size, height: size }} />
    </View>
  );
}

function EmptyStateBase({ source, size, title, message }: { source: any; size: number; title: string; message: string }) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(400).springify()} exiting={FadeOut.duration(200)} style={styles.container}>
      <EmptyAnimation source={source} size={size} />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
    </Animated.View>
  );
}

export function EmptyMissions() {
  const { t } = useLanguage();
  return (
    <EmptyStateBase
      source={require('../../../assets/animations/empty.json')}
      size={120}
      title={t('deliveryEmptyStates.noMissionsTitle', 'Aucune mission disponible')}
      message={t('deliveryEmptyStates.noMissionsMessage', 'Revenez plus tard,\nde nouvelles missions apparaissent régulièrement.')}
    />
  );
}

export function EmptyRevenue() {
  const { t } = useLanguage();
  return (
    <EmptyStateBase
      source={require('../../../assets/animations/empty.json')}
      size={100}
      title={t('deliveryEmptyStates.noRevenueTitle', 'Aucun revenu enregistré')}
      message={t('deliveryEmptyStates.noRevenueMessage', 'Vos gains apparaîtront ici après\nchaque livraison effectuée.')}
    />
  );
}

export function EmptyHistory() {
  const { t } = useLanguage();
  return (
    <EmptyStateBase
      source={require('../../../assets/animations/empty.json')}
      size={90}
      title={t('deliveryEmptyStates.noHistoryTitle', 'Aucun historique')}
      message={t('deliveryEmptyStates.noHistoryMessage', "L'historique de vos missions\ns'affichera ici.")}
    />
  );
}

export function EmptyMessages() {
  const { t } = useLanguage();
  return (
    <EmptyStateBase
      source={require('../../../assets/animations/empty.json')}
      size={90}
      title={t('deliveryEmptyStates.noMessagesTitle', 'Aucun message')}
      message={t('deliveryEmptyStates.noMessagesMessage', "Commencez la conversation avec\nl'équipe de support.")}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
});
