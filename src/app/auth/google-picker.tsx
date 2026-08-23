import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { alert } from '@/contexts/alert-context';

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

// La connexion Google requiert un client OAuth (Google Cloud Console) qui n'est pas encore
// configuré pour ce projet — plutôt que de simuler une connexion réussie, l'écran l'annonce
// clairement, comme le fait déjà l'app pour d'autres fonctionnalités pas encore branchées
// (ex: photo de signalement livreur).
export default function GooglePickerScreen() {
  const handleConnect = useCallback(() => {
    alert('Bientôt disponible', 'La connexion avec Google sera disponible dans une prochaine mise à jour.');
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Pressable accessibilityLabel="Retour" accessibilityRole="button" hitSlop={12} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color="#0D347C" name="close" size={26} />
        </Pressable>

        <View style={styles.headerLogo}>
          <GoogleLogo size={56} />
        </View>
        <Text style={styles.title}>Sélectionnez un compte</Text>
        <Text style={styles.subtitle}>La connexion Google arrive bientôt{`\n`}— utilisez votre numéro ou votre e-mail pour l'instant.</Text>

        {/* Liste des comptes — pas encore branchée, chaque action mène à un message honnête plutôt qu'une fausse connexion */}
        <View style={[styles.accountList, { opacity: 0.55 }]}>
          <Pressable style={styles.accountRow} onPress={handleConnect}>
            <GoogleLogo size={44} />
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>Connectez-vous avec Google</Text>
              <Text style={styles.accountEmail}>Bientôt disponible</Text>
            </View>
          </Pressable>
        </View>

        {/* Ajouter un compte */}
        <Pressable style={[styles.addButton, { opacity: 0.55 }]} onPress={handleConnect}>
          <View style={styles.addIcon}>
            <Ionicons color="#4285F4" name="add" size={22} />
          </View>
          <Text style={styles.addText}>Ajouter un autre compte</Text>
        </Pressable>

        {/* Utiliser un autre compte */}
        <Pressable style={[styles.otherButton, { opacity: 0.55 }]} onPress={handleConnect}>
          <Ionicons color="#6B7280" name="person-outline" size={20} />
          <Text style={styles.otherText}>Utiliser un autre compte</Text>
        </Pressable>

        {/* Footer */}
        <Text style={styles.footer}>
          En vous connectant, vous accepterez les{' '}
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
  accountList: { marginTop: 28, borderRadius: 16, backgroundColor: '#F9FAFB', overflow: 'hidden' },
  accountRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  accountRowSelected: { backgroundColor: '#EFF6FF' },
  accountInfo: { flex: 1, marginLeft: 14 },
  accountName: { color: '#111827', fontSize: 16, fontWeight: '600' },
  accountEmail: { color: '#6B7280', fontSize: 13, marginTop: 3 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 22, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#4285F4', borderStyle: 'dashed' },
  addIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#4285F4', fontSize: 15, fontWeight: '700' },
  otherButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 14 },
  otherText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  footer: { color: '#9CA3AF', fontSize: 11, textAlign: 'center', marginTop: 32, lineHeight: 16 },
  footerLink: { color: '#4285F4', fontWeight: '600' },
});
