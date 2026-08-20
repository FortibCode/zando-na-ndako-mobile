import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeInDown, FadeInUp, FadeInLeft,
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import {
  User, MapPin, CreditCard, Package, Heart, Bell,
  Settings, HelpCircle, LogOut, ChevronRight, Mail, Phone,
  Shield, Gift, Globe2, Users,
} from 'lucide-react-native';
import { BLUE, RED, GREEN } from '@/components/client-ui';
import { useClient } from '@/contexts/client-context';
import { Palette, Spacing, Radii, Shadows } from '@/design/tokens';
import { clearAuthToken, fetchClientCommandes, resolveMediaUrl } from '@/services/api';

const MENU = [
  { icon: User, label: 'Mes informations', route: '/client/my-info', color: BLUE },
  { icon: MapPin, label: 'Adresses de livraison', route: '/client/checkout/address', color: '#7C3AED' },
  { icon: CreditCard, label: 'Moyens de paiement', route: '/client/checkout/payment', color: '#0369A1' },
  { icon: Package, label: 'Mes commandes', route: '/client/(tabs)/orders', color: '#D97706' },
  { icon: Globe2, label: 'Mode Diaspora', route: '/client/diaspora', color: BLUE },
  { icon: Package, label: 'Mes envois', route: '/client/diaspora/shipments', color: '#0369A1' },
  { icon: Users, label: 'Mes bénéficiaires', route: '/client/diaspora/beneficiaries-manage', color: '#7C3AED' },
  { icon: Heart, label: 'Mes favoris', route: '/client/favorites', color: RED },
  { icon: Bell, label: 'Notifications', route: '/client/notifications', color: '#9333EA' },
{ icon: Gift, label: 'Code promo & avantages', route: '/client/promo', color: GREEN },
  { icon: Shield, label: 'Sécurité & confidentialité', route: '/client/security', color: '#1E40AF' },
  { icon: Settings, label: 'Paramètres', route: '/client/settings', color: '#475569' },
  { icon: HelpCircle, label: 'Aide et support', route: '/client/help', color: '#64748B' },
];

function MenuItem({ item, index }: { item: typeof MENU[0]; index: number }) {
  const Icon = item.icon;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeInLeft.duration(350).delay(80 + index * 40).springify()} style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => { if (item.route) router.push(item.route as any); }}
        style={styles.row}
      >
        <View style={[styles.rowIcon, { backgroundColor: item.color + '15' }]}>
          <Icon color={item.color} size={20} />
        </View>
        <Text style={styles.label}>{item.label}</Text>
        <ChevronRight color="#C0CADC" size={18} />
      </Pressable>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const { favorites, currentUser, isDiaspora, refreshUser } = useClient();
  const [ordersCount, setOrdersCount] = useState<number | null>(null);

  // Rafraîchit le profil connecté (détecte correctement le client diaspora)
  useEffect(() => {
    refreshUser();
    fetchClientCommandes().then((list) => setOrdersCount(list.length)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Les items "Mode Diaspora", "Mes envois" et "Mes bénéficiaires" sont réservés aux clients diaspora.
  const visibleMenu = MENU.filter((item) => {
    if (item.label === 'Mode Diaspora' || item.label === 'Mes envois' || item.label === 'Mes bénéficiaires') {
      return isDiaspora;
    }
    return true;
  });

  const initials = currentUser?.nom_complet
    ? currentUser.nom_complet.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
    : 'BO';
  const resolvedPhoto = resolveMediaUrl(currentUser?.photo_profil);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Profile Header Card */}
        <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {resolvedPhoto ? (
                <Image
                  source={{ uri: resolvedPhoto }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  accessibilityLabel="Photo de profil"
                />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
          </View>

          {/* Name & Contact */}
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{currentUser?.nom_complet || 'Client Zando'}</Text>
            <View style={styles.contactRow}>
              <Phone color="#94A3B8" size={13} />
              <Text style={styles.contact}>{currentUser?.telephone || '—'}</Text>
            </View>
            <View style={styles.contactRow}>
              <Mail color="#94A3B8" size={13} />
              <Text style={styles.contact}>{currentUser?.email || '—'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.duration(400).delay(100).springify()} style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{ordersCount === null ? '—' : String(ordersCount)}</Text>
            <Text style={styles.statLabel}>Commandes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{String(favorites.length)}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
        </Animated.View>

{/* Menu Items */}
        <Animated.View entering={FadeInUp.duration(350).delay(150).springify()} style={styles.menuCard}>
          {visibleMenu.map((item, index) => (
            <MenuItem key={item.label} item={item} index={index} />
          ))}
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInUp.duration(400).delay(300).springify()}>
          <Pressable onPress={() => { clearAuthToken(); router.replace('/auth'); }} style={styles.logout}>
            <LogOut color={RED} size={20} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </Pressable>
        </Animated.View>

        {/* Version */}
        <Text style={styles.version}>Zando na Ndako v1.0.0 · © 2024</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.canvas },
  content: { padding: Spacing.xl, paddingTop: Spacing.xl, gap: Radii.md, paddingBottom: 30 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    backgroundColor: Palette.surface, padding: Spacing.xl, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Palette.border, ...Shadows.card,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: Palette.navySoft,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Palette.navy + '30',
  },
  avatarText: { color: Palette.navy, fontSize: 22, fontWeight: '900' },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileInfo: { flex: 1, gap: 4 },
  name: { color: Palette.navy, fontSize: 17.5, fontWeight: '900' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contact: { color: Palette.muted, fontSize: 12.5 },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1, backgroundColor: Palette.surface, borderRadius: Radii.md,
    padding: Radii.md, alignItems: 'center',
    borderWidth: 1, borderColor: Palette.border,
    ...Shadows.soft,
  },
  statValue: { color: Palette.navy, fontSize: 22, fontWeight: '900' },
  statLabel: { color: Palette.muted, fontSize: 11.5, marginTop: 3, fontWeight: '600' },

  menuCard: {
    backgroundColor: Palette.surface, borderRadius: Radii.lg,
    borderWidth: 1, borderColor: Palette.border, overflow: 'hidden',
    ...Shadows.soft,
  },
  row: {
    minHeight: 58, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, gap: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Palette.border,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  label: { color: Palette.ink, fontSize: 14.5, fontWeight: '600', flex: 1 },

  logout: {
    height: 56, borderRadius: Radii.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Palette.coralSoft, backgroundColor: '#FFF5F5',
  },
  logoutText: { color: Palette.coral, fontSize: 16, fontWeight: '800' },

  version: { color: Palette.faint, fontSize: 12, textAlign: 'center', marginTop: 4 },
});
