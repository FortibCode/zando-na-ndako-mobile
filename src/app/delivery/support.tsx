import { useState, useCallback, useEffect } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { alert } from '@/contexts/alert-context';
import { CheckCheck, Headphones, Paperclip, Phone, Send, ShieldCheck, X } from 'lucide-react-native';
import { D, DeliveryScreen, Header, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { EmptyMessages } from '@/components/delivery/empty-states';

const SUPPORT_PHONE = '+242060000000';

export default function Support() {
  const { supportMessages, supportLoading, supportError, sendMessage, fetchSupportMessages } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Recharge la conversation réelle à chaque ouverture de l'écran
  useEffect(() => { fetchSupportMessages(); }, [fetchSupportMessages]);

  const handlePickImage = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        alert(
          t('deliverySupport.permTitle', 'Permission requise'),
          t('deliverySupport.permDesc', "L'accès à la galerie photo est nécessaire pour envoyer des pièces jointes.")
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch {
      alert('Erreur', t('deliverySupport.pickError', "Impossible de sélectionner l'image. Veuillez réessayer."));
    }
  }, [t]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() && !selectedImage) return;

    let payload = inputText.trim();
    if (selectedImage) {
      payload = payload
        ? `${payload}\n[IMG:${selectedImage}]`
        : `[IMG:${selectedImage}]`;
    }

    sendMessage(payload);
    setInputText('');
    setSelectedImage(null);
  }, [inputText, selectedImage, sendMessage]);

  const renderMessage = useCallback(({ item }: any) => {
    const isSupport = item.sender === 'support';
    const text: string = item.text || '';
    const imgMatch = text.match(/\[IMG:(.*?)\]/);
    const imageUri = imgMatch ? imgMatch[1] : null;
    const cleanText = text.replace(/\[IMG:.*?\]/g, '').trim();

    return (
      <View
        key={item.id}
        style={{
          marginTop: 10,
          alignSelf: isSupport ? 'flex-start' : 'flex-end',
          maxWidth: '82%',
          backgroundColor: isSupport ? colors.surface : colors.primary,
          borderWidth: isSupport ? 1 : 0,
          borderColor: isSupport ? colors.border : undefined,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        {isSupport && (
          <Text style={{ color: colors.primary, fontSize: 11.5, fontWeight: '800', marginBottom: 4 }}>
            {t('deliverySupport.teamName', 'Support Zando na Ndako')}
          </Text>
        )}

        {imageUri ? (
          <View style={{ marginBottom: cleanText ? 8 : 0, borderRadius: 12, overflow: 'hidden' }}>
            <Image source={{ uri: imageUri }} style={{ width: 200, height: 140, borderRadius: 12 }} contentFit="cover" />
          </View>
        ) : null}

        {cleanText ? (
          <Text style={{ color: isSupport ? colors.text : '#FFF', fontSize: 14, lineHeight: 20 }}>
            {cleanText}
          </Text>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: isSupport ? 'flex-start' : 'flex-end',
            gap: 4,
            marginTop: 6,
          }}
        >
          <Text style={{ color: isSupport ? colors.textSecondary : 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '600' }}>
            {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {!isSupport && item.status === 'sending' && `  ${t('deliverySupport.statusSending', 'Envoi...')}`}
            {!isSupport && item.status === 'failed' && `  ${t('deliverySupport.statusFailed', 'Échec')}`}
          </Text>
          {!isSupport && (item.status === 'sent' || !item.status) && (
            <CheckCheck color="#FFF" size={12} strokeWidth={2.5} />
          )}
        </View>
      </View>
    );
  }, [colors, t]);

  const handleCallSupport = useCallback(() => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {
      alert('Erreur', t('deliverySupport.callErrorDesc', "Impossible de lancer l'appel."));
    });
  }, [t]);

  return (
    <DeliveryScreen scroll={false}>
      <View style={{ flex: 1, paddingHorizontal: 18, paddingBottom: Platform.OS === 'ios' ? 10 : 14 }}>
        <Header title={t('deliverySupport.title', "Centre d'aide")} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
          style={{ flex: 1 }}
        >
          {supportError && (
            <Text style={{ color: colors.error, fontSize: 12.5, marginBottom: 8 }}>{supportError}</Text>
          )}

          {supportLoading && supportMessages.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={supportMessages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 12, flexGrow: supportMessages.length === 0 ? 1 : undefined }}
              ListHeaderComponent={
                <View style={{ marginBottom: 12 }}>
                  {/* Header Banner Bleu Marine (#1A2E5A) */}
                  <View style={{ backgroundColor: '#1A2E5A', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' }}>
                      <Headphones color="#FFF" size={22} />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: '#FFF', fontSize: 15.5, fontWeight: '900' }}>{t('deliverySupport.teamName', 'Support Zando na Ndako')}</Text>
                      <Text style={{ color: '#C8D8FF', fontSize: 11.5, marginTop: 2 }}>{t('deliverySupport.availability', 'Disponible 7j/7 · 6h à 22h')}</Text>
                    </View>
                    <Pressable
                      onPress={handleCallSupport}
                      accessibilityLabel={t('deliverySupport.callSupport', 'Appeler le support')}
                      style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#34D399', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Phone color="#FFF" size={18} />
                    </Pressable>
                  </View>

                  {/* Cartes d'informations rapides */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <View style={{ flex: 1, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: colors.freshSoft, alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck color={colors.fresh} size={16} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 11.5 }} numberOfLines={1}>{t('deliverySupport.quickResponse', 'Réponse rapide')}</Text>
                        <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }} numberOfLines={1}>{t('deliverySupport.quickResponseSub', '< 5 min')}</Text>
                      </View>
                    </View>
                    <Pressable onPress={handleCallSupport} style={{ flex: 1, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
                        <Phone color={colors.gold} size={16} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 11.5 }} numberOfLines={1}>{t('deliverySupport.directAssistance', 'Assistance directe')}</Text>
                        <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }} numberOfLines={1}>{t('deliverySupport.directAssistanceSub', "Appeler l'équipe")}</Text>
                      </View>
                    </Pressable>
                  </View>

                  <Text style={[styles.sectionTitle, { marginTop: 16, fontSize: 15, color: colors.text }]}>{t('deliverySupport.conversation', 'Conversation')}</Text>
                </View>
              }
              ListEmptyComponent={<EmptyMessages />}
            />
          )}

          {/* Aperçu de la pièce jointe avant envoi */}
          {selectedImage ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 8, marginBottom: 8, gap: 10 }}>
              <Image source={{ uri: selectedImage }} style={{ width: 44, height: 44, borderRadius: 10 }} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.text }}>{t('deliverySupport.photoAttached', 'Photo jointe')}</Text>
                <Text style={{ fontSize: 11, color: colors.fresh, fontWeight: '700' }}>{t('deliverySupport.readyToSend', 'Prête à être envoyée')}</Text>
              </View>
              <Pressable
                onPress={() => setSelectedImage(null)}
                style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.backgroundAlt, alignItems: 'center', justifyContent: 'center' }}
              >
                <X color={colors.textSecondary} size={16} />
              </Pressable>
            </View>
          ) : null}

          {/* Barre de saisie ancrée en bas */}
          <View style={{ height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, marginTop: 4, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface }}>
            <TextInput
              placeholder={t('deliverySupport.messagePlaceholder', 'Écrivez votre message...')}
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              style={{ flex: 1, fontSize: 14, color: colors.text, paddingHorizontal: 6 }}
            />
            <Pressable
              accessibilityLabel={t('deliverySupport.attachAria', 'Joindre une photo')}
              onPress={handlePickImage}
              hitSlop={8}
              style={{ padding: 6 }}
            >
              <Paperclip color={selectedImage ? colors.primary : colors.textTertiary} size={19} strokeWidth={selectedImage ? 2.5 : 2} />
            </Pressable>
            <Pressable
              onPress={handleSend}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}
            >
              <Send color="#FFF" size={16} strokeWidth={2.2} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </DeliveryScreen>
  );
}

