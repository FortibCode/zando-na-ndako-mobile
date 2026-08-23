import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { changePassword } from '@/services/api';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

export default function ChangePasswordScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = ancien.length > 0 && nouveau.length >= 8 && nouveau === confirmation;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      await changePassword({ ancienMotDePasse: ancien, nouveauMotDePasse: nouveau });
      alert(t('changePassword.success', 'Mot de passe changé'), t('changePassword.successDesc', 'Veuillez vous reconnecter avec votre nouveau mot de passe.'), [
        { text: 'OK', onPress: () => router.replace('/auth') },
      ]);
    } catch (e: any) {
      alert('Erreur', e.message || t('changePassword.error', 'Impossible de changer le mot de passe.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorProfile.changePasswordLabel', 'Changer le mot de passe')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).delay(60).springify()} style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
          <Lock color={colors.primary} size={28} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(120).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('changePassword.current', 'Mot de passe actuel')}</Text>
          <TextInput
            value={ancien}
            onChangeText={setAncien}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textTertiary}
            style={[styles.field, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(160).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('changePassword.newPassword', 'Nouveau mot de passe')}</Text>
          <TextInput
            value={nouveau}
            onChangeText={setNouveau}
            secureTextEntry
            placeholder={t('changePassword.newPasswordHint', '8 caractères minimum')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.field, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(200).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('changePassword.confirmNew', 'Confirmer le nouveau mot de passe')}</Text>
          <TextInput
            value={confirmation}
            onChangeText={setConfirmation}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textTertiary}
            style={[styles.field, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
          />
          {confirmation.length > 0 && nouveau !== confirmation && (
            <Text style={[styles.errorText, { color: colors.error }]}>{t('changePassword.mismatch', 'Les mots de passe ne correspondent pas.')}</Text>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(260).springify()}>
          <Pressable
            onPress={handleSubmit}
            disabled={!isValid || submitting}
            style={[styles.submitBtn, { backgroundColor: colors.primary }, (!isValid || submitting) && { opacity: 0.5 }]}
          >
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>{t('vendorProfile.changePasswordLabel', 'Changer le mot de passe')}</Text>}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '900' },
  content: { padding: 20, gap: 16, paddingBottom: 30 },

  iconWrap: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 4,
  },

  label: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  field: {
    height: 52, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, fontSize: 15,
  },
  errorText: { fontSize: 12.5, fontWeight: '700', marginTop: 6 },

  submitBtn: {
    height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
