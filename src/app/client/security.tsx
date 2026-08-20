import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ArrowLeft, Lock, Fingerprint, Shield, UserX, ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { deleteAccount, clearAuthToken } from '@/services/api';

export default function SecurityScreen() {
const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      t('security.deleteAccount', 'Supprimer mon compte'),
      t('security.deleteWarning', 'Cette action est irréversible. Toutes vos données seront définitivement supprimées.'),
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        { text: t('security.deleteConfirmShort', 'Supprimer'), style: 'destructive', onPress: () => setShowDeletePrompt(true) },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!deletePassword || deleting) return;
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      await clearAuthToken();
      router.replace('/auth' as any);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || t('security.deleteError', 'Impossible de supprimer le compte.'));
    } finally {
      setDeleting(false);
    }
  };

  const handlePrivacy = () => {
    Alert.alert(
      t('security.data', 'Confidentialité des données'),
      t('security.privacyMessage', 'La gestion détaillée de vos données personnelles sera bientôt disponible. Pour toute demande, contactez support@zandonandako.cg.')
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
<StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primaryLight }]}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: colors.primary }]}>{t('security.title', 'Sécurité & confidentialité')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('security.subtitle', 'Gérez la sécurité de votre compte')}</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mot de passe */}
        <Animated.View entering={FadeInUp.duration(350).delay(80).springify()}>
          <Pressable
            onPress={() => router.push('/client/change-password' as any)}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
              <Lock color={colors.primary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowText, { color: colors.primary }]}>{t('security.changePassword', 'Changer mon mot de passe')}</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>••••••••</Text>
            </View>
            <ChevronRight color={colors.textTertiary} size={18} />
          </Pressable>
        </Animated.View>

        {/* Biométrie */}
        <Animated.View entering={FadeInUp.duration(350).delay(120).springify()}>
          <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: 0.6 }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
              <Fingerprint color={colors.primary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowText, { color: colors.primary }]}>{t('security.biometric', 'Authentification biométrique')}</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{t('security.biometricSub', 'Utiliser Face ID / empreinte')}</Text>
            </View>
            <Text style={{ color: colors.textTertiary, fontSize: 11, fontWeight: '800' }}>{t('security.comingSoonBadge', 'BIENTÔT')}</Text>
          </View>
        </Animated.View>

        {/* Données personnelles */}
        <Animated.View entering={FadeInUp.duration(350).delay(160).springify()}>
          <Pressable onPress={handlePrivacy} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
              <Shield color={colors.primary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowText, { color: colors.primary }]}>{t('security.data', 'Confidentialité des données')}</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{t('security.dataSub', 'Gérer mes données personnelles')}</Text>
            </View>
            <ChevronRight color={colors.textTertiary} size={18} />
          </Pressable>
        </Animated.View>

        {/* Supprimer le compte */}
        <Animated.View entering={FadeInUp.duration(350).delay(200).springify()}>
<Pressable onPress={handleDeleteAccount} style={[styles.rowDanger, { backgroundColor: colors.error + '14', borderColor: colors.error + '55' }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.error + '22' }]}>
              <UserX color={colors.error} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowText, { color: colors.error }]}>{t('security.deleteAccount', 'Supprimer mon compte')}</Text>
              <Text style={[styles.rowSub, { color: colors.error }]}>{t('security.irreversibleAction', 'Action irréversible')}</Text>
            </View>
            <ChevronRight color={colors.error} size={18} />
          </Pressable>
        </Animated.View>

        {showDeletePrompt && (
          <Animated.View entering={FadeInUp.duration(300).springify()} style={[styles.rowDanger, { backgroundColor: colors.error + '0A', borderColor: colors.error + '40', flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
            <Text style={[styles.rowText, { color: colors.error }]}>{t('security.deletePasswordPrompt', 'Confirmez votre mot de passe pour supprimer définitivement votre compte')}</Text>
            <TextInput
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              placeholder={t('security.passwordPlaceholder', 'Mot de passe')}
              placeholderTextColor={colors.textTertiary}
              style={[styles.deleteField, { borderColor: colors.error + '55', backgroundColor: colors.surface, color: colors.text }]}
            />
            <Pressable
              onPress={confirmDelete}
              disabled={!deletePassword || deleting}
              style={[styles.deleteConfirmBtn, { backgroundColor: colors.error }, (!deletePassword || deleting) && { opacity: 0.5 }]}
            >
              {deleting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.deleteConfirmText}>{t('security.deleteFinalButton', 'Supprimer définitivement')}</Text>}
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { fontSize: 12.5, marginTop: 2 },
  content: { padding: 20, gap: 10, paddingBottom: 30 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { fontSize: 15, fontWeight: '800' },
rowSub: { fontSize: 12, marginTop: 2 },
  rowDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  deleteField: {
    height: 50, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, fontSize: 15,
  },
  deleteConfirmBtn: {
    height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  deleteConfirmText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});
