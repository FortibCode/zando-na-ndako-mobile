import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { BackButton } from '@/components/auth-ui';
import { SignupPickerField, LANGUE_OPTIONS } from '@/components/signup/signup-form-field';
import { useLocalSignup } from '@/contexts/local-signup-context';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Complétion du profil après vérification OTP. */
export default function LocalSignupProfileScreen() {
  const { data, update } = useLocalSignup();
  const [language, setLanguage] = useState(data.preferredLanguage);
  const [notifications, setNotifications] = useState(data.notificationsEnabled);

  const handleSave = () => {
    update({ preferredLanguage: language, notificationsEnabled: notifications });
    router.push('/auth/signup/local/success');
  };

  const handleSkip = () => {
    router.push('/auth/signup/local/success');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Complétez votre profil</Text>
        <Text style={styles.subtitle}>
          Ajoutez quelques informations supplémentaires pour améliorer votre expérience.
        </Text>
        <SignupPickerField
          label="Langue préférée"
          options={LANGUE_OPTIONS}
          value={language}
          onSelect={(option) => setLanguage(option.label)}
          pickerTitle="Choisissez votre langue"
        />
        <View style={styles.notificationRow}>
          <View style={styles.notificationCopy}>
            <Text style={styles.notificationLabel}>Notifications</Text>
            <Text style={styles.notificationHint}>Recevoir les offres et promotions</Text>
          </View>
          <Switch
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={notifications ? '#0D347C' : '#F3F4F6'}
            value={notifications}
            onValueChange={setNotifications}
          />
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveText}>Enregistrer</Text>
        </Pressable>
        <Pressable onPress={handleSkip}>
          <Text style={styles.skipText}>Plus tard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 24, paddingTop: 8 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  title: {
    color: '#0D347C',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 28,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  notificationCopy: { flex: 1, marginRight: 16 },
  notificationLabel: { color: '#0D347C', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  notificationHint: { color: '#6B7280', fontSize: 13 },
  footer: { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 12, alignItems: 'center' },
  saveButton: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    backgroundColor: '#E30613',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  saveText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  skipText: { color: '#0D347C', fontSize: 15, fontWeight: '700' },
});
