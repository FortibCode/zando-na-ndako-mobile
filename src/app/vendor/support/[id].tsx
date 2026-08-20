import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Send, Headset } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { fetchVendeurMessageDetail, repondreMessageVendeur, type ApiVendeurMessage } from '@/services/api';

type ThreadMessage = { id: string; text: string; mine: boolean; heure: string; date: number };

function toThreadMessage(m: ApiVendeurMessage): ThreadMessage {
  const dateObj = m.created_at ? new Date(m.created_at) : new Date();
  return {
    id: m.id,
    text: m.contenu,
    mine: m.expediteur === 'vendeur',
    heure: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    date: dateObj.getTime(),
  };
}

export default function SupportThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const loadThread = useCallback(async (opts?: { silent?: boolean }) => {
    if (!id) return;
    if (!opts?.silent) setLoading(true);
    try {
      const thread = await fetchVendeurMessageDetail(id);
      const all = [thread, ...(thread.reponses || [])]
        .map(toThreadMessage)
        .sort((a, b) => a.date - b.date);
      setMessages(all);
    } catch (_err) {
      // Garde le fil déjà chargé en cas d'échec réseau ponctuel.
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadThread();
    const interval = setInterval(() => loadThread({ silent: true }), 15000); // polling 15s
    return () => clearInterval(interval);
  }, [loadThread]);

  const handleSend = async () => {
    if (!draft.trim() || !id || sending) return;
    const contenu = draft.trim();
    setDraft('');
    setSending(true);
    try {
      await repondreMessageVendeur(id, contenu);
      await loadThread({ silent: true });
    } catch (_err) {
      setDraft(contenu);
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
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Headset color={colors.primary} size={20} />
        </View>
        <View>
          <Text style={[styles.name, { color: colors.text }]}>Zando na Ndako</Text>
          <Text style={[styles.sub, { color: colors.success }]}>{t('vendorSupportThread.adminLabel', '● Administration')}</Text>
        </View>
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
            {messages.map((m, i) => (
              <Animated.View
                key={m.id}
                entering={FadeInUp.duration(300).delay(i * 60).springify()}
                style={[styles.bubbleWrap, m.mine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}
              >
                <View style={[styles.bubble, m.mine ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface }]}>
                  <Text style={[styles.bubbleText, m.mine ? { color: '#FFF' } : { color: colors.text }]}>{m.text}</Text>
                </View>
                <Text style={[styles.time, { color: colors.textTertiary }]}>{m.heure}</Text>
              </Animated.View>
            ))}
          </ScrollView>
        )}

        <Animated.View entering={FadeInUp.duration(300).delay(200).springify()} style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('vendorSupportThread.messagePlaceholder', 'Écrire un message...')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { backgroundColor: colors.backgroundAlt, borderColor: colors.border, color: colors.text }]}
            onSubmitEditing={handleSend}
            editable={!sending}
          />
          <Pressable onPress={handleSend} disabled={sending} style={[styles.sendBtn, { backgroundColor: colors.primary }, sending && { opacity: 0.6 }]}>
            {sending ? <ActivityIndicator color="#FFF" size="small" /> : <Send color="#FFF" size={18} />}
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '900' },
  sub: { fontSize: 11.5, marginTop: 1 },

  messages: { padding: 18, gap: 14, paddingBottom: 20 },
  bubbleWrap: { maxWidth: '78%', gap: 4 },
  bubbleWrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'transparent' },
  bubbleText: { fontSize: 14.5, lineHeight: 21 },
  time: { fontSize: 11 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
    borderTopWidth: 1,
  },
  input: {
    flex: 1, height: 46, borderRadius: 23,
    borderWidth: 1, paddingHorizontal: 16, fontSize: 14,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
