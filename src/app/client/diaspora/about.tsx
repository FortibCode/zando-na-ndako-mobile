import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ArrowLeft, Users, Coins, ShieldCheck, MessageSquare, Radar, FileText, Share2,
  Lock, KeyRound, UserCheck, HelpCircle, Phone, Mail, MessageCircle,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import type { ThemeColors } from '@/design/theme';

function InfoSection({
  title, items, tint, iconBg, delay, colors,
}: {
  title: string;
  items: { icon: any; text: string }[];
  tint: string;
  iconBg: string;
  delay: number;
  colors: ThemeColors;
}) {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay).springify()} style={[styles.section, { backgroundColor: tint, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>{title}</Text>
      {items.map(({ icon: Icon, text }, i) => (
        <View key={text} style={[styles.itemRow, i < items.length - 1 && [styles.itemRowBorder, { borderBottomColor: colors.border }]]}>
          <View style={[styles.itemIcon, { backgroundColor: iconBg }]}>
            <Icon color={colors.primary} size={16} />
          </View>
          <Text style={[styles.itemText, { color: colors.text }]}>{text}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

export default function DiasporaAboutScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const MANAGEMENT = [
    { icon: Users, text: t('diaspora.about.management1', 'Gestion de bénéficiaires multiples') },
    { icon: Coins, text: t('diaspora.about.management2', 'Affichage double devise (FCFA / € ou $)') },
    { icon: ShieldCheck, text: t('diaspora.about.management3', 'Paiement international sécurisé') },
    { icon: MessageSquare, text: t('diaspora.about.management4', 'SMS automatique au bénéficiaire') },
    { icon: Radar, text: t('diaspora.about.management5', 'Suivi partagé en temps réel') },
    { icon: FileText, text: t('diaspora.about.management6', 'Historique complet des envois') },
    { icon: Share2, text: t('diaspora.about.management7', 'Partage de panier avant validation') },
  ];

  const SECURITY = [
    { icon: ShieldCheck, text: t('diaspora.about.security1', 'Paiements 100% sécurisés (Stripe, PayPal, Mobile Money International)') },
    { icon: Lock, text: t('diaspora.about.security2', 'Protection des données personnelles') },
    { icon: KeyRound, text: t('diaspora.about.security3', 'Transactions chiffrées (SSL / TLS)') },
    { icon: UserCheck, text: t('diaspora.about.security4', 'Support client dédié Diaspora') },
  ];

  const SUPPORT = [
    { icon: HelpCircle, label: t('diaspora.about.faqLabel', 'FAQ Diaspora'), action: () => Alert.alert(t('diaspora.about.faqLabel', 'FAQ Diaspora'), t('diaspora.about.faqAlertDesc', 'La FAQ dédiée sera bientôt disponible. En attendant, contactez-nous via WhatsApp, email ou téléphone.')) },
    { icon: MessageCircle, label: t('diaspora.about.whatsappLabel', 'Contact WhatsApp'), action: () => Linking.openURL('https://wa.me/242060000000') },
    { icon: Mail, label: t('diaspora.about.emailLabel', 'Email : support@zandonandako.com'), action: () => Linking.openURL('mailto:support@zandonandako.com') },
    { icon: Phone, label: t('diaspora.about.phoneLabel', 'Téléphone : +242 06 000 00 00'), action: () => Linking.openURL('tel:+242060000000') },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.primary }]}>{t('diaspora.about.title', 'Mode Diaspora')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <InfoSection
          title={t('diaspora.about.managementTitle', 'GESTION DE VOS ENVOIS')}
          items={MANAGEMENT}
          tint={colors.surface}
          iconBg={colors.primarySoft}
          delay={60}
          colors={colors}
        />

        <InfoSection
          title={t('diaspora.about.securityTitle', 'SÉCURITÉ ET CONFIANCE')}
          items={SECURITY}
          tint={colors.freshSoft}
          iconBg={colors.freshSoft}
          delay={160}
          colors={colors}
        />

        <Animated.View entering={FadeInUp.duration(400).delay(260).springify()} style={[styles.section, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('diaspora.about.supportTitle', 'SUPPORT DISPONIBLE')}</Text>
          {SUPPORT.map(({ icon: Icon, label, action }, i) => (
            <Pressable
              key={label}
              onPress={action}
              style={[styles.itemRow, i < SUPPORT.length - 1 && [styles.itemRowBorder, { borderBottomColor: colors.border }]]}
            >
              <View style={[styles.itemIcon, { backgroundColor: colors.surface }]}>
                <Icon color={colors.primary} size={16} />
              </View>
              <Text style={[styles.itemText, { color: colors.text }]}>{label}</Text>
            </Pressable>
          ))}
          <Text style={[styles.helpTagline, { color: colors.primary }]}>{t('diaspora.about.helpTagline', 'Nous sommes là pour vous aider !')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(340).springify()}>
          <Pressable onPress={() => router.push('/client/diaspora' as any)} style={[styles.cta, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <Text style={[styles.ctaText, { color: colors.textInverse }]}>{t('diaspora.about.cta', 'Commencer un envoi')}</Text>
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
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '900' },
  content: { padding: 20, gap: 16, paddingBottom: 30 },

  section: {
    borderRadius: 20, padding: 18,
    borderWidth: 1,
    shadowColor: '#0D1B3E', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.6, marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  itemRowBorder: { borderBottomWidth: 1 },
  itemIcon: {
    width: 34, height: 34, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  itemText: { fontSize: 13.5, fontWeight: '600', flex: 1, lineHeight: 19 },
  helpTagline: { fontSize: 14, fontWeight: '900', textAlign: 'center', marginTop: 8 },

  cta: {
    height: 58, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  ctaText: { fontSize: 16, fontWeight: '900' },
});
