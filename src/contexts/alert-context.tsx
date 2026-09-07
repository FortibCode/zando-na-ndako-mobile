// ─── Remplacement cross-platform de `Alert.alert` (React Native) ───
// `Alert.alert` de react-native-web est un stub qui ne fait RIEN.
// Ce module fournit `alert(...)` avec la même signature : sur native le comportement
// natif est préservé, sur le web une modale premium adaptative est affichée.
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
    window.alert(message ? `${title}\n\n${message}` : title);
    resolvedButtons.find((b) => b.style !== 'cancel')?.onPress?.();
  }
}

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

  const buttons = state?.buttons ?? [];
  // Si plus de 2 boutons OU si un bouton contient un texte long (> 12 caractères),
  // on empile les boutons VERTICALEMENT pour éviter que le texte ne se retrouve étouffé en colonnes étroites.
  const isVertical = buttons.length > 2 || buttons.some((b) => (b.text || '').length > 12);

  return (
    <AlertContext.Provider value={null}>
      {children}
      <Modal visible={!!state} transparent animationType="fade" onRequestClose={() => setState(null)}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay || 'rgba(0, 0, 0, 0.55)' }]}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{state?.title}</Text>
            {!!state?.message && <Text style={[styles.message, { color: colors.textSecondary }]}>{state.message}</Text>}

            {/* Disposition des boutons : Verticale (stacked) si > 2 boutons ou texte long, sinon Horizontale */}
            <View style={isVertical ? styles.buttonColumn : styles.buttonRow}>
              {buttons.map((button, index) => {
                const isDestructive = button.style === 'destructive';
                const isCancel = button.style === 'cancel';

                return (
                  <Pressable
                    key={index}
                    onPress={() => handlePress(button)}
                    style={({ pressed }) => [
                      styles.button,
                      isVertical ? styles.buttonVertical : styles.buttonHorizontal,
                      { borderTopColor: colors.border || '#E2E8F0' },
                      !isVertical && index > 0 ? { borderLeftWidth: 1, borderLeftColor: colors.border || '#E2E8F0' } : null,
                      pressed && { backgroundColor: isDestructive ? '#FFF0F0' : '#F1F5F9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        { color: colors.primary || '#0D347C' },
                        isDestructive && styles.textDestructive,
                        isCancel && styles.textCancel,
                      ]}
                    >
                      {button.text || 'OK'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlertContext() {
  return useContext(AlertContext);
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center', paddingHorizontal: 20 },
  message: { fontSize: 14, lineHeight: 21, textAlign: 'center', paddingHorizontal: 20, marginTop: 8 },
  buttonRow: { flexDirection: 'row', marginTop: 22 },
  buttonColumn: { flexDirection: 'column', marginTop: 22 },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
  },
  buttonHorizontal: {
    flex: 1,
    height: 50,
  },
  buttonVertical: {
    width: '100%',
    height: 52,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  textDestructive: {
    color: '#E30613',
    fontWeight: '800',
  },
  textCancel: {
    color: '#64748B',
    fontWeight: '600',
  },
});
