import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { MessageSquareDashed, PackageSearch, Receipt, History } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

export function EmptyMissions() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <Animated.View entering={FadeIn.duration(400).springify()} exiting={FadeOut.duration(200)} style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
        <PackageSearch color={colors.primary} size={36} strokeWidth={2} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{t('deliveryEmptyStates.noMissionsTitle', 'Aucune mission disponible')}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {t('deliveryEmptyStates.noMissionsMessage', 'Revenez plus tard,\nde nouvelles missions apparaissent régulièrement.')}
      </Text>
    </Animated.View>
  );
}

export function EmptyRevenue() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <Animated.View entering={FadeIn.duration(400).springify()} exiting={FadeOut.duration(200)} style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
        <Receipt color={colors.primary} size={36} strokeWidth={2} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{t('deliveryEmptyStates.noRevenueTitle', 'Aucun revenu enregistré')}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {t('deliveryEmptyStates.noRevenueMessage', 'Vos gains apparaîtront ici après\nchaque livraison effectuée.')}
      </Text>
    </Animated.View>
  );
}

export function EmptyHistory() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <Animated.View entering={FadeIn.duration(400).springify()} exiting={FadeOut.duration(200)} style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
        <History color={colors.primary} size={36} strokeWidth={2} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{t('deliveryEmptyStates.noHistoryTitle', 'Aucun historique')}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {t('deliveryEmptyStates.noHistoryMessage', "L'historique de vos missions\ns'affichera ici.")}
      </Text>
    </Animated.View>
  );
}

export function EmptyMessages() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <Animated.View entering={FadeIn.duration(400).springify()} exiting={FadeOut.duration(200)} style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
        <MessageSquareDashed color={colors.primary} size={36} strokeWidth={2} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{t('deliveryEmptyStates.noMessagesTitle', 'Aucun message')}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {t('deliveryEmptyStates.noMessagesMessage', "Commencez la conversation avec\nl'équipe de support.")}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  iconBox: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 4,
    textAlign: 'center',
  },
  message: {
    fontSize: 13.5,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
});
