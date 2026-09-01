import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { GoogleLogo, PrimaryButton } from '@/components/auth-ui';
import { useLocalSignup, type SignupMethod } from '@/contexts/local-signup-context';
import { BrandColors } from '@/constants/brand';
import { SafeAreaView } from 'react-native-safe-area-context';

type MethodOption = {
  id: SignupMethod;
  title: string;
  subtitle?: string;
  icon: 'phone' | 'email' | 'google';
};

const METHOD_OPTIONS: MethodOption[] = [
  {
    id: 'email',
    title: 'Adresse e-mail',
    subtitle: 'Recommandé pour la Diaspora',
    icon: 'email',
  },
  {
    id: 'phone',
    title: 'Numéro de téléphone',
    subtitle: 'Avec indicatif international',
    icon: 'phone',
  },
  {
    id: 'google',
    title: 'Continuer avec Google',
    subtitle: 'Connexion rapide et sécurisée',
    icon: 'google',
  },
];

function MethodIcon({ type, selected }: { type: MethodOption['icon']; selected: boolean }) {
  if (type === 'google') return <GoogleLogo size={26} />;
  const icons = { phone: 'call', email: 'mail-outline' } as const;
  return (
    <Ionicons
      color={selected ? BrandColors.blue : BrandColors.textMuted}
      name={icons[type]}
      size={22}
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
      style={({ pressed }) => [styles.card, selected && styles.cardSelected, pressed && { opacity: 0.88 }]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <MethodIcon type={option.icon} selected={selected} />
      </View>
      <View style={styles.cardCopy}>
        <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>{option.title}</Text>
        {option.subtitle && (
          <Text style={[styles.cardSubtitle, selected && styles.cardSubtitleSelected]}>
            {option.subtitle}
          </Text>
        )}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

/** Choix de la méthode d'inscription pour le client Diaspora. */
export default function OverseasSignupMethodScreen() {
  const { data, update } = useLocalSignup();
  const [selected, setSelected] = useState<SignupMethod>(data.method || 'email');

  const handleContinue = () => {
    update({ method: selected });
    router.push('/auth/signup/overseas/step1' as any);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header badge */}
        <View style={styles.badgeRow}>
          <Ionicons color={BrandColors.blueBright} name="globe-outline" size={16} />
          <Text style={styles.badge}>Client Diaspora</Text>
        </View>

        <Text style={styles.title}>Méthode d'inscription</Text>
        <Text style={styles.subtitle}>
          Choisissez comment vous souhaitez créer votre compte.
        </Text>

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

        <PrimaryButton icon="arrow-forward" onPress={handleContinue} title="Continuer" />

        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Vous avez déjà un compte ?</Text>
          <Pressable onPress={() => router.replace('/auth')}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFE' },
  content: { paddingHorizontal: 22, paddingTop: 40, paddingBottom: 32 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 18,
  },
  badge: { color: BrandColors.blueBright, fontSize: 13, fontWeight: '700' },
  title: { color: BrandColors.blue, fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 8, lineHeight: 34 },
  subtitle: { color: BrandColors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  options: { gap: 14, marginBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BrandColors.border,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardSelected: {
    borderColor: BrandColors.blue,
    backgroundColor: '#F0F5FF',
    shadowColor: BrandColors.blue,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: { backgroundColor: BrandColors.blueSoft },
  cardCopy: { flex: 1, marginLeft: 14 },
  cardTitle: { color: BrandColors.textDark, fontSize: 15, fontWeight: '700' },
  cardTitleSelected: { color: BrandColors.blue },
  cardSubtitle: { color: BrandColors.textMuted, fontSize: 13, marginTop: 3 },
  cardSubtitleSelected: { color: BrandColors.blueMuted },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: BrandColors.dotInactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: BrandColors.blue },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: BrandColors.blue },
  loginRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 16 },
  loginPrompt: { color: BrandColors.textSubtle, fontSize: 14 },
  loginLink: { color: BrandColors.blue, fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
});
