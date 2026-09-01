import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HandoverOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { setOrderStatus } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const CHECKS = [
    t('vendorHandover.check1', 'Produits vérifiés'),
    t('vendorHandover.check2', 'Quantités conformes'),
    t('vendorHandover.check3', 'Emballage sécurisé'),
  ];
  const [checked, setChecked] = useState<boolean[]>([true, true, true]);
  const [comment, setComment] = useState('');

  const toggle = (i: number) => setChecked((prev) => prev.map((c, idx) => (idx === i ? !c : c)));
  const allChecked = checked.every(Boolean);

  const handleConfirm = () => {
    setOrderStatus(id || '', 'en_livraison');
    router.replace('/vendor/(tabs)/orders' as any);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorHandover.title', 'Remettre la commande')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInUp.duration(350).delay(60).springify()} style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('vendorHandover.subtitle', 'Vérifiez avant de remettre')}
        </Animated.Text>

        <Animated.View entering={FadeInUp.duration(400).delay(120).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          {CHECKS.map((label, i) => (
            <Pressable
              key={label}
              onPress={() => toggle(i)}
              style={[styles.checkRow, i < CHECKS.length - 1 && { borderBottomColor: colors.border }, { borderBottomWidth: i < CHECKS.length - 1 ? 1 : 0 }]}
            >
              <Text style={[styles.checkLabel, { color: colors.text }]}>{label}</Text>
              <View style={[styles.checkCircle, { borderColor: colors.borderStrong }, checked[i] && { backgroundColor: colors.success, borderColor: colors.success }]}>
                {checked[i] && <Check color={colors.white} size={16} strokeWidth={3} />}
              </View>
            </Pressable>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(200).springify()}>
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

      <Animated.View entering={FadeInUp.duration(400).delay(280).springify()} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          onPress={handleConfirm}
          disabled={!allChecked}
          style={[styles.confirmBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }, !allChecked && { backgroundColor: colors.borderStrong, shadowOpacity: 0 }]}
        >
          <Text style={styles.confirmBtnText}>{t('vendorHandover.confirmBtn', 'Confirmer la remise')}</Text>
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
  content: { padding: 20, gap: 18, paddingBottom: 30 },
  subtitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },

  card: {
    borderRadius: 20, padding: 6,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 16 },
  checkLabel: { fontSize: 15.5, fontWeight: '800' },
  checkCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  commentLabel: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  optional: { fontWeight: '400' },
  commentBox: { borderRadius: 18, padding: 16, minHeight: 130, borderWidth: 1 },
  commentInput: { fontSize: 14.5, minHeight: 90, textAlignVertical: 'top' },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 6 },

  footer: { padding: 20, paddingBottom: 26, borderTopWidth: 1 },
  confirmBtn: {
    height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  confirmBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
