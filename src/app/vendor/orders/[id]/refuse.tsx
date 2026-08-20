import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

export default function RefuseOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { refuseOrder } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const REASONS = [
    t('vendorRefuse.reason1', 'Produit indisponible'),
    t('vendorRefuse.reason2', 'Boutique fermée'),
    t('vendorRefuse.reason3', 'Rupture de stock'),
    t('vendorRefuse.reason4', 'Autre raison'),
  ];

  const [reason, setReason] = useState(t('vendorRefuse.reason3', 'Rupture de stock'));
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (sending) return;
    setSending(true);
    try {
      await refuseOrder(id || '', reason, comment.trim() || undefined);
      router.replace('/vendor/(tabs)/orders' as any);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || t('vendorRefuse.errorDesc', 'Impossible de refuser cette commande.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t('vendorRefuse.title', 'Refuser la commande')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('vendorRefuse.orderPrefix', 'Commande #')}{id}</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).delay(80).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('vendorRefuse.selectReason', 'Sélectionnez le motif du refus')}</Text>
          {REASONS.map((r, i) => {
            const selected = reason === r;
            return (
              <Pressable
                key={r}
                onPress={() => setReason(r)}
                style={[styles.reasonRow, i < REASONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <View style={[styles.radio, { borderColor: selected ? colors.error : colors.textTertiary }, selected && { borderColor: colors.error }]}>
                  {selected && <View style={[styles.radioInner, { backgroundColor: colors.error }]} />}
                </View>
                <Text style={[styles.reasonText, { color: colors.text }]}>{r}</Text>
              </Pressable>
            );
          })}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(160).springify()}>
          <Text style={[styles.commentLabel, { color: colors.text }]}>{t('vendorRefuse.commentLabel', 'Commentaire')} <Text style={[styles.optional, { color: colors.textTertiary }]}>{t('vendorRefuse.optional', '(optionnel)')}</Text></Text>
          <View style={[styles.commentBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={comment}
              onChangeText={(v) => setComment(v.slice(0, 200))}
              placeholder={t('vendorRefuse.commentPlaceholder', 'Écrivez votre commentaire...')}
              placeholderTextColor={colors.textTertiary}
              multiline
              style={[styles.commentInput, { color: colors.text }]}
            />
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>{comment.length}/200</Text>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).delay(240).springify()} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable onPress={handleSend} disabled={sending} style={[styles.sendBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }, sending && { opacity: 0.6 }]}>
          {sending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.sendBtnText}>{t('vendorRefuse.sendBtn', 'Envoyer le refus')}</Text>}
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
  subtitle: { fontSize: 12.5, marginTop: 2 },
  content: { padding: 20, gap: 18, paddingBottom: 30 },

  card: {
    borderRadius: 20, padding: 18,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 13, height: 13, borderRadius: 7 },
  reasonText: { fontSize: 15.5, fontWeight: '600' },

  commentLabel: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  optional: { fontWeight: '400' },
  commentBox: {
    borderRadius: 18, padding: 16, minHeight: 130,
    borderWidth: 1,
  },
  commentInput: { fontSize: 14.5, minHeight: 90, textAlignVertical: 'top' },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 6 },

  footer: { padding: 20, paddingBottom: 26, borderTopWidth: 1 },
  sendBtn: {
    height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  sendBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
