import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeInLeft } from 'react-native-reanimated';
import {
  Star, User, Settings, Bell, Lock, ChevronRight, LogOut,
  Clock, Store, Tag, FileCheck, MessageSquareText, Headset, Wallet,
} from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { clearAuthToken } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

function MenuRow({ icon: Icon, label, onPress, index, colors }: { icon: any; label: string; onPress?: () => void; index: number; colors: any }) {
  return (
    <Animated.View entering={FadeInLeft.duration(320).delay(60 + index * 40).springify()}>
      <Pressable onPress={onPress} style={[styles.row, { borderBottomColor: colors.border }]}>
        <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
          <Icon color={colors.primary} size={18} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
        <ChevronRight color={colors.textTertiary} size={18} />
      </Pressable>
    </Animated.View>
  );
}

export default function VendorProfileScreen() {
  const { boutique, vendorFirstName, documents } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [showGoodbye, setShowGoodbye] = useState(false);

  // Vraie photo de la boutique si le vendeur en a envoyé une (voir vendor/profile-info.tsx) —
  // avant ce correctif, l'avatar affichait toujours l'emoji dérivé du type de commerce, même
  // avec une photo réellement enregistrée en base.
  const boutiquePhotoUrl = documents.find((d) => d.id === 'photo_boutique')?.url;

  const ACCOUNT_MENU = [
    { icon: User, label: t('vendorProfile.personalInfo', 'Informations personnelles'), route: '/vendor/profile-info' },
    { icon: Wallet, label: t('vendorProfile.paymentInfo', 'Coordonnées de paiement'), route: '/vendor/banking' },
    { icon: Settings, label: t('vendorProfile.storeStatus', 'Statut de la boutique'), route: '/vendor/settings/status' },
    { icon: Bell, label: t('vendorProfile.notifications', 'Notifications'), route: '/vendor/notifications' },
    { icon: Lock, label: t('vendorProfile.changePasswordLabel', 'Changer le mot de passe'), route: '/vendor/change-password' },
  ] as const;

  const STORE_MENU = [
    { icon: Store, label: t('vendorProfile.storeStatus', 'Statut de la boutique'), route: '/vendor/settings/status' },
    { icon: Clock, label: t('vendorProfile.openingHours', "Horaires d'ouverture"), route: '/vendor/settings/hours' },
    { icon: Tag, label: t('vendorProfile.myPromotions', 'Mes promotions'), route: '/vendor/promotions' },
    { icon: MessageSquareText, label: t('vendorProfile.customerReviews', 'Avis clients'), route: '/vendor/reviews' },
    { icon: FileCheck, label: t('vendorProfile.documents', 'Documents'), route: '/vendor/documents' },
    { icon: Headset, label: t('vendorProfile.support', 'Support Zando na Ndako'), route: '/vendor/support' },
  ] as const;

  const handleLogout = () => {
    alert(t('vendorProfile.logoutConfirmTitle', 'Se déconnecter'), t('vendorProfile.logoutConfirmDesc', 'Voulez-vous vraiment vous déconnecter ?'), [
      { text: t('vendorProfile.cancel', 'Annuler'), style: 'cancel' },
      { text: t('vendorProfile.logout', 'Se déconnecter'), style: 'destructive', onPress: () => setShowGoodbye(true) },
    ]);
  };

  if (showGoodbye) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Animated.View entering={FadeIn.duration(500)} style={styles.goodbyeWrap}>
          <Text style={styles.goodbyeEmoji}>🏪</Text>
          <Text style={[styles.goodbyeTitle, { color: colors.text }]}>{t('vendorProfile.goodbyeTitle', 'À bientôt !')}</Text>
          <Text style={[styles.goodbyeSub, { color: colors.textSecondary }]}>
            {t('vendorProfile.goodbyeThanks', "Merci d'utiliser")} <Text style={{ fontWeight: '900' }}>Zando na Ndako</Text>{'\n'}{t('vendorProfile.goodbyeSub', 'Bonne continuation 👋')}
          </Text>
<Pressable onPress={() => { clearAuthToken(); router.replace('/auth'); }} style={[styles.goodbyeBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <Text style={[styles.goodbyeBtnText, { color: colors.white }]}>{t('vendorProfile.logout', 'Se déconnecter')}</Text>
          </Pressable>
          <Pressable onPress={() => setShowGoodbye(false)} style={[styles.goodbyeCancel, { borderColor: colors.borderStrong }]}>
            <Text style={[styles.goodbyeCancelText, { color: colors.primary }]}>{t('vendorProfile.cancel', 'Annuler')}</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400).springify()} style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
            {boutiquePhotoUrl ? (
              <Image source={{ uri: boutiquePhotoUrl }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Text style={styles.avatarEmoji}>{boutique.emoji}</Text>
            )}
          </View>
{/* Type de commerce réel choisi à l'inscription (vendeurs.categorie_principale) — remplace
              l'ancien texte fixe "Poissonnerie" affiché à tous les vendeurs quel que soit leur
              commerce réel. */}
<Text style={[styles.storeType, { color: colors.white + 'CC' }]}>{boutique.categoriePrincipale || t('vendorProfile.storeType', 'Commerce')}</Text>
          <Text style={[styles.storeName, { color: colors.white }]}>{vendorFirstName}</Text>
          <View style={styles.ratingRow}>
            <Star color={colors.gold} fill={colors.gold} size={16} />
            <Text style={[styles.ratingText, { color: colors.white }]}>{boutique.note.toFixed(1).replace('.', ',')} ({boutique.avisCount} {t('vendorProfile.reviewsSuffix', 'avis')})</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(100).springify()} style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          {ACCOUNT_MENU.map((item, index) => (
            <MenuRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              index={index}
              colors={colors}
              onPress={() => item.route && router.push(item.route as any)}
            />
          ))}
        </Animated.View>

        <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('vendorProfile.storeManagement', 'GESTION BOUTIQUE')}</Text>
        <Animated.View entering={FadeInUp.duration(400).delay(200).springify()} style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          {STORE_MENU.map((item, index) => (
            <MenuRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              index={index + 5}
              colors={colors}
              onPress={() => router.push(item.route as any)}
            />
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(320).springify()}>
<Pressable onPress={handleLogout} style={[styles.logout, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <LogOut color={colors.white} size={18} />
            <Text style={[styles.logoutText, { color: colors.white }]}>{t('vendorProfile.logout', 'Se déconnecter')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 30 },

  hero: {
    alignItems: 'center', paddingTop: 32, paddingBottom: 30,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
avatar: {
    width: 84, height: 84, borderRadius: 42, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarImg: { width: 84, height: 84 },
  avatarEmoji: { fontSize: 42 },
  storeType: { fontSize: 13, fontWeight: '600' },
  storeName: { fontSize: 22, fontWeight: '900', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  ratingText: { fontSize: 13.5, fontWeight: '700' },

  sectionLabel: {
    fontSize: 11, fontWeight: '900', letterSpacing: 1,
    marginTop: 20, marginBottom: 8, marginHorizontal: 20,
  },
menuCard: {
    marginHorizontal: 20, borderRadius: 20,
    borderWidth: 1, overflow: 'hidden',
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    marginTop: 18,
  },
  row: {
    minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, borderBottomWidth: 1,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '600', flex: 1 },

  logout: {
    marginHorizontal: 20, marginTop: 24, height: 56, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
logoutText: { fontSize: 16, fontWeight: '800' },

  goodbyeWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  goodbyeEmoji: { fontSize: 90 },
  goodbyeTitle: { fontSize: 26, fontWeight: '900' },
  goodbyeSub: { fontSize: 14.5, textAlign: 'center', lineHeight: 22 },
  goodbyeBtn: {
    width: '100%', height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginTop: 10,
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
goodbyeBtnText: { fontSize: 16, fontWeight: '900' },
goodbyeCancel: { width: '100%', height: 54, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 18 },
  goodbyeCancelText: { fontSize: 15, fontWeight: '800' },
});

