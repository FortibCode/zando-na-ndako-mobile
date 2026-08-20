import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { useVendor } from '@/contexts/vendor-context';
import { fetchMessagesCommande, envoyerMessageCommande, getUser, type ApiMessageCommande } from '@/services/api';

// Le fil de messagerie est unique par commande (partagé entre client, vendeur et livreur) :
// le paramètre `role` sert uniquement à afficher le bon contact/avatar en en-tête, pas à
// filtrer les messages — voir MessageCommandeController côté backend.
export default function VendorChatScreen() {
  const { id: commandeId, role } = useLocalSearchParams<{ id: string; role?: string }>();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { getOrder } = useVendor();
  const isLivreur = role === 'livreur';
  const order = getOrder(commandeId || '');

  const [messages, setMessages] = useState<ApiMessageCommande[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const contactName = isLivreur
    ? (order?.livreur?.nom || t('vendorChat.driverLabel', 'Livreur'))
    : (order?.client?.nom || t('vendorChat.clientLabel', 'Client'));
  const avatarEmoji = isLivreur ? '🧑🏾‍✈️' : '🙎🏾';

  useEffect(() => {
    (async () => {
      const user = await getUser();
      setCurrentUserId(user?.id || null);
    })();
  }, []);

  const loadMessages = useCallback(async (opts?: { silent?: boolean }) => {
    if (!commandeId) return;
    if (!opts?.silent) setLoading(true);
    try {
      const data = await fetchMessagesCommande(commandeId);
      setMessages(data);
    } catch (_err) {
      // Garde les messages déjà chargés en cas d'échec réseau ponctuel.
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [commandeId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(() => loadMessages({ silent: true }), 15000); // polling 15s
    return () => clearInterval(interval);
  }, [loadMessages]);

  const handleSend = async () => {
    if (!draft.trim() || !commandeId || sending) return;
    const contenu = draft.trim();
    setDraft('');
    setSending(true);
    try {
      const sent = await envoyerMessageCommande(commandeId, contenu);
      setMessages((prev) => [...prev, sent]);
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
          <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
        </View>
        <View>
          <Text style={[styles.name, { color: colors.text }]}>{contactName}</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>{isLivreur ? t('vendorChat.driverLabel', 'Livreur') : t('vendorChat.clientLabel', 'Client')}</Text>
        </View>
      </Animated.View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
            {messages.map((m, i) => {
              const mine = !!currentUserId && m.expediteur_user_id === currentUserId;
              const senderLabel = !mine ? (m.expediteur?.prenom || m.expediteur?.nom || '') : '';
              const heure = m.created_at
                ? new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                : '';
              return (
                <Animated.View
                  key={m.id}
                  entering={FadeInUp.duration(300).delay(i * 60).springify()}
                  style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}
                >
                  {senderLabel ? (
                    <Text style={[styles.senderLabel, { color: colors.textTertiary }]}>{senderLabel}</Text>
                  ) : null}
                  <View style={[styles.bubble, mine ? [styles.bubbleMine, { backgroundColor: colors.freshSoft }] : [styles.bubbleTheirs, { backgroundColor: colors.surfaceAlt }]]}>
                    <Text style={[styles.bubbleText, { color: colors.text }, mine && { color: colors.success }]}>{m.contenu}</Text>
                  </View>
                  <Text style={[styles.time, { color: colors.textTertiary }]}>{heure}</Text>
                </Animated.View>
              );
            })}
          </ScrollView>
        )}

        <Animated.View entering={FadeInUp.duration(300).delay(200).springify()} style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('vendorChat.messagePlaceholder', 'Écrire un message...')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
            onSubmitEditing={handleSend}
            editable={!sending}
          />
          <Pressable onPress={handleSend} disabled={sending} style={[styles.sendBtn, { backgroundColor: colors.primary }, sending && { opacity: 0.6 }]}>
            {sending ? <ActivityIndicator color={colors.white} size="small" /> : <Send color={colors.white} size={18} />}
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
  avatarEmoji: { fontSize: 22 },
  name: { fontSize: 16, fontWeight: '900' },
  sub: { fontSize: 11.5, marginTop: 1 },

  messages: { padding: 18, gap: 14, paddingBottom: 20 },
  bubbleWrap: { maxWidth: '78%', gap: 4 },
  bubbleWrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderLabel: { fontSize: 10.5, fontWeight: '800', marginLeft: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleTheirs: { borderBottomLeftRadius: 4 },
  bubbleMine: { borderBottomRightRadius: 4 },
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
