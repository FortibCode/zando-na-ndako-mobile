import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { LogOut, X } from 'lucide-react-native';
import { DeliveryScreen, OutlineButton, PrimaryButton, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { LoadingState } from '@/components/lottie-animations';

export default function Logout() {
  const { driver, logout } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [loggingOut, setLoggingOut] = useState(false);

  const driverName = driver?.prenom ? `${driver.prenom}`.toUpperCase() : '';

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/' as any);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || t('deliveryLogout.errorDesc', 'Impossible de se déconnecter.'));
      setLoggingOut(false);
    }
  }, [logout]);

  if (loggingOut) {
    return (
      <DeliveryScreen>
        <LoadingState message={t('deliveryLogout.loggingOut', 'Déconnexion en cours...')} size={90} />
      </DeliveryScreen>
    );
  }

  const seeYouSoon = t('deliveryLogout.seeYouSoon', 'À BIENTÔT');

  return (
    <DeliveryScreen>
      <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center', paddingTop: 16 }}>
        <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>{driverName ? `${seeYouSoon} ${driverName}` : seeYouSoon}</Text>
        <Text style={[styles.headerTitle, { fontSize: 31, marginTop: 6, color: colors.text }]}>{t('deliveryLogout.title', 'Déconnexion')}</Text>

        <Animated.View entering={ZoomIn.duration(400).delay(80).springify()} style={{
          width: 168,
          height: 168,
          marginTop: 28,
          borderRadius: 84,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 68 }}>👋</Text>
        </Animated.View>

        <Text style={[styles.headerTitle, { textAlign: 'center', fontSize: 25, marginTop: 24, color: colors.text }]}>
          {t('deliveryLogout.farewell1', 'À bientôt pour une')}
        </Text>
        <Text style={[styles.muted, { textAlign: 'center', fontSize: 21, marginTop: 4, color: colors.textSecondary }]}>
          {t('deliveryLogout.farewell2', 'prochaine mission')}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(300).delay(150).springify()}>
        <PrimaryButton red onPress={handleLogout}>
          <LogOut color="#FFF" size={19} /> {t('deliveryLogout.logout', 'Se déconnecter')}
        </PrimaryButton>

        <OutlineButton onPress={() => router.back()}>
          <X color={colors.primary} size={19} /> {t('deliveryLogout.cancel', 'Annuler')}
        </OutlineButton>
      </Animated.View>
    </DeliveryScreen>
  );
}
