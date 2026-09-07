import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Clock, Clock3, AlertCircle, Check, X } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { SafeAreaView } from 'react-native-safe-area-context';

const TIME_PRESETS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
  '17:00', '17:30', '18:00', '18:30', '19:00', '20:00', '21:00', '22:00',
];

export default function OpeningHoursScreen() {
  const { horaires, updateHoraire, saveHoraires, boutique, updateBoutiqueStatus } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [saving, setSaving] = useState(false);
  const [editingTarget, setEditingTarget] = useState<{ jour: string; type: 'ouverture' | 'fermeture' } | null>(null);
  const [customLateMessage, setCustomLateMessage] = useState(boutique.messageClients || '');

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveHoraires();
      if (customLateMessage.trim() !== (boutique.messageClients || '')) {
        await updateBoutiqueStatus(boutique.statut, customLateMessage.trim());
      }
      alert(
        t('vendorHours.savedTitle', '✅ Horaires enregistrés'),
        t('vendorHours.savedDesc', 'Vos horaires d\'ouverture et exceptions ont été synchronisés avec l\'application client.'),
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      alert('Erreur', e.message || t('vendorHours.errorDesc', 'Impossible d\'enregistrer les horaires.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTime = (time: string) => {
    if (!editingTarget) return;
    const { jour, type } = editingTarget;
    const current = horaires.find((h) => h.jour === jour);
    if (current) {
      updateHoraire(jour, {
        [type]: time,
        actif: true,
      });
    }
    setEditingTarget(null);
  };

  const setLatePreset = (presetText: string) => {
    setCustomLateMessage(presetText);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t('vendorHours.title', "Horaires d'ouverture")}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Synchronisés en direct sur le web et mobile</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section 1 : Retard / Ouverture exceptionnelle aujourd'hui */}
        <Animated.View entering={FadeInUp.duration(350).delay(40).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <AlertCircle size={18} color={colors.warning} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Ouverture en retard ou d'exception aujourd'hui</Text>
          </View>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Saisissez l'heure d'ouverture de ce jour si vous avez rencontré un retard (ex: pluie, marché).
          </Text>

          <View style={styles.presetChipRow}>
            {[
              'Ouverture à 09h30',
              'Ouverture à 10h30 (réapprovisionnement)',
              'Ouverture à 11h00 (retard pluie)',
            ].map((p) => (
              <Pressable
                key={p}
                onPress={() => setLatePreset(p)}
                style={[
                  styles.presetChip,
                  { backgroundColor: customLateMessage === p ? colors.primarySoft : colors.backgroundAlt, borderColor: customLateMessage === p ? colors.primary : colors.border },
                ]}
              >
                <Text style={[styles.presetChipText, { color: customLateMessage === p ? colors.primary : colors.text }]}>{p}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            value={customLateMessage}
            onChangeText={setCustomLateMessage}
            placeholder="Ex: Ouverture exceptionnelle à 10h30 aujourd'hui 🙏"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundAlt }]}
          />
        </Animated.View>

        {/* Section 2 : Programme hebdomadaire */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Planning hebdomadaire par jour</Text>

        {horaires.map((h, i) => (
          <Animated.View key={h.jour} entering={FadeInUp.duration(350).delay(60 + i * 40).springify()} style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={[styles.day, { color: colors.text }]}>{h.jour}</Text>
              <Switch
                value={h.actif}
                onValueChange={(v) =>
                  updateHoraire(h.jour, {
                    actif: v,
                    ouverture: v && !h.ouverture ? '08:00' : h.ouverture,
                    fermeture: v && !h.fermeture ? '18:00' : h.fermeture,
                  })
                }
                trackColor={{ false: colors.border, true: colors.success + '60' }}
                thumbColor={h.actif ? colors.success : colors.textTertiary}
              />
            </View>

            {h.actif ? (
              <View style={styles.timeSelectRow}>
                {/* Bouton Ouverture */}
                <Pressable
                  onPress={() => setEditingTarget({ jour: h.jour, type: 'ouverture' })}
                  style={[styles.timeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Clock size={14} color={colors.primary} />
                  <Text style={[styles.timeBtnLabel, { color: colors.textSecondary }]}>Ouvre à :</Text>
                  <Text style={[styles.timeBtnValue, { color: colors.primary }]}>{h.ouverture || '08:00'}</Text>
                </Pressable>

                <Text style={[styles.timeSep, { color: colors.textTertiary }]}>à</Text>

                {/* Bouton Fermeture */}
                <Pressable
                  onPress={() => setEditingTarget({ jour: h.jour, type: 'fermeture' })}
                  style={[styles.timeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Clock3 size={14} color={colors.error} />
                  <Text style={[styles.timeBtnLabel, { color: colors.textSecondary }]}>Ferme à :</Text>
                  <Text style={[styles.timeBtnValue, { color: colors.error }]}>{h.fermeture || '18:00'}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={[styles.closedBox, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
                <Text style={[styles.closedText, { color: colors.textTertiary }]}>Fermé toute la journée</Text>
              </View>
            )}
          </Animated.View>
        ))}
      </ScrollView>

      {/* Modal Sélecteur d'heure */}
      <Modal visible={!!editingTarget} transparent animationType="fade" onRequestClose={() => setEditingTarget(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setEditingTarget(null)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingTarget?.jour} — Heure d'{editingTarget?.type}
              </Text>
              <Pressable onPress={() => setEditingTarget(null)} style={[styles.closeBtn, { backgroundColor: colors.backgroundAlt }]}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.presetsGrid} showsVerticalScrollIndicator={false}>
              {TIME_PRESETS.map((tVal) => {
                const isSelected =
                  editingTarget &&
                  horaires.find((h) => h.jour === editingTarget.jour)?.[editingTarget.type] === tVal;

                return (
                  <Pressable
                    key={tVal}
                    onPress={() => handleSelectTime(tVal)}
                    style={[
                      styles.presetItem,
                      { backgroundColor: isSelected ? colors.primary : colors.backgroundAlt, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.presetItemText, { color: isSelected ? '#FFFFFF' : colors.text }]}>{tVal}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Footer */}
      <Animated.View entering={FadeInUp.duration(400).delay(400).springify()} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}>
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{t('vendorHours.save', 'Enregistrer les horaires')}</Text>}
        </Pressable>
      </Animated.View>
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
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '900' },
  subtitle: { fontSize: 12, marginTop: 2 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },

  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800', flex: 1 },
  cardSub: { fontSize: 12.5, lineHeight: 18 },
  presetChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  presetChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  presetChipText: { fontSize: 11.5, fontWeight: '700' },
  input: { height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 13, marginTop: 4 },

  sectionTitle: { fontSize: 16, fontWeight: '900', marginTop: 10 },

  row: { gap: 8 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  day: { fontSize: 15, fontWeight: '800' },
  timeSelectRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  timeBtnLabel: { fontSize: 12, fontWeight: '600' },
  timeBtnValue: { fontSize: 14, fontWeight: '900' },
  timeSep: { fontSize: 13, fontWeight: '700' },

  closedBox: { height: 46, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  closedText: { fontSize: 13, fontWeight: '600' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '900' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 18 },
  presetItem: { width: '22%', height: 42, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  presetItemText: { fontSize: 13, fontWeight: '800' },

  footer: { padding: 20, paddingBottom: 26, borderTopWidth: 1 },
  saveBtn: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
