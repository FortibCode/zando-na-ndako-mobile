import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OpeningHoursScreen() {
  const { horaires, updateHoraire, saveHoraires } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  // Appelait auparavant uniquement cette alerte de succès sans jamais invoquer saveHoraires() :
  // les bascules faites via updateHoraire() ne vivaient que dans l'état React local et
  // disparaissaient au redémarrage de l'app, malgré la confirmation "Enregistré" affichée ici.
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveHoraires();
      alert(t('vendorHours.savedTitle', '✅ Horaires enregistrés'), t('vendorHours.savedDesc', 'Vos horaires d\'ouverture ont bien été mis à jour.'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      alert('Erreur', e.message || t('vendorHours.errorDesc', 'Impossible d\'enregistrer les horaires.'));
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
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorHours.title', "Horaires d'ouverture")}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {horaires.map((h, i) => (
          <Animated.View key={h.jour} entering={FadeInUp.duration(350).delay(60 + i * 50).springify()} style={styles.row}>
            <Text style={[styles.day, { color: colors.text }]}>{h.jour}</Text>
            <View style={[styles.timeBox, { borderColor: colors.border, backgroundColor: colors.surface }, !h.actif && { backgroundColor: colors.backgroundAlt }]}>
              <Text style={[styles.timeText, { color: colors.text }, !h.actif && { color: colors.textTertiary }]}>
                {h.actif ? `${h.ouverture} - ${h.fermeture}` : t('vendorHours.closed', 'Fermé')}
              </Text>
              <Switch
                value={h.actif}
                onValueChange={(v) => updateHoraire(h.jour, {
                  actif: v,
                  ouverture: v && !h.ouverture ? '06:00' : h.ouverture,
                  fermeture: v && !h.fermeture ? '18:00' : h.fermeture,
                })}
                trackColor={{ false: colors.border, true: colors.success + '60' }}
                thumbColor={h.actif ? colors.success : colors.textTertiary}
              />
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).delay(400).springify()} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}>
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{t('vendorHours.save', 'Enregistrer')}</Text>}
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

  row: { gap: 8 },
  day: { fontSize: 15, fontWeight: '800' },
  timeBox: {
    height: 58, borderRadius: 16, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16,
  },
  timeText: { fontSize: 15.5, fontWeight: '700' },

  footer: { padding: 20, paddingBottom: 26, borderTopWidth: 1 },
  saveBtn: {
    height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
