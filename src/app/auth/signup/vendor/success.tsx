import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/brand';
import { SafeAreaView } from 'react-native-safe-area-context';

const FEATURES = [
  { icon: 'storefront-outline', text: 'Votre boutique sera visible aux acheteurs' },
  { icon: 'shield-checkmark-outline', text: 'Dossier soumis à vérification' },
  { icon: 'notifications-outline', text: 'Notification dès validation de votre compte' },
];

export default function VendorSignupSuccessScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Graphic */}
        <View style={styles.graphic}>
          <View style={styles.ring3} />
          <View style={styles.ring2} />
          <View style={styles.ring1} />
          <View style={styles.checkCircle}>
            <Ionicons color="#FFFFFF" name="checkmark" size={80} />
          </View>
          <View style={[styles.dot, styles.dotA]} />
          <View style={[styles.dot, styles.dotB]} />
          <View style={[styles.dot, styles.dotC]} />
          <View style={[styles.dot, styles.dotD]} />
        </View>

        {/* Texts */}
        <Text style={styles.title}>Inscription réussie !</Text>
        <Text style={styles.subtitle}>
          Votre compte vendeur a été créé avec succès sur Zando na Ndako.
        </Text>

        {/* Feature list */}
        <View style={styles.featureList}>
          {FEATURES.map(({ icon, text }) => (
            <View key={text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons color={BrandColors.blue} name={icon as any} size={20} />
              </View>
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <Pressable
          onPress={() => router.replace('/auth')}
          style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.9 }]}
        >
          <Ionicons color="#FFFFFF" name="log-in-outline" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.ctaText}>Se connecter à mon compte</Text>
        </Pressable>

        <Text style={styles.note}>
          Délai de vérification estimé : 24 à 48 heures ouvrables.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFCFF' },
  content: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 52, paddingBottom: 36 },
  graphic: { width: 240, height: 260, alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 24 },
  ring3: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: '#DBEAFE', opacity: 0.6 },
  ring2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: '#BFDBFE', opacity: 0.8 },
  ring1: { position: 'absolute', width: 162, height: 162, borderRadius: 81, borderWidth: 2, borderColor: '#93C5FD' },
  checkCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: BrandColors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BrandColors.blue,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  dot: { width: 12, height: 12, borderRadius: 6, position: 'absolute' },
  dotA: { backgroundColor: '#E30613', top: 16, right: 30 },
  dotB: { backgroundColor: '#F59E0B', top: 22, left: 30 },
  dotC: { backgroundColor: '#10B981', bottom: 28, right: 24 },
  dotD: { backgroundColor: BrandColors.blueBright, bottom: 24, left: 22 },
  title: { color: BrandColors.blue, fontSize: 30, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  subtitle: { color: BrandColors.textSubtle, fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  featureList: { width: '100%', gap: 14, marginBottom: 36 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#F0F6FF', borderRadius: 12, padding: 14 },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: BrandColors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, color: BrandColors.textDark, fontSize: 14, fontWeight: '500', lineHeight: 20 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: BrandColors.blue,
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: BrandColors.blue,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  note: { color: BrandColors.textMuted, fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
});
