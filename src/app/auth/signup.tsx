import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthBrand, BackButton, PrimaryButton, authStyles } from '@/components/auth-ui';
import { BrandColors } from '@/constants/brand';

type AccountType = 'local_client' | 'overseas_client' | 'vendor' | 'delivery';

type AccountOption = {
  id: AccountType;
  title: string;
  subtitle: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
};

const ACCOUNT_OPTIONS: AccountOption[] = [
  {
    id: 'local_client',
    title: 'Client Local',
    subtitle: 'Achats au marché local & livraison à domicile',
    badge: 'Populaire',
    badgeBg: '#DBEAFE',
    badgeColor: '#1E40AF',
    icon: 'cart-outline',
    iconColor: BrandColors.blueBright,
    iconBg: '#EFF6FF',
  },
  {
    id: 'overseas_client',
    title: 'Client Diaspora',
    subtitle: 'Achats & cadeaux pour la famille depuis l’étranger',
    badge: 'International',
    badgeBg: '#D1FAE5',
    badgeColor: '#065F46',
    icon: 'globe-outline',
    iconColor: BrandColors.green,
    iconBg: '#ECFDF5',
  },
  {
    id: 'vendor',
    title: 'Vendeur / Commerçant',
    subtitle: 'Vendez vos produits sur la marketplace Zando',
    badge: 'Partenaire',
    badgeBg: '#FEE2E2',
    badgeColor: '#991B1B',
    icon: 'storefront-outline',
    iconColor: BrandColors.red,
    iconBg: '#FEF2F2',
  },
  {
    id: 'delivery',
    title: 'Livreur Indépendant',
    subtitle: 'Réalisez des livraisons et gagnez des revenus',
    badge: 'Opportunité',
    badgeBg: '#FEF3C7',
    badgeColor: '#92400E',
    icon: 'bicycle-outline',
    iconColor: BrandColors.yellow,
    iconBg: '#FFFBEB',
  },
];

function AccountTypeCard({
  option,
  selected,
  onPress,
}: {
  option: AccountOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.optionCard, selected && styles.optionCardSelected]}
    >
      <View style={[styles.optionIcon, { backgroundColor: option.iconBg }]}>
        <Ionicons color={option.iconColor} name={option.icon} size={24} />
      </View>
      <View style={styles.optionCopy}>
        <View style={styles.titleRow}>
          <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
            {option.title}
          </Text>
          {Boolean(option.badge) && (
            <View style={[styles.badge, { backgroundColor: option.badgeBg }]}>
              <Text style={[styles.badgeText, { color: option.badgeColor }]}>{option.badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
      </View>
      <Ionicons
        color={selected ? BrandColors.blueBright : '#94A3B8'}
        name={selected ? 'checkmark-circle' : 'chevron-forward'}
        size={22}
      />
    </Pressable>
  );
}

/** Choix du type de compte lors de l'inscription. */
export default function SignupAccountTypeScreen() {
  const [selectedType, setSelectedType] = useState<AccountType>('local_client');

  const handleContinue = () => {
    if (selectedType === 'local_client') {
      router.push('/auth/signup/local/method');
    }
    if (selectedType === 'overseas_client') {
      router.push('/auth/signup/overseas/method' as any);
    }
    if (selectedType === 'vendor') {
      router.push('/auth/signup/vendor/method' as any);
    }
    if (selectedType === 'delivery') {
      router.push('/auth/signup/delivery/method' as any);
    }
  };

  return (
    <SafeAreaView style={authStyles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <BackButton />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AuthBrand compact />
        <Text style={styles.title}>Choisissez votre profil</Text>
        <Text style={styles.subtitle}>
          Sélectionnez le type de compte correspondant à vos besoins sur Zando na Ndako.
        </Text>
        <View style={styles.options}>
          {ACCOUNT_OPTIONS.map((option) => (
            <AccountTypeCard
              key={option.id}
              option={option}
              selected={selectedType === option.id}
              onPress={() => setSelectedType(option.id)}
            />
          ))}
        </View>

        <PrimaryButton 
          icon="arrow-forward"
          onPress={handleContinue}
          title="Continuer la création du compte"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 8 },
  content: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 36, alignItems: 'center' },
  title: {
    color: BrandColors.blue,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  options: { width: '100%', gap: 12, marginBottom: 12 },
  optionCard: {
    width: '100%',
    minHeight: 84,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: BrandColors.border,
    backgroundColor: BrandColors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: BrandColors.shadowColor,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: BrandColors.blueBright,
    backgroundColor: '#EFF6FF',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: { flex: 1, marginLeft: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  optionTitle: { color: BrandColors.textDark, fontSize: 16, fontWeight: '700' },
  optionTitleSelected: { color: BrandColors.blueBright, fontWeight: '800' },
  optionSubtitle: { color: '#64748B', fontSize: 13, marginTop: 2, lineHeight: 18 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '800' },
});
