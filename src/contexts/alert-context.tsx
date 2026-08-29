// ─── Remplacement cross-platform de `Alert.alert` (React Native) ───
// `Alert.alert` de react-native-web est un stub qui ne fait RIEN
// (`class Alert { static alert() {} }`) : sur le web, aucun message d'erreur ni de succès ne
// s'affiche, et toute navigation cachée dans le `onPress` d'un bouton (ex: après une publication
// réussie) ne se déclenche jamais puisqu'aucun bouton n'existe jamais réellement à presser.
// Ce module fournit `alert(...)` avec exactement la même signature que `Alert.alert` : sur
// iOS/Android le comportement natif est inchangé, sur le web une vraie modale est affichée.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Alert as RNAlert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from './theme-context';

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
};

type AlertState = { title: string; message?: string; buttons: AlertButton[] };

// Pont impératif : le Provider enregistre sa fonction d'affichage ici au montage, pour que
// `alert(...)` reste appelable depuis n'importe quel fichier (services, contexts, écrans) sans hook.
let showWebAlert: ((state: AlertState) => void) | null = null;

export function alert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    RNAlert.alert(title, message, buttons);
    return;
  }
  const resolvedButtons = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];
  if (showWebAlert) {
    showWebAlert({ title, message, buttons: resolvedButtons });
  } else {
    // Le Provider est monté à la racine de l'app (_layout.tsx) : ce repli ne devrait jamais
    // s'exécuter en pratique, il évite juste un message totalement silencieux si jamais ça arrivait.
    window.alert(message ? `${title}\n\n${message}` : title);
    resolvedButtons.find((b) => b.style !== 'cancel')?.onPress?.();
  }
}

// Confirmation avant déconnexion, même formulation partout (client/vendeur/livreur, web admin) —
// évite qu'un appui accidentel sur "Se déconnecter" ferme la session sans aucune confirmation.
export function confirmLogout(onConfirm: () => void): void {
  alert(
    'Déconnexion',
    'Voulez-vous vraiment vous déconnecter ?',
    [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: onConfirm },
    ],
  );
}

const AlertContext = createContext<null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const [state, setState] = useState<AlertState | null>(null);

  useEffect(() => {
    showWebAlert = setState;
    return () => {
      showWebAlert = null;
    };
  }, []);

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const handlePress = (button: AlertButton) => {
    setState(null);
    button.onPress?.();
  };

  return (
    <AlertContext.Provider value={null}>
      {children}
      <Modal visible={!!state} transparent animationType="fade" onRequestClose={() => setState(null)}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{state?.title}</Text>
            {!!state?.message && <Text style={[styles.message, { color: colors.textSecondary }]}>{state.message}</Text>}
            <View style={styles.buttonRow}>
              {state?.buttons.map((button, index) => (
                <Pressable
                  key={index}
                  onPress={() => handlePress(button)}
                  style={[styles.button, { borderTopColor: colors.border }, index > 0 && styles.buttonBorderLeft, index > 0 && { borderLeftColor: colors.border }]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: colors.primary },
                      button.style === 'destructive' && { color: colors.error },
                      button.style === 'cancel' && { color: colors.textSecondary, fontWeight: '600' },
                    ]}
                  >
                    {button.text || 'OK'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

// Conservé pour cohérence avec les autres contextes du projet, même si aucune valeur n'est
// consommée directement : `alert()` est l'API publique de ce module.
export function useAlertContext() {
  return useContext(AlertContext);
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 340, borderRadius: 18, borderWidth: 1, paddingTop: 22, overflow: 'hidden' },
  title: { fontSize: 17, fontWeight: '800', textAlign: 'center', paddingHorizontal: 20 },
  message: { fontSize: 14, lineHeight: 20, textAlign: 'center', paddingHorizontal: 20, marginTop: 8 },
  buttonRow: { flexDirection: 'row', marginTop: 20 },
  button: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1 },
  buttonBorderLeft: { borderLeftWidth: 1 },
  buttonText: { fontSize: 15, fontWeight: '700' },
});
