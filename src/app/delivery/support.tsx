import { useState, useCallback } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Headphones, Paperclip, Phone, Send, ShieldCheck } from 'lucide-react-native';
import { D, DeliveryScreen, Header, PrimaryButton, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { EmptyMessages } from '@/components/delivery/empty-states';

const SUPPORT_PHONE = '+242060000000';

export default function Support() {
  const { supportMessages, sendMessage } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [inputText, setInputText] = useState('');

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  }, [inputText, sendMessage]);

  const renderMessage = useCallback(({ item }: any) => {
    const isSupport = item.sender === 'support';
    return (
      <View
        key={item.id}
        style={{
          marginTop: 13,
          alignSelf: isSupport ? 'flex-start' : 'flex-end',
          maxWidth: '85%',
          backgroundColor: isSupport ? colors.surface : colors.primarySoft,
          borderWidth: isSupport ? 1 : 0,
          borderColor: isSupport ? colors.border : undefined,
          borderRadius: 18,
          padding: 17,
        }}
      >
        {isSupport && <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('deliverySupport.teamName', 'Support Zando na Ndako')}</Text>}
        <Text style={{ color: colors.text, fontSize: 16, lineHeight: 25, marginTop: isSupport ? 10 : 0 }}>
          {item.text}
        </Text>
        <Text
          style={{
            color: isSupport ? colors.textSecondary : colors.primary,
            fontSize: 11,
            marginTop: 9,
            textAlign: isSupport ? 'left' : 'right',
          }}
        >
          {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          {!isSupport && '  ✓✓'}
        </Text>
      </View>
    );
  }, [colors, t]);

  const handleCallSupport = useCallback(() => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {
      Alert.alert('Erreur', t('deliverySupport.callErrorDesc', "Impossible de lancer l'appel."));
    });
  }, [t]);

  return (
    <DeliveryScreen scroll={false}>
      <Header title={t('deliverySupport.title', "Centre d'aide")} />
      <View style={{ backgroundColor: D.blue, borderRadius: 22, padding: 21, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 50, height: 50, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Headphones color="#FFF" size={27} />
        </View>
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>{t('deliverySupport.teamName', 'Support Zando na Ndako')}</Text>
          <Text style={{ color: '#C8D8FF', fontSize: 13, marginTop: 6 }}>{t('deliverySupport.availability', 'Disponible 7j/7 · 6h à 22h')}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <View style={{ flex: 1, borderRadius: 16, backgroundColor: colors.freshSoft, padding: 15 }}>
          <ShieldCheck color={colors.fresh} size={20} />
          <Text style={{ color: colors.text, fontWeight: '900', marginTop: 9 }}>{t('deliverySupport.quickResponse', 'Réponse rapide')}</Text>
          <Text style={[styles.muted, { fontSize: 12, marginTop: 4, color: colors.textSecondary }]}>{t('deliverySupport.quickResponseSub', 'Moins de 5 min')}</Text>
        </View>
        <Pressable onPress={handleCallSupport} style={{ flex: 1, borderRadius: 16, backgroundColor: colors.goldSoft, padding: 15 }}>
          <Phone color={colors.gold} size={20} />
          <Text style={{ color: colors.text, fontWeight: '900', marginTop: 9 }}>{t('deliverySupport.directAssistance', 'Assistance directe')}</Text>
          <Text style={[styles.muted, { fontSize: 12, marginTop: 4, color: colors.textSecondary }]}>{t('deliverySupport.directAssistanceSub', "Appeler l'équipe")}</Text>
        </Pressable>
      </View>
      <Text style={[styles.sectionTitle, { marginTop: 30, marginBottom: 12, color: colors.text }]}>{t('deliverySupport.conversation', 'Conversation')}</Text>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {supportMessages.length === 0 ? (
          <EmptyMessages />
        ) : (
          <FlatList
            data={supportMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingBottom: 10 }}
            showsVerticalScrollIndicator={false}
          />
        )}
        <View style={{ height: 62, borderWidth: 1.5, borderColor: colors.border, borderRadius: 17, paddingHorizontal: 14, marginTop: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface }}>
          <TextInput
            placeholder={t('deliverySupport.messagePlaceholder', 'Écrivez votre message...')}
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            style={{ flex: 1, fontSize: 15, color: colors.text }}
          />
          <Pressable
            accessibilityLabel={t('deliverySupport.attachAria', 'Joindre un fichier (bientôt disponible)')}
            onPress={() => Alert.alert(t('deliverySupport.attachComingSoonTitle', 'Bientôt disponible'), t('deliverySupport.attachComingSoonDesc', "L'envoi de pièces jointes sera disponible dans une prochaine mise à jour."))}
            hitSlop={8}
          >
            <Paperclip color={colors.textTertiary} size={21} />
          </Pressable>
          <Pressable
            onPress={handleSend}
            style={{ width: 39, height: 39, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 10 }}
          >
            <Send color="#FFF" size={18} />
          </Pressable>
        </View>
        <PrimaryButton onPress={handleCallSupport}>
          <Phone color="#FFF" size={18} /> {t('deliverySupport.callSupport', 'Appeler le support')}
        </PrimaryButton>
      </KeyboardAvoidingView>
    </DeliveryScreen>
  );
}
