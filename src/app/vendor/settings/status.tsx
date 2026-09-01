import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useVendor, type BoutiqueStatut } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StoreStatusScreen() {
  const { boutique, updateBoutiqueStatus } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const OPTIONS: { id: BoutiqueStatut; label: string; desc: string }[] = [
    { id: 'ouverte', label: t('vendorStoreStatus.openLabel', 'Ouverte'), desc: t('vendorStoreStatus.openDesc', 'Visible par les clients et vous recevez des commandes.') },
    { id: 'pause', label: t('vendorStoreStatus.pausedLabel', 'En pause'), desc: t('vendorStoreStatus.pausedDesc', 'Vous ne recevez pas de nouvelles commandes.') },
    { id: 'fermee', label: t('vendorStoreStatus.closedLabel', 'Fermée'), desc: t('vendorStoreStatus.closedDesc', 'Votre boutique est fermée.') },
  ];
  const [statut, setStatut] = useState<BoutiqueStatut>(boutique.statut);
  const [message, setMessage] = useState(boutique.messageClients);
  const [saving, setSaving] = useState(false);

  // N'attendait auparavant jamais la promesse renvoyée par updateBoutiqueStatus() (qui appelle
  // désormais réellement PUT /vendeur/statut-boutique) : l'écran revenait en arrière et laissait
  // croire à un succès même en cas d'échec réseau, sans jamais informer le vendeur.
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateBoutiqueStatus(statut, message.trim());
      router.back();
    } catch (e: any) {
      alert('Erreur', e.message || t('vendorStoreStatus.errorDesc', 'Impossible de mettre à jour le statut de la boutique.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorStoreStatus.title', 'Statut de la boutique')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {OPTIONS.map((opt, i) => {
          const selected = statut === opt.id;
          return (
            <Animated.View key={opt.id} entering={FadeInUp.duration(350).delay(60 + i * 70).springify()}>
              <Pressable
                onPress={() => setStatut(opt.id)}
                style={[styles.option, { backgroundColor: colors.surface, borderColor: colors.border }, selected && { borderColor: colors.success }]}
              >
                <View style={[styles.radio, { borderColor: colors.borderStrong }, selected && { borderColor: colors.success, backgroundColor: colors.success }]}>
                  {selected && <CheckCircle2 color="#FFF" size={16} fill={colors.success} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>{opt.label}</Text>
                  <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{opt.desc}</Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}

        <Animated.View entering={FadeInUp.duration(400).delay(280).springify()}>
          <Text style={[styles.msgLabel, { color: colors.text }]}>{t('vendorStoreStatus.messageLabel', 'Message aux clients')} <Text style={[styles.optional, { color: colors.textTertiary }]}>{t('vendorStoreStatus.optional', '(optionnel)')}</Text></Text>
          <View style={[styles.msgBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t('vendorStoreStatus.messagePlaceholder', 'Merci pour votre compréhension 🙏')}
              placeholderTextColor={colors.textTertiary}
              multiline
              style={[styles.msgInput, { color: colors.text }]}
            />
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).delay(340).springify()} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}>
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{t('vendorStoreStatus.save', 'Enregistrer')}</Text>}
        </Pressable>
      </Animated.View>
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
  content: { padding: 20, gap: 14, paddingBottom: 30 },

  option: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    borderRadius: 18, padding: 18,
    borderWidth: 1.5,
  },
  radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { fontSize: 17, fontWeight: '900' },
  optionDesc: { fontSize: 13.5, marginTop: 4, lineHeight: 19 },

  msgLabel: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  optional: { fontWeight: '400' },
  msgBox: { borderRadius: 16, padding: 16, minHeight: 110, borderWidth: 1 },
  msgInput: { fontSize: 14.5, minHeight: 70, textAlignVertical: 'top' },

  footer: { padding: 20, paddingBottom: 26, borderTopWidth: 1 },
  saveBtn: {
    height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
