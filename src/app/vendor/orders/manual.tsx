import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Camera, Gift } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManualOrderScreen() {
  const { createManualOrder } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [photo, setPhoto] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const isValid = nom.trim().length >= 2 && telephone.trim().length >= 6 && adresse.trim().length >= 5;

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    try {
      const order = await createManualOrder({ nom: nom.trim(), telephone: telephone.trim(), email: email.trim() || undefined, adresse: adresse.trim(), message: message.trim() || undefined });
      alert(t('vendorManualOrder.createdTitle', '✅ Commande créée'), `${t('vendorManualOrder.createdDescPrefix', 'La commande pour')} ${nom.trim()} ${t('vendorManualOrder.createdDescSuffix', 'a été enregistrée.')}`, [
        { text: 'OK', onPress: () => router.replace(`/vendor/orders/${order.id}` as any) },
      ]);
    } catch (e: any) {
      alert('Erreur', e.message || t('vendorManualOrder.errorDesc', 'Impossible d\'enregistrer cette commande.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
            <ArrowLeft color={colors.primary} size={22} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(450).delay(60).springify()} style={styles.illusWrap}>
          {photo ? (
            <Image accessibilityLabel="Photo" contentFit="cover" source={{ uri: photo }} style={styles.illusImage} />
          ) : (
            <Text style={styles.illusEmoji}>🎁</Text>
          )}
          <Pressable onPress={handlePickPhoto} style={[styles.photoBtn, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Camera color={colors.primary} size={20} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(120).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorManualOrder.recipientName', 'Nom du destinataire')}</Text>
          <TextInput
            value={nom}
            onChangeText={setNom}
            placeholder={t('vendorManualOrder.recipientNamePlaceholder', 'Ex : Mademoiselle Maria-Charlotte')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.field, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground }]}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(160).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('diaspora.beneficiaryForm.phone', 'Téléphone')}</Text>
          <TextInput
            value={telephone}
            onChangeText={setTelephone}
            placeholder="+242 06 123 45 67"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
            style={[styles.field, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground }]}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(200).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorManualOrder.email', 'Email')}</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="exemple@gmail.com"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.field, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground }]}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(240).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorManualOrder.address', 'Adresse')}</Text>
          <TextInput
            value={adresse}
            onChangeText={setAdresse}
            placeholder={t('vendorManualOrder.addressPlaceholder', 'Avenue, quartier, ville')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.field, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground }]}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(280).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorManualOrder.message', 'Message')}</Text>
          <View style={[styles.msgBox, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}>
            <TextInput
              value={message}
              onChangeText={(v) => setMessage(v.slice(0, 200))}
              placeholder={t('vendorManualOrder.messagePlaceholder', 'Un petit mot pour accompagner cette commande...')}
              placeholderTextColor={colors.textTertiary}
              multiline
              style={[styles.msgInput, { color: colors.text }]}
            />
            <View style={styles.charRow}>
              <Gift color={colors.textTertiary} size={14} />
              <Text style={[styles.charCount, { color: colors.textTertiary }]}>{message.length}/200</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(340).springify()}>
          <Pressable onPress={handleSave} disabled={!isValid || saving} style={[styles.saveBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }, (!isValid || saving) && { backgroundColor: colors.borderStrong, shadowOpacity: 0 }]}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{t('vendorManualOrder.save', 'Enregistrer')}</Text>}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 16, paddingBottom: 30 },

  illusWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 8, position: 'relative', alignSelf: 'center' },
  illusEmoji: { fontSize: 90 },
  illusImage: { width: 140, height: 140, borderRadius: 20 },
  photoBtn: {
    position: 'absolute', right: -6, bottom: -6, width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },

  label: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  field: { height: 52, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 15 },
  msgBox: { borderRadius: 14, borderWidth: 1.5, padding: 14, minHeight: 110 },
  msgInput: { fontSize: 14.5, minHeight: 70, textAlignVertical: 'top' },
  charRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 6 },
  charCount: { fontSize: 11 },

  saveBtn: {
    height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
