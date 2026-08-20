import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BrandColors } from '@/constants/brand';

const NEXT_STEPS = [
  { icon: 'globe-outline', label: 'Commandez pour vos proches au Congo' },
  { icon: 'card-outline', label: 'Payez en € ou $ de façon sécurisée' },
  { icon: 'bicycle-outline', label: 'Livraison rapide à domicile à Brazzaville' },
];

export default function OverseasSignupSuccessScreen() {
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
        <Text style={styles.title}>Compte Diaspora créé !</Text>
        <Text style={styles.subtitle}>
          Bienvenue sur Zando na Ndako. Vous pouvez maintenant aider vos proches depuis l'étranger.
        </Text>

        {/* Next Steps */}
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Ce que vous pouvez faire</Text>
          {NEXT_STEPS.map(({ icon, label }) => (
            <View key={label} style={styles.stepRow}>
              <View style={styles.stepIcon}>
                <Ionicons color="#10B981" name={icon as any} size={22} />
              </View>
              <Text style={styles.stepText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
<Pressable
          onPress={() => router.push('/auth/signup/overseas/profile' as any)}
          style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.9 }]}
        >
          <Ionicons color="#FFFFFF" name="person-circle-outline" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.ctaText}>Compléter mon profil</Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/client')} style={styles.skipBtn}>
          <Text style={styles.skipText}>Passer cette étape</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFCFF' },
  content: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 52, paddingBottom: 36 },
  graphic: { width: 240, height: 260, alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 24 },
  ring3: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: '#D1FAE5', opacity: 0.6 },
  ring2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 1.5, borderColor: '#A7F3D0', opacity: 0.8 },
  ring1: { position: 'absolute', width: 162, height: 162, borderRadius: 81, borderWidth: 2, borderColor: '#6EE7B7' },
  checkCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  dot: { width: 12, height: 12, borderRadius: 6, position: 'absolute' },
  dotA: { backgroundColor: '#E30613', top: 16, right: 30 },
  dotB: { backgroundColor: '#F59E0B', top: 22, left: 30 },
  dotC: { backgroundColor: BrandColors.blue, bottom: 28, right: 24 },
  dotD: { backgroundColor: '#6366F1', bottom: 24, left: 22 },
  title: { color: BrandColors.blue, fontSize: 30, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  subtitle: { color: BrandColors.textSubtle, fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  stepsContainer: { width: '100%', backgroundColor: '#F0FDF4', borderRadius: 16, padding: 18, marginBottom: 28, gap: 16 },
  stepsTitle: { color: '#065F46', fontSize: 14, fontWeight: '700', marginBottom: 6 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1, color: '#1E293B', fontSize: 14, fontWeight: '500', lineHeight: 20 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  skipBtn: { alignItems: 'center' },
  skipText: { color: BrandColors.blueBright, fontSize: 14, fontWeight: '600' },
});
