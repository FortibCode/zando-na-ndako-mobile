import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { envoyerMessageVendeur } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewSupportScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const TOPICS = [
    t('vendorSupportNew.topicAssistance', 'Assistance'),
    t('vendorSupportNew.topicClaim', 'Réclamation'),
    t('vendorSupportNew.topicDispute', 'Litige'),
    t('vendorSupportNew.topicPayment', 'Paiement'),
    t('vendorSupportNew.topicOther', 'Autre'),
  ];

  const [objet, setObjet] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = message.trim().length >= 3;

  const handleSend = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      await envoyerMessageVendeur(objet, message.trim());
      alert(t('vendorSupportNew.sentTitle', '✅ Message envoyé'), t('vendorSupportNew.sentDesc', 'Votre demande a été transmise à l\'équipe Zando na Ndako. Vous recevrez une réponse sous 24h.'), [
        { text: 'OK', onPress: () => router.replace('/vendor/support' as any) },
      ]);
    } catch (err: any) {
      alert('Erreur', err.message || t('vendorSupportNew.errorDesc', 'Impossible d\'envoyer le message.'));
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
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorSupportNew.title', 'Nouvelle demande')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).delay(80).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorSupportNew.topicLabel', 'Objet')}</Text>
          <View style={styles.chipsRow}>
            {TOPICS.map((topic) => {
              const selected = objet === topic;
              return (
                <Pressable
                  key={topic}
                  onPress={() => setObjet(topic)}
                  style={[styles.chip, { borderColor: colors.border }, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }, selected && { color: '#FFF', fontWeight: '900' }]}>{topic}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(160).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorSupportNew.messageLabel', 'Votre message')}</Text>
          <View style={[styles.msgBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={message}
              onChangeText={(v) => setMessage(v.slice(0, 500))}
              placeholder={t('vendorSupportNew.messagePlaceholder', 'Décrivez votre demande, réclamation ou litige...')}
              placeholderTextColor={colors.textTertiary}
              multiline
              style={[styles.msgInput, { color: colors.text }]}
            />
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>{message.length}/500</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(240).springify()}>
          <Text style={[styles.note, { color: colors.textSecondary }]}>
            {t('vendorSupportNew.note', 'Notre équipe vous répondra généralement sous 24h ouvrées. Pour les litiges, vous pouvez joindre des références de commande.')}
          </Text>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).delay(300).springify()} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable onPress={handleSend} disabled={!isValid || submitting} style={[styles.sendBtn, { backgroundColor: colors.primary }, (!isValid || submitting) && { opacity: 0.5 }]}>
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Send color="#FFF" size={18} />
              <Text style={styles.sendBtnText}>{t('vendorSupportNew.sendBtn', 'Envoyer la demande')}</Text>
            </>
          )}
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
  content: { padding: 20, gap: 20, paddingBottom: 30 },

  label: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: '700' },

  msgBox: { borderRadius: 16, padding: 14, minHeight: 150, borderWidth: 1 },
  msgInput: { fontSize: 14.5, minHeight: 110, textAlignVertical: 'top' },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 6 },

  note: { fontSize: 13, lineHeight: 20 },

  footer: { padding: 20, paddingBottom: 26, borderTopWidth: 1 },
  sendBtn: {
    height: 58, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  sendBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
