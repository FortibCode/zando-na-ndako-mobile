import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { PrimaryButton, authStyles } from '@/components/auth-ui';
import { DEVISE_OPTIONS, SignupPickerField, LANGUE_OPTIONS } from '@/components/signup/signup-form-field';
import { useLocalSignup } from '@/contexts/local-signup-context';
import { BrandColors } from '@/constants/brand';

/** Complétion du profil après vérification OTP pour Diaspora. */
export default function OverseasSignupProfileScreen() {
  const { data, update } = useLocalSignup();
  const [language, setLanguage] = useState(data.preferredLanguage);
  const [currency, setCurrency] = useState(
    data.currency === 'Franc CFA (FCFA)' ? 'Euro (€)' : data.currency || 'Euro (€)',
  );
  const [notifications, setNotifications] = useState(data.notificationsEnabled);

const handleSave = () => {
    update({ preferredLanguage: language, currency, notificationsEnabled: notifications });
    router.replace('/client');
  };

  const handleSkip = () => {
    router.replace('/client');
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Ionicons color={BrandColors.blue} name="arrow-back" size={28} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons color="#FFFFFF" name="settings-outline" size={36} />
          </View>
          <Text style={styles.title}>Personnalisez votre profil</Text>
          <Text style={styles.subtitle}>
            Configurez vos préférences pour une expérience adaptée à vos besoins depuis l'étranger.
          </Text>
        </View>

        <SignupPickerField
          label="Langue d'interface préférée"
          options={LANGUE_OPTIONS}
          value={language}
          onSelect={(option) => setLanguage(option.label)}
          pickerTitle="Choisissez votre langue"
        />

        <SignupPickerField
          label="Devise d'affichage des prix"
          options={DEVISE_OPTIONS}
          value={currency}
          onSelect={(option) => setCurrency(option.label)}
          pickerTitle="Choisissez votre devise"
        />

        {/* Notification toggle */}
        <View style={styles.notifCard}>
          <View style={styles.notifLeft}>
            <View style={styles.notifIcon}>
              <Ionicons color={BrandColors.blue} name="notifications-outline" size={22} />
            </View>
            <View style={styles.notifText}>
              <Text style={styles.notifLabel}>Notifications push</Text>
              <Text style={styles.notifHint}>Offres, livraisons et promotions</Text>
            </View>
          </View>
          <Switch
            trackColor={{ false: '#E2E8F0', true: BrandColors.blueBright }}
            thumbColor="#FFFFFF"
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>

        <PrimaryButton icon="checkmark-circle-outline" onPress={handleSave} title="Enregistrer les préférences" />

        <Pressable onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Passer cette étape</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 18 },
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 32 },
  hero: { alignItems: 'center', paddingBottom: 22 },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: BrandColors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: BrandColors.blue,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: { color: BrandColors.blue, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#64748B', fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4EAF6',
    padding: 16,
    marginBottom: 18,
  },
  notifLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: BrandColors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifText: { flex: 1 },
  notifLabel: { color: BrandColors.textDark, fontSize: 14, fontWeight: '700' },
  notifHint: { color: BrandColors.textMuted, fontSize: 12, marginTop: 2 },
  skipBtn: { alignItems: 'center', marginTop: 14 },
  skipText: { color: BrandColors.blueBright, fontSize: 15, fontWeight: '600' },
});
