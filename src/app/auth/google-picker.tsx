import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { alert } from '@/contexts/alert-context';
import { loginWithGoogle, ApiError, type LoginUser } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

// Requis par expo-auth-session pour que la fenêtre du navigateur se referme correctement après
// l'authentification (voir docs.expo.dev/guides/authentication).
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#34A853', '#FBBC05'] as const;

function GoogleLogo({ size = 44 }: { size?: number }) {
  const fs = Math.round(size * 0.82);
  const offset = Math.round(size * 0.06);
  const halfOffset = Math.round(-size * 0.38);

  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '50%', overflow: 'hidden' }}>
        <Text style={{ position: 'absolute', top: offset, left: offset, fontSize: fs, fontWeight: '900', color: '#4285F4' }}>G</Text>
      </View>
      <View style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '50%', overflow: 'hidden' }}>
        <Text style={{ position: 'absolute', top: offset, left: halfOffset, fontSize: fs, fontWeight: '900', color: '#EA4335' }}>G</Text>
      </View>
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: '50%', height: '50%', overflow: 'hidden' }}>
        <Text style={{ position: 'absolute', top: halfOffset - 2, left: offset, fontSize: fs, fontWeight: '900', color: '#34A853' }}>G</Text>
      </View>
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', overflow: 'hidden' }}>
        <Text style={{ position: 'absolute', top: halfOffset - 2, left: halfOffset, fontSize: fs, fontWeight: '900', color: '#FBBC05' }}>G</Text>
      </View>
    </View>
  );
}

// Tant que EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB n'est pas renseigné (Client ID OAuth créé sur
// console.cloud.google.com), la connexion Google reste annoncée honnêtement comme indisponible
// plutôt que de simuler une connexion réussie — même convention que les autres fonctionnalités pas
// encore branchées (ex: photo de signalement livreur).
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || '39050037461-h5i5aro5qd82dj907fud80vkdt1atnvu.apps.googleusercontent.com';

export default function GooglePickerScreen() {
  const [loading, setLoading] = useState(false);
  // Un email Google inconnu de la plateforme déclenche une inscription : Google ne fournissant ni
  // téléphone ni rôle, on les redemande ici avant de rappeler loginWithGoogle() une seconde fois.
  const [needsPhone, setNeedsPhone] = useState(false);
  const [pendingIdToken, setPendingIdToken] = useState<string | null>(null);
  const [phone, setPhone] = useState('');

  // En Expo Go, ce redirectUri prend la forme exp://127.0.0.1:8081/--/ — cette adresse exacte doit
  // être ajoutée aux "URI de redirection autorisés" du Client ID OAuth Web sur Google Cloud Console,
  // sans quoi Google refuse la redirection après connexion.
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'mobile' });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: WEB_CLIENT_ID,
    redirectUri,
  });

  const routeAfterLogin = useCallback((user: LoginUser) => {
    if (user.type_utilisateur === 'livreur') router.replace('/delivery/(tabs)' as any);
    else if (user.type_utilisateur === 'vendeur') router.replace('/vendor' as any);
    else router.replace('/client/(tabs)' as any);
  }, []);

  const finishLogin = useCallback(async (idToken: string, extra?: { typeUtilisateur: 'client'; telephone: string }) => {
    setLoading(true);
    try {
      const user = await loginWithGoogle(idToken, extra);
      setNeedsPhone(false);
      routeAfterLogin(user);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errorCode === 'GOOGLE_ACCOUNT_NOT_FOUND') {
        setPendingIdToken(idToken);
        setNeedsPhone(true);
      } else {
        alert('Connexion impossible', apiErr.message || 'Une erreur est survenue. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  }, [routeAfterLogin]);

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      finishLogin(response.params.id_token);
    } else if (response?.type === 'error') {
      alert('Connexion impossible', "La connexion avec Google a échoué. Réessayez.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handleConnect = useCallback(() => {
    if (!WEB_CLIENT_ID) {
      alert('Bientôt disponible', 'La connexion avec Google sera disponible dans une prochaine mise à jour.');
      return;
    }
    promptAsync();
  }, [promptAsync]);

  const handleConfirmSignup = useCallback(() => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8 || !pendingIdToken) return;
    finishLogin(pendingIdToken, { typeUtilisateur: 'client', telephone: `+242${digits}` });
  }, [phone, pendingIdToken, finishLogin]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Pressable accessibilityLabel="Retour" accessibilityRole="button" hitSlop={12} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color="#0D347C" name="close" size={26} />
        </Pressable>

        <View style={styles.headerLogo}>
          <GoogleLogo size={56} />
        </View>

        {needsPhone ? (
          <>
            <Text style={styles.title}>Finalisez votre inscription</Text>
            <Text style={styles.subtitle}>Aucun compte Zando na Ndako n'est associé à cet email Google.{`\n`}Indiquez votre numéro pour créer votre compte client.</Text>

            <View style={styles.phoneInputWrap}>
              <Text style={styles.phonePrefix}>+242</Text>
              <TextInput
                autoFocus
                keyboardType="phone-pad"
                onChangeText={setPhone}
                placeholder="06 123 45 67"
                placeholderTextColor="#9CA3AF"
                style={styles.phoneInput}
                value={phone}
              />
            </View>

            <Pressable disabled={loading || phone.replace(/\D/g, '').length < 8} onPress={handleConfirmSignup} style={[styles.connectButton, (loading || phone.replace(/\D/g, '').length < 8) && { opacity: 0.5 }]}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.connectButtonText}>Créer mon compte</Text>}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.title}>Continuer avec Google</Text>
            <Text style={styles.subtitle}>Connectez-vous ou inscrivez-vous en un geste avec votre compte Google.</Text>

            <Pressable disabled={loading || !request} onPress={handleConnect} style={[styles.connectButton, (loading || !request) && { opacity: 0.5 }]}>
              {loading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <GoogleLogo size={20} />
                  <Text style={styles.connectButtonText}>Continuer avec Google</Text>
                </>
              )}
            </Pressable>
          </>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          En vous connectant, vous acceptez les{' '}
          <Text style={styles.footerLink}>Conditions d'utilisation</Text> et la{' '}
          <Text style={styles.footerLink}>Politique de confidentialité</Text> de Zando na Ndako.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 12, paddingBottom: 40 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerLogo: { alignItems: 'center', marginTop: 16, marginBottom: 8 },
  title: { color: '#0D347C', fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  phoneInputWrap: {
    flexDirection: 'row', alignItems: 'center', marginTop: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 16, height: 54,
  },
  phonePrefix: { color: '#6B7280', fontSize: 16, fontWeight: '700', marginRight: 8 },
  phoneInput: { flex: 1, fontSize: 16, fontWeight: '600', color: '#111827' },
  connectButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 24, height: 54, borderRadius: 14, backgroundColor: '#0D347C',
  },
  connectButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  footer: { color: '#9CA3AF', fontSize: 11, textAlign: 'center', marginTop: 32, lineHeight: 16 },
  footerLink: { color: '#4285F4', fontWeight: '600' },
});
