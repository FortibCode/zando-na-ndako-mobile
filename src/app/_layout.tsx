import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { LocalSignupProvider } from '@/contexts/local-signup-context';
import { VendorSignupProvider } from '@/contexts/vendor-signup-context';
import { DeliverySignupProvider } from '@/contexts/delivery-signup-context';
import { ClientProvider } from '@/contexts/client-context';
import { DiasporaProvider } from '@/contexts/diaspora-context';
import { VendorProvider } from '@/contexts/vendor-context';
import { DeliveryProvider } from '@/contexts/delivery-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { LanguageProvider } from '@/contexts/language-context';
import { AlertProvider } from '@/contexts/alert-context';
import {
  initPushNotificationListeners,
  registerForPushNotificationsAsync,
  type PushNotificationData,
} from '@/services/push-notifications';

// Empêche le masquage automatique du splash screen jusqu'au chargement des polices
SplashScreen.preventAutoHideAsync().catch(() => {});

// Ouvre le bon écran selon le type de notification tapée. `type`/`commande_id` sont les
// données jointes côté backend par PushService (voir CommandeController/VendeurController/
// LivreurController) — même convention utilisée quel que soit le type d'utilisateur.
function handleNotificationTap(data: PushNotificationData) {
  const commandeId = data.commande_id ? String(data.commande_id) : undefined;
  if (data.type === 'commande' && commandeId) {
    router.push({ pathname: '/client/orders/tracking', params: { id: commandeId } });
  } else if (data.type === 'nouvelle_commande' && commandeId) {
    router.push(`/vendor/orders/${commandeId}` as any);
  } else if (data.type === 'mission_disponible' || data.type === 'mission_assignee') {
    router.push('/delivery/(tabs)/missions' as any);
  }
}

export default function RootLayout() {
  // Préchargement local des polices d'icônes pour éliminer l'erreur fontfaceobserver 12000ms timeout
  const [loaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (loaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, fontError]);

  // Enregistre le jeton push au démarrage (session déjà connectée) et écoute les
  // notifications reçues / tapées pendant toute la durée de vie de l'app. Complète
  // l'enregistrement fait juste après un login réussi (voir les écrans auth/*) : celui-ci
  // couvre le cas où l'utilisateur rouvre l'app avec une session déjà active.
  useEffect(() => {
    registerForPushNotificationsAsync();
    const removeListeners = initPushNotificationListeners(handleNotificationTap);
    return removeListeners;
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlertProvider>
          <LanguageProvider>
            <LocalSignupProvider>
              <VendorSignupProvider>
                <DeliverySignupProvider>
                  <DeliveryProvider>
                    <ClientProvider>
                      <DiasporaProvider>
                        <VendorProvider>
                          <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 220 }} />
                        </VendorProvider>
                      </DiasporaProvider>
                    </ClientProvider>
                  </DeliveryProvider>
                </DeliverySignupProvider>
              </VendorSignupProvider>
            </LocalSignupProvider>
          </LanguageProvider>
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
