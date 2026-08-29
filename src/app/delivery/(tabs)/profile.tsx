import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ChevronRight, Clock3, FileText, HelpCircle, Settings, ShieldCheck, Star, Truck, UserRound, Wallet, LogOut } from 'lucide-react-native';
import { Image } from 'expo-image';
import { D, DeliveryScreen, TAB_BAR_CLEARANCE, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { DashboardSkeleton } from '@/components/delivery/skeleton-loader';
import { resolveMediaUrl } from '@/services/api';

export default function Profile() {
  const { driver, dashboard, dashboardLoading } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();

  if (dashboardLoading && !driver) {
    return (
      <DeliveryScreen scroll={false}>
        <DashboardSkeleton />
      </DeliveryScreen>
    );
  }

  const driverName = driver ? `${driver.prenom ?? ''} ${driver.nom ?? ''}`.trim() || t('deliveryUi.defaultDriverName', 'Livreur') : t('deliveryUi.defaultDriverName', 'Livreur');
  const initials = driverName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'L';
  const driverPhone = driver?.telephone ?? '—';
  const resolvedPhoto = resolveMediaUrl(driver?.photo_profil);
  const vehicleType = driver?.type_vehicule ?? t('deliveryProfileTab.defaultVehicle', 'Moto');
  const rating = driver?.note_moyenne ?? 0;
  const isOnline = driver?.statut_disponibilite === 'disponible';

  const rows: { icon: any; label: string; value?: string; valueIcon?: any; path?: string; comingSoon?: boolean }[] = [
    { icon: UserRound, label: t('deliveryProfileTab.myInfo', 'Mes informations'), path: '/delivery/profile-info' },
    { icon: Truck, label: t('deliveryProfileTab.vehicle', 'Véhicule'), value: vehicleType },
    { icon: FileText, label: t('deliveryProfileTab.documents', 'Documents'), path: '/delivery/documents' },
    { icon: Clock3, label: t('deliveryProfileTab.history', 'Historique'), path: '/delivery/history' },
    { icon: Wallet, label: t('deliveryProfileTab.statistics', 'Statistiques'), path: '/delivery/(tabs)/revenue' },
    { icon: Star, label: t('deliveryProfileTab.myRating', 'Ma note'), value: rating > 0 ? rating.toFixed(1) : '—', valueIcon: Star, path: '/delivery/reviews' },
    { icon: Settings, label: t('deliveryProfileTab.settings', 'Paramètres'), comingSoon: true },
    { icon: HelpCircle, label: t('deliveryProfileTab.helpSupport', 'Aide et support'), path: '/delivery/support' },
    { icon: ShieldCheck, label: t('deliveryProfileTab.security', 'Sécurité'), comingSoon: true },
  ];

  return (
    <DeliveryScreen scroll={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }}>
        <Animated.View entering={FadeInDown.duration(350).springify()} style={{ backgroundColor: colors.primaryDeep, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 30 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 76, height: 76, borderRadius: 24, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.25)', overflow: 'hidden' }}>
              {resolvedPhoto ? (
                <Image source={{ uri: resolvedPhoto }} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel="Photo de profil" />
              ) : (
                <Text style={{ color: '#FFF', fontSize: 28, fontWeight: '900' }}>{initials}</Text>
              )}
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '900' }} numberOfLines={1}>{driverName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isOnline ? '#34D399' : colors.textTertiary }} />
                <Text style={{ color: '#C7D8FF', fontSize: 13.5, fontWeight: '600' }}>
                  {isOnline ? t('deliveryProfileTab.online', 'En ligne') : t('deliveryProfileTab.offline', 'Hors ligne')}
                </Text>
              </View>
              <Text style={{ color: '#94A3B8', fontSize: 12.5, marginTop: 2 }}>{driverPhone}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ paddingHorizontal: 18, marginTop: -12 }}>
          {/* Rating banner */}
          <Pressable onPress={() => router.push('/delivery/reviews' as any)}>
            <Animated.View entering={FadeInUp.duration(350).delay(60).springify()} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, marginBottom: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Star color={colors.gold} size={22} fill={colors.gold} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={[styles.sectionTitle, { fontSize: 17, color: colors.text }]}>
                    {rating > 0 ? rating.toFixed(1) : '—'}
                  </Text>
                  <Star color={colors.gold} fill={colors.gold} size={15} />
                </View>
                <Text style={[styles.muted, { fontSize: 12, marginTop: 2, color: colors.textSecondary }]}>
                  {t('deliveryProfileTab.avgRating', 'Note moyenne')} · {dashboard?.missions_livrees ?? 0} {t('deliveryProfileTab.deliveriesCompleted', 'livraisons réalisées')}
                </Text>
              </View>
              <ChevronRight color={colors.textTertiary} size={18} />
            </Animated.View>
          </Pressable>

          <Animated.View
            entering={FadeInUp.duration(350).delay(120).springify()}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {rows.map((r, i) => {
              const Icon = r.icon;
              const ValueIcon = r.valueIcon;
              const interactive = Boolean(r.path);
              return (
                <Pressable
                  key={r.label}
                  disabled={!interactive}
                  onPress={() => r.path && router.push(r.path as any)}
                  style={{
                    padding: 15,
                    borderBottomWidth: i === rows.length - 1 ? 0 : 1,
                    borderBottomColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: r.comingSoon ? 0.55 : 1,
                  }}
                >
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon color={D.blue} size={19} strokeWidth={2.2} />
                  </View>
                  <Text style={[styles.sectionTitle, { flex: 1, marginLeft: 12, fontSize: 14.5, color: colors.text }]}>{r.label}</Text>
                  {r.comingSoon ? (
                    <Text style={[styles.muted, { color: colors.textTertiary, fontSize: 10.5, fontWeight: '800' }]}>{t('deliveryProfileTab.comingSoon', 'BIENTÔT')}</Text>
                  ) : (
                    <>
                      {r.value && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={[styles.muted, { color: colors.textSecondary, fontSize: 13 }]}>{r.value}</Text>
                          {ValueIcon && <ValueIcon color={colors.gold} fill={colors.gold} size={13} />}
                        </View>
                      )}
                      {interactive && <ChevronRight color={colors.textTertiary} size={18} />}
                    </>
                  )}
                </Pressable>
              );
            })}
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(350).delay(180).springify()}>
            <Pressable
              onPress={() => router.push('/delivery/logout' as any)}
              style={{
                borderWidth: 1.5,
                borderColor: colors.error + '50',
                borderRadius: 16,
                minHeight: 52,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 16,
                marginTop: 18,
                flexDirection: 'row',
                gap: 8,
                backgroundColor: colors.error + '0A',
              }}
            >
              <LogOut color={colors.error} size={18} strokeWidth={2.2} />
              <Text style={{ color: colors.error, fontSize: 15, fontWeight: '800' }}>{t('deliveryProfileTab.logout', 'Se déconnecter')}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </DeliveryScreen>
  );
}
