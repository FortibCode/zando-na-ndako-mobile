import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ArrowLeft, Moon, Sun, Monitor, Globe, Coins,
  Bell, Shield, Info, ChevronRight,
} from 'lucide-react-native';
import { BLUE, RED } from '@/components/client-ui';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { useCurrency, type Currency } from '@/hooks/use-currency';
import type { Language } from '@/i18n/translations';

type ThemeMode = 'light' | 'dark' | 'system';

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

export default function SettingsScreen() {
const { mode, setMode, colors, isDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();

  const themeOptions: { id: ThemeMode; label: string; icon: any }[] = [
    { id: 'light', label: t('settings.light', 'Clair'), icon: Sun },
    { id: 'dark', label: t('settings.dark', 'Sombre'), icon: Moon },
    { id: 'system', label: t('settings.system', 'Système'), icon: Monitor },
  ];

  const languageOptions: { id: Language; label: string }[] = [
    { id: 'fr', label: 'Français' },
    { id: 'lingala', label: 'Lingala' },
    { id: 'kituba', label: 'Kituba' },
    { id: 'en', label: 'English' },
  ];

  const currencyOptions: { id: Currency; label: string }[] = [
    { id: 'FCFA', label: t('currency.fcfa', 'Franc CFA (FCFA)') },
    { id: 'USD', label: t('currency.usd', 'Dollar US ($)') },
    { id: 'EUR', label: t('currency.eur', 'Euro (€)') },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
<StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primaryLight }]}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.primary }]}>{t('settings.title', 'Paramètres')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Préférences de l'application</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Apparence */}
        <Animated.View entering={FadeInUp.duration(350).delay(80).springify()}>
          <SectionLabel text={t('settings.appearance', 'Apparence')} />
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: colors.primaryLight }]}>
                {mode === 'dark' ? <Moon color={colors.primary} size={18} /> : mode === 'system' ? <Monitor color={colors.primary} size={18} /> : <Sun color={colors.primary} size={18} />}
              </View>
              <Text style={[styles.cardTitle, { color: colors.primary }]}>{t('settings.theme', 'Thème')}</Text>
            </View>
            <View style={styles.optionRow}>
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const selected = mode === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setMode(opt.id)}
                    style={[styles.optionChip, { borderColor: selected ? colors.primary : colors.surfaceBorder, backgroundColor: selected ? colors.primaryLight : colors.surface }]}
                  >
                    <Icon color={selected ? colors.primary : colors.textSecondary} size={18} />
                    <Text style={[styles.optionChipText, { color: selected ? colors.primary : colors.textSecondary }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Langue */}
        <Animated.View entering={FadeInUp.duration(350).delay(140).springify()}>
          <SectionLabel text={t('settings.language', 'Langue')} />
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: colors.primaryLight }]}>
                <Globe color={colors.primary} size={18} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.primary }]}>{t('settings.language', 'Langue')}</Text>
            </View>
            <View style={styles.optionRow}>
              {languageOptions.map((opt) => {
                const selected = language === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setLanguage(opt.id)}
                    style={[styles.optionChip, { borderColor: selected ? colors.primary : colors.surfaceBorder, backgroundColor: selected ? colors.primaryLight : colors.surface }]}
                  >
                    <Text style={[styles.optionChipText, { color: selected ? colors.primary : colors.textSecondary }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Devise */}
        <Animated.View entering={FadeInUp.duration(350).delay(200).springify()}>
          <SectionLabel text={t('settings.currency', 'Devise')} />
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: colors.primaryLight }]}>
                <Coins color={colors.primary} size={18} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.primary }]}>{t('settings.currency', 'Devise')}</Text>
            </View>
            <View style={styles.optionRow}>
              {currencyOptions.map((opt) => {
                const selected = currency === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setCurrency(opt.id)}
                    style={[styles.optionChip, { borderColor: selected ? colors.primary : colors.surfaceBorder, backgroundColor: selected ? colors.primaryLight : colors.surface }]}
                  >
                    <Text style={[styles.optionChipText, { color: selected ? colors.primary : colors.textSecondary }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* Notifications */}
        <Animated.View entering={FadeInUp.duration(350).delay(260).springify()}>
          <SectionLabel text={t('settings.notificationsTitle', 'Notifications')} />
          <Pressable
            onPress={() => router.push('/client/notifications' as any)}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
              <Bell color={colors.primary} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowText, { color: colors.primary }]}>{t('settings.notificationsTitle', 'Notifications')}</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{t('settings.notificationsSub', 'Gérer vos préférences')}</Text>
            </View>
            <ChevronRight color={colors.textTertiary} size={18} />
          </Pressable>
        </Animated.View>

        {/* Sécurité */}
        <Animated.View entering={FadeInUp.duration(350).delay(320).springify()}>
          <SectionLabel text={t('security.title', 'Sécurité')} />
          <Pressable
            onPress={() => router.push('/client/security' as any)}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
              <Shield color={colors.primary} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowText, { color: colors.primary }]}>{t('security.title', 'Sécurité & confidentialité')}</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Mot de passe, données, compte</Text>
            </View>
            <ChevronRight color={colors.textTertiary} size={18} />
          </Pressable>
        </Animated.View>

        {/* À propos */}
        <Animated.View entering={FadeInUp.duration(350).delay(380).springify()}>
          <SectionLabel text={t('settings.about', 'À propos')} />
          <Pressable
            onPress={() => router.push('/client/help' as any)}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
              <Info color={colors.primary} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowText, { color: colors.primary }]}>{t('settings.about', 'À propos')}</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Zando na Ndako · {t('settings.version', 'Version')} 1.0.0</Text>
            </View>
            <ChevronRight color={colors.textTertiary} size={18} />
          </Pressable>
        </Animated.View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { fontSize: 12.5, marginTop: 2 },
  content: { padding: 20, gap: 6, paddingBottom: 30 },

  sectionLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
    marginLeft: 4,
  },

  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '800' },

  optionRow: { flexDirection: 'row', gap: 8 },
  optionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionChipText: { fontSize: 12.5, fontWeight: '700' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { fontSize: 14.5, fontWeight: '800' },
  rowSub: { fontSize: 12, marginTop: 2 },
});
