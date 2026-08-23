import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ArrowLeft, ChevronDown, MessageSquare, Mail,
  Receipt, HelpCircle, ChevronRight, LogOut, Check,
} from 'lucide-react-native';
import { useDiaspora } from '@/contexts/diaspora-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { clearAuthToken } from '@/services/api';

const COUNTRIES = ['France', 'Belgique', 'États-Unis', 'Canada', 'Royaume-Uni', 'Autre'];

function DropdownField({ label, value, options, onSelect }: {
  label: string; value: string; options: string[]; onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  return (
    <View style={styles.block}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Pressable onPress={() => setOpen((o) => !o)} style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
        <Text style={[styles.dropdownValue, { color: colors.text }]}>{value}</Text>
        <ChevronDown color={colors.primary} size={18} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </Pressable>
      {open && (
        <Animated.View entering={FadeInDown.duration(200)} style={[styles.dropdownPanel, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {options.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => { onSelect(opt); setOpen(false); }}
              style={[styles.dropdownOption, { borderBottomColor: colors.border }, opt === value && { backgroundColor: colors.primarySoft }]}
            >
              <Text style={[styles.dropdownOptionText, { color: colors.textSecondary }, opt === value && { color: colors.primary, fontWeight: '800' }]}>{opt}</Text>
              {opt === value && <Check color={colors.primary} size={16} strokeWidth={3} />}
            </Pressable>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

export default function DiasporaSettingsScreen() {
  const { settings, updateSettings } = useDiaspora();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const CURRENCIES: { id: 'EUR' | 'USD'; label: string }[] = [
    { id: 'EUR', label: t('diaspora.settings.currencyEur', 'Euro (€)') },
    { id: 'USD', label: t('diaspora.settings.currencyUsd', 'Dollar US ($)') },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('diaspora.settings.title', 'Paramètres Diaspora')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <DropdownField
            label={t('diaspora.settings.countryLabel', 'Pays de résidence')}
            value={settings.paysResidence}
            options={COUNTRIES}
            onSelect={(v) => updateSettings({ paysResidence: v })}
          />
          <DropdownField
            label={t('diaspora.settings.currencyLabel', 'Devise préférée')}
            value={CURRENCIES.find((c) => c.id === settings.devise)?.label || t('diaspora.settings.currencyEur', 'Euro (€)')}
            options={CURRENCIES.map((c) => c.label)}
            onSelect={(v) => updateSettings({ devise: (CURRENCIES.find((c) => c.label === v)?.id) || 'EUR' })}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(80).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <View style={[styles.switchIcon, { backgroundColor: colors.primarySoft }]}><MessageSquare color={colors.primary} size={18} /></View>
            <Text style={[styles.switchLabel, { color: colors.text }]}>{t('diaspora.settings.smsNotif', 'Notifications par SMS')}</Text>
            <Switch
              value={settings.notifSms}
              onValueChange={(v) => updateSettings({ notifSms: v })}
              trackColor={{ false: colors.border, true: colors.success + '60' }}
              thumbColor={settings.notifSms ? colors.success : colors.textTertiary}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.switchRow}>
            <View style={[styles.switchIcon, { backgroundColor: colors.primarySoft }]}><Mail color={colors.primary} size={18} /></View>
            <Text style={[styles.switchLabel, { color: colors.text }]}>{t('diaspora.settings.emailNotif', 'Notifications par email')}</Text>
            <Switch
              value={settings.notifEmail}
              onValueChange={(v) => updateSettings({ notifEmail: v })}
              trackColor={{ false: colors.border, true: colors.success + '60' }}
              thumbColor={settings.notifEmail ? colors.success : colors.textTertiary}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(160).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            onPress={() => router.push('/client/diaspora/shipments' as any)}
            style={styles.linkRow}
          >
            <View style={[styles.switchIcon, { backgroundColor: colors.primarySoft }]}><Receipt color={colors.primary} size={18} /></View>
            <Text style={[styles.switchLabel, { color: colors.text }]}>{t('diaspora.settings.history', 'Historique des paiements & envois')}</Text>
            <ChevronRight color={colors.textTertiary} size={18} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable onPress={() => router.push('/client/diaspora/about' as any)} style={styles.linkRow}>
            <View style={[styles.switchIcon, { backgroundColor: colors.primarySoft }]}><HelpCircle color={colors.primary} size={18} /></View>
            <Text style={[styles.switchLabel, { color: colors.text }]}>{t('diaspora.settings.helpCenter', "Centre d'aide")}</Text>
            <ChevronRight color={colors.textTertiary} size={18} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(240).springify()}>
          <Pressable
            onPress={() => alert(t('diaspora.settings.logout', 'Déconnexion'), t('diaspora.settings.logoutConfirm', 'Voulez-vous vraiment vous déconnecter ?'), [
              { text: t('common.cancel', 'Annuler'), style: 'cancel' },
              { text: t('diaspora.settings.logout', 'Déconnexion'), style: 'destructive', onPress: () => { clearAuthToken(); router.replace('/auth'); } },
            ])}
            style={[styles.logout, { borderColor: colors.error, backgroundColor: colors.error + '14' }]}
          >
            <LogOut color={colors.error} size={20} />
            <Text style={[styles.logoutText, { color: colors.error }]}>{t('diaspora.settings.logout', 'Déconnexion')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '900' },
  content: { padding: 20, gap: 16, paddingBottom: 30 },

  card: {
    borderRadius: 20, padding: 16,
    borderWidth: 1,
    shadowColor: '#0D1B3E', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
    gap: 4,
  },

  block: { marginBottom: 14 },
  label: { fontSize: 13.5, fontWeight: '800', marginBottom: 8 },
  dropdown: {
    height: 52, borderRadius: 14, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  dropdownValue: { fontSize: 15, fontWeight: '700' },
  dropdownPanel: {
    marginTop: 8, borderRadius: 14, borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownOptionText: { fontSize: 14, fontWeight: '600' },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  switchIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  switchLabel: { fontSize: 14.5, fontWeight: '700', flex: 1 },
  divider: { height: 1 },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },

  logout: {
    height: 56, borderRadius: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1.5,
  },
  logoutText: { fontSize: 16, fontWeight: '800' },
});
