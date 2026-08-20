// ─── Notifications push réelles (Expo Push Service) ───
// Filet de sécurité inchangé : si l'enregistrement échoue pour n'importe quelle raison
// (permission refusée, simulateur, pas de projectId EAS, hors-ligne...), on journalise et on
// continue — le polling existant (15-20s, voir delivery-context.tsx / vendor-context.tsx /
// client/orders/tracking.tsx) reste la source de vérité, exactement comme SmsService.php se
// rabat sur un simple log quand Twilio n'est pas configuré.
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api, { getAuthToken } from './api';

// Affichage au premier plan : bannière + entrée dans la liste des notifications, sans son ni
// badge (comportement neutre tant qu'aucun réglage utilisateur n'existe pour le personnaliser).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export type PushNotificationData = {
  type?: 'commande' | 'nouvelle_commande' | 'mission_disponible' | 'mission_assignee' | string;
  commande_id?: string;
  statut?: string;
  [key: string]: unknown;
};

/**
 * Demande la permission (si besoin), récupère le jeton Expo Push de cet appareil et
 * l'enregistre auprès du backend pour l'utilisateur actuellement connecté.
 * À appeler juste après un login réussi, et au démarrage de l'app si une session existe déjà.
 *
 * Retourne le jeton en cas de succès, `null` sinon (jamais d'exception : la fonction ne doit
 * jamais bloquer/casser le flux d'authentification ou le démarrage de l'app).
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    const authToken = await getAuthToken();
    if (!authToken) return null; // pas connecté : rien à enregistrer

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Zando na Ndako',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0B8A3E',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('[Push] Permission refusée — notifications désactivées, repli sur le polling existant.');
      return null;
    }

    // En Expo Go (SDK 53+), l'obtention d'un jeton push distant n'est plus supportée sur Android :
    // getExpoPushTokenAsync lève une exception, capturée plus bas — le polling prend le relais.
    const projectId: string | undefined =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const expoPushToken = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    await api.post('/user/push-token', {
      token: expoPushToken.data,
      plateforme: Platform.OS,
    });

    return expoPushToken.data;
  } catch (error) {
    console.warn('[Push] Enregistrement du jeton impossible, repli sur le polling existant.', error);
    return null;
  }
}

/**
 * Monte les écouteurs premier-plan / tap. À appeler une seule fois au niveau racine de l'app
 * (voir src/app/_layout.tsx). `onNotificationTap` reçoit les données jointes à la notification
 * (ex: { type: 'commande', commande_id }) pour permettre la navigation au bon écran.
 */
export function initPushNotificationListeners(onNotificationTap: (data: PushNotificationData) => void): () => void {
  // Reçue pendant que l'app est au premier plan : le handler ci-dessus s'occupe déjà de
  // l'affichage (bannière) ; rien de plus à faire ici.
  const receivedSub = Notifications.addNotificationReceivedListener(() => {});

  // Appui sur la notification (premier plan, arrière-plan ou app fermée relancée dessus).
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = (response.notification.request.content.data || {}) as PushNotificationData;
    onNotificationTap(data);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
