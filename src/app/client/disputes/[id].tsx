import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Send, Paperclip, ShieldAlert, Wallet } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import {
  fetchClientLitigeDetail, envoyerMessageLitige, uploaderPreuveLitige,
  type ApiLitige, type ApiLitigeMessage, type LitigeStatut,
} from '@/services/api';

const STATUT_COLOR: Record<LitigeStatut, string> = {
  ouvert: '#C00000', attente_vendeur: '#F1A105', attente_client: '#F1A105',
  en_cours: '#1A2E5A', escalade: '#C00000', resolu: '#2E7D32', rejete: '#8A8F98', annule: '#8A8F98',
};

export default function ClientDisputeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [litige, setLitige] = useState<ApiLitige | null>(null);
  const [messages, setMessages] = useState<ApiLitigeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!id) return;
    if (!opts?.silent) setLoading(true);
    try {
      const data = await fetchClientLitigeDetail(id);
      setLitige(data);
      setMessages(data.messages || []);
    } catch (_err) {
      // conserve l'état déjà chargé en cas d'échec réseau ponctuel
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ silent: true }), 15000);
    return () => clearInterval(interval);
  }, [load]);

  const closed = litige ? ['resolu', 'rejete', 'annule'].includes(litige.statut) : false;

  const handleSend = async () => {
    if (!draft.trim() || !id || sending) return;
    const message = draft.trim();
    setDraft('');
    setSending(true);
    try {
      const sent = await envoyerMessageLitige(id, message);
      setMessages((prev) => [...prev, sent]);
    } catch (_err) {
      setDraft(message);
    } finally {
      setSending(false);
    }
  };

  const handleAttach = async () => {
    if (!id || uploading) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('clientDisputeDetail.photoPermTitle', 'Permission requise'), t('clientDisputeDetail.photoPermDesc', "L'accès aux photos est nécessaire pour joindre une preuve."));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      await uploaderPreuveLitige(id, { uri: asset.uri, fileName: asset.fileName, type: asset.mimeType || 'image/jpeg' });
      await load({ silent: true });
    } catch (err: any) {
      Alert.alert('Erreur', err.message || t('clientDisputeDetail.uploadError', "Impossible d'envoyer cette preuve."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{litige?.numero || t('clientDisputeDetail.title', 'Litige')}</Text>
          {litige && (
            <View style={[styles.statusBadge, { backgroundColor: STATUT_COLOR[litige.statut] + '18', alignSelf: 'flex-start' }]}>
              <Text style={[styles.statusText, { color: STATUT_COLOR[litige.statut] }]}>{litige.statut.replace(/_/g, ' ')}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
            {litige && (
              <View style={[styles.motifCard, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]}>
                <ShieldAlert color={colors.error} size={16} />
                <Text style={[styles.motifText, { color: colors.error }]}>{litige.description}</Text>
              </View>
            )}

            {(litige?.remboursements ?? []).map((r) => (
              <View key={r.id} style={[styles.systemCard, { backgroundColor: colors.freshSoft }]}>
                <Wallet color={colors.success} size={16} />
                <Text style={[styles.systemText, { color: colors.success }]}>
                  {t('clientDisputeDetail.refund', 'Remboursement')} : {Math.round(Number(r.montant)).toLocaleString('fr-FR')} {r.devise} — {r.statut}
                </Text>
              </View>
            ))}

            {messages.map((m, i) => {
              const mine = m.sender_type === 'client';
              const isSystem = m.sender_type === 'system';
              const senderLabel = m.sender_type === 'admin' ? t('clientDisputeDetail.adminLabel', 'Administration') : m.sender_type === 'vendeur' ? t('clientDisputeDetail.vendorLabel', 'Vendeur') : '';
              if (isSystem) {
                return (
                  <View key={m.id} style={[styles.systemCard, { backgroundColor: colors.surfaceAlt, alignSelf: 'center' }]}>
                    <Text style={[styles.systemText, { color: colors.textSecondary }]}>{m.message}</Text>
                  </View>
                );
              }
              return (
                <Animated.View
                  key={m.id}
                  entering={FadeInUp.duration(280).delay(i * 40).springify()}
                  style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}
                >
                  {senderLabel ? <Text style={[styles.senderLabel, { color: colors.textTertiary }]}>{senderLabel}</Text> : null}
                  <View style={[styles.bubble, mine ? [styles.bubbleMine, { backgroundColor: colors.freshSoft }] : [styles.bubbleTheirs, { backgroundColor: colors.surfaceAlt }]]}>
                    <Text style={[styles.bubbleText, { color: mine ? colors.success : colors.text }]}>{m.message}</Text>
                  </View>
                  <Text style={[styles.time, { color: colors.textTertiary }]}>
                    {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </Animated.View>
              );
            })}
          </ScrollView>

          {!closed ? (
            <Animated.View entering={FadeInUp.duration(300).delay(150).springify()} style={[styles.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <Pressable onPress={handleAttach} disabled={uploading} style={[styles.attachBtn, { backgroundColor: colors.primarySoft }]}>
                {uploading ? <ActivityIndicator size="small" color={colors.primary} /> : <Paperclip color={colors.primary} size={18} />}
              </Pressable>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={t('clientDisputeDetail.messagePlaceholder', 'Écrire un message...')}
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                onSubmitEditing={handleSend}
                editable={!sending}
              />
              <Pressable onPress={handleSend} disabled={sending} style={[styles.sendBtn, { backgroundColor: colors.primary }, sending && { opacity: 0.6 }]}>
                {sending ? <ActivityIndicator color={colors.white} size="small" /> : <Send color={colors.white} size={18} />}
              </Pressable>
            </Animated.View>
          ) : (
            <View style={[styles.closedBar, { backgroundColor: colors.surfaceAlt, borderTopColor: colors.border }]}>
              <Text style={[styles.closedText, { color: colors.textSecondary }]}>
                {t('clientDisputeDetail.closed', 'Ce litige est clôturé.')}
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '900' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },

  messages: { padding: 18, gap: 12, paddingBottom: 20 },
  motifCard: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, padding: 13 },
  motifText: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  systemCard: { flexDirection: 'row', gap: 8, alignItems: 'center', borderRadius: 12, padding: 10, alignSelf: 'stretch' },
  systemText: { fontSize: 12.5, fontWeight: '700', flexShrink: 1 },

  bubbleWrap: { maxWidth: '78%', gap: 4 },
  bubbleWrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderLabel: { fontSize: 10.5, fontWeight: '800', marginLeft: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  bubbleTheirs: { borderBottomLeftRadius: 4 },
  bubbleMine: { borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14.5, lineHeight: 21 },
  time: { fontSize: 11 },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderTopWidth: 1 },
  attachBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, height: 46, borderRadius: 23, borderWidth: 1, paddingHorizontal: 16, fontSize: 14 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  closedBar: { padding: 16, borderTopWidth: 1, alignItems: 'center' },
  closedText: { fontSize: 13, fontWeight: '700' },
});
