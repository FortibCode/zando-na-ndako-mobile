import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GoogleLogo } from '@/components/auth-ui';
import { useLocalSignup, type SignupMethod } from '@/contexts/local-signup-context';

type MethodOption = {
  id: SignupMethod;
  title: string;
  subtitle?: string;
  icon: 'phone' | 'email' | 'google';
};

const METHOD_OPTIONS: MethodOption[] = [
  { id: 'phone', title: 'Numéro de téléphone', subtitle: 'Recommandé', icon: 'phone' },
  { id: 'email', title: 'Adresse e-mail', icon: 'email' },
  { id: 'google', title: 'Continuer avec Google', icon: 'google' },
];

function MethodIcon({ type }: { type: MethodOption['icon'] }) {
  if (type === 'google') return <GoogleLogo size={28} />;
  return (
    <Ionicons
      color={type === 'phone' ? '#0D347C' : '#6B7280'}
      name={type === 'phone' ? 'call' : 'mail-outline'}
      size={24}
    />
  );
}

function MethodCard({
  option,
  selected,
  onPress,
}: {
  option: MethodOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <MethodIcon type={option.icon} />
      </View>
      <View style={styles.cardCopy}>
        <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>{option.title}</Text>
        {option.subtitle && (
          <Text style={[styles.cardSubtitle, selected && styles.cardSubtitleSelected]}>{option.subtitle}</Text>
        )}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

/** Choix de la méthode d'inscription pour le client local. */
export default function LocalSignupMethodScreen() {
  const { data, update } = useLocalSignup();
  const [selected, setSelected] = useState<SignupMethod>(data.method);

  const handleContinue = () => {
    update({ method: selected });
    router.push('/auth/signup/local/step1');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Comment souhaitez-vous{'\n'}vous inscrire ?</Text>
        <View style={styles.options}>
          {METHOD_OPTIONS.map((option) => (
            <MethodCard
              key={option.id}
              option={option}
              selected={selected === option.id}
              onPress={() => setSelected(option.id)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={handleContinue} style={styles.continueButton}>
          <Text style={styles.continueText}>Continuer</Text>
        </Pressable>
        <Text style={styles.loginPrompt}>Vous avez déjà un compte ?</Text>
        <Pressable onPress={() => router.replace('/auth')}>
          <Text style={styles.loginLink}>Se connecter</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 },
  title: {
    color: '#0D347C',
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 32,
  },
  options: { gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.3,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cardSelected: { borderColor: '#0D347C', backgroundColor: '#F0F5FF' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: { backgroundColor: '#E8EEF8' },
  cardCopy: { flex: 1, marginLeft: 14 },
  cardTitle: { color: '#374151', fontSize: 16, fontWeight: '700' },
  cardTitleSelected: { color: '#0D347C' },
  cardSubtitle: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  cardSubtitleSelected: { color: '#0D347C' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: '#0D347C' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#0D347C' },
  footer: { paddingHorizontal: 24, paddingBottom: 28, paddingTop: 12, alignItems: 'center' },
  continueButton: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    backgroundColor: '#E30613',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  continueText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  loginPrompt: { color: '#0D347C', fontSize: 14, marginBottom: 4 },
  loginLink: { color: '#0D347C', fontSize: 16, fontWeight: '800', textDecorationLine: 'underline' },
});
