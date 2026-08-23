import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ArrowLeft, MessageCircle, Phone, Mail, HelpCircle, ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

export default function HelpScreen() {
const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const FAQ_ITEMS = [
    { q: t('helpFaq.q1', 'Comment passer une commande ?'), a: t('helpFaq.a1', 'Ajoutez des produits au panier puis validez en choisissant votre adresse de livraison, un créneau horaire et un moyen de paiement.') },
    { q: t('helpFaq.q2', 'Quels sont les délais de livraison ?'), a: t('helpFaq.a2', 'La livraison se fait généralement en 30 à 60 minutes sur Brazzaville, selon le créneau choisi.') },
    { q: t('helpFaq.q3', 'Comment suivre ma commande ?'), a: t('helpFaq.a3', 'Rendez-vous dans l\'onglet « Mes commandes » puis cliquez sur « Suivre » pour voir la position du livreur en temps réel.') },
    { q: t('helpFaq.q4', 'Quels moyens de paiement acceptez-vous ?'), a: t('helpFaq.a4', 'Airtel Money, MTN Mobile Money, carte bancaire et paiement à la livraison.') },
    { q: t('helpFaq.q5', 'Comment annuler ma commande ?'), a: t('helpFaq.a5', 'Vous pouvez annuler votre commande depuis le suivi, tant que le livreur n\'est pas en route.') },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primaryLight }]}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: colors.primary }]}>{t('help.title', 'Aide et support')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('help.howCanWeHelp', 'Comment pouvons-nous vous aider ?')}</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact buttons */}
        <Animated.View entering={FadeInUp.duration(350).delay(80).springify()} style={styles.contactRow}>
          <Pressable
            onPress={() => Linking.openURL('tel:+242060000000')}
            style={[styles.contactBtn, { backgroundColor: colors.success + '15', borderColor: colors.success + '40' }]}
          >
            <Phone color={colors.success} size={22} />
            <Text style={[styles.contactText, { color: colors.success }]}>{t('helpFaq.call', 'Appeler')}</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL('mailto:support@zandonandako.cg')}
            style={[styles.contactBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}
          >
            <Mail color={colors.primary} size={22} />
            <Text style={[styles.contactText, { color: colors.primary }]}>{t('helpFaq.email', 'Email')}</Text>
          </Pressable>
          <Pressable
            onPress={() => alert(t('helpFaq.chat', 'Chat'), t('helpFaq.chatComingSoon', 'Le chat en direct sera bientôt disponible. Contactez-nous par téléphone ou email en attendant.'))}
            style={[styles.contactBtn, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}
          >
            <MessageCircle color={colors.error} size={22} />
            <Text style={[styles.contactText, { color: colors.error }]}>{t('helpFaq.chat', 'Chat')}</Text>
          </Pressable>
        </Animated.View>

        {/* FAQ */}
        <Animated.View entering={FadeInUp.duration(350).delay(140).springify()}>
          <View style={[styles.faqHeader, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <HelpCircle color={colors.primary} size={20} />
            <Text style={[styles.faqTitle, { color: colors.primary }]}>{t('help.faq', 'Questions fréquentes')}</Text>
          </View>
        </Animated.View>

        {FAQ_ITEMS.map((item, i) => (
          <Animated.View key={i} entering={FadeInUp.duration(350).delay(180 + i * 60).springify()}>
            <Pressable style={[styles.faqItem, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.faqQ, { color: colors.primary }]}>{item.q}</Text>
              <Text style={[styles.faqA, { color: colors.textSecondary }]}>{item.a}</Text>
            </Pressable>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInUp.duration(350).delay(500).springify()}>
          <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.contactTitleRow}>
              <Phone color={colors.primary} size={15} />
              <Text style={[styles.contactTitle, { color: colors.primary }]}>{t('helpFaq.supportClient', 'Support client')}</Text>
            </View>
            <Text style={[styles.contactLine, { color: colors.textSecondary }]}>+242 06 000 00 00</Text>
            <Text style={[styles.contactLine, { color: colors.textSecondary }]}>support@zandonandako.cg</Text>
            <Text style={[styles.contactHours, { color: colors.textTertiary }]}>{t('helpFaq.hours', 'Lun–Dim · 7h–21h')}</Text>
          </View>
        </Animated.View>
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
  content: { padding: 20, gap: 12, paddingBottom: 30 },

  contactRow: { flexDirection: 'row', gap: 10 },
  contactBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  contactText: { fontSize: 12, fontWeight: '800' },

  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  faqTitle: { fontSize: 15, fontWeight: '800' },
  faqItem: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  faqQ: { fontSize: 14.5, fontWeight: '800' },
  faqA: { fontSize: 13, lineHeight: 19, marginTop: 6 },

  contactCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 8,
  },
  contactTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  contactTitle: { fontSize: 15, fontWeight: '800' },
  contactLine: { fontSize: 13.5, marginTop: 2 },
  contactHours: { fontSize: 12, marginTop: 6 },
});
