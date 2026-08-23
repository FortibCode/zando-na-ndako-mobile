import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ChevronRight, Clock3, FileText, HelpCircle, Settings, ShieldCheck, Star, Truck, UserRound, Wallet, LogOut } from 'lucide-react-native';
import { Image } from 'expo-image';
import { D, DeliveryScreen, styles } from '@/components/delivery-ui';
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <Animated.View entering={FadeInDown.duration(350).springify()} style={{ backgroundColor: D.blue, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 84, height: 84, borderRadius: 26, backgroundColor: 'rgba(255,255,255,.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,.2)', overflow: 'hidden' }}>
              {resolvedPhoto ? (
                <Image source={{ uri: resolvedPhoto }} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel="Photo de profil" />
              ) : (
                <Text style={{ color: '#FFF', fontSize: 30, fontWeight: '900' }}>{initials}</Text>
              )}
            </View>
            <View style={{ marginLeft: 18, flex: 1 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900' }} numberOfLines={1}>{driverName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isOnline ? '#6DE3C0' : colors.textTertiary }} />
                <Text style={{ color: '#C7D8FF', fontSize: 15 }}>
                  {isOnline ? t('deliveryProfileTab.online', 'En ligne') : t('deliveryProfileTab.offline', 'Hors ligne')} {t('deliveryProfileTab.onlineTodaySuffix', "aujourd'hui")}
                </Text>
              </View>
              <Text style={{ color: '#A8BDF0', fontSize: 13, marginTop: 3 }}>{driverPhone}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ padding: 20, marginTop: -14 }}>
          {/* Rating banner — mène aux vrais avis clients (/livreur/avis) */}
          <Pressable onPress={() => router.push('/delivery/reviews' as any)}>
            <Animated.View entering={FadeInUp.duration(350).delay(60).springify()} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, marginBottom: 16 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Star color={colors.gold} size={24} fill={colors.gold} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={[styles.sectionTitle, { fontSize: 18, color: colors.text }]}>
                    {rating > 0 ? rating.toFixed(1) : '—'}
                  </Text>
                  <Star color={colors.gold} fill={colors.gold} size={16} />
                </View>
                <Text style={[styles.muted, { fontSize: 13, marginTop: 3, color: colors.textSecondary }]}>
                  {t('deliveryProfileTab.avgRating', 'Note moyenne')} · {dashboard?.missions_livrees ?? 0} {t('deliveryProfileTab.deliveriesCompleted', 'livraisons réalisées')}
                </Text>
              </View>
              <ChevronRight color={colors.textTertiary} size={20} />
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
                    padding: 18,
                    borderBottomWidth: i === rows.length - 1 ? 0 : 1,
                    borderBottomColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: r.comingSoon ? 0.55 : 1,
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon color={D.blue} size={21} strokeWidth={2.2} />
                  </View>
                  <Text style={[styles.sectionTitle, { flex: 1, marginLeft: 13, fontSize: 15, color: colors.text }]}>{r.label}</Text>
                  {r.comingSoon ? (
                    <Text style={[styles.muted, { color: colors.textTertiary, fontSize: 11, fontWeight: '800' }]}>{t('deliveryProfileTab.comingSoon', 'BIENTÔT')}</Text>
                  ) : (
                    <>
                      {r.value && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={[styles.muted, { color: colors.textSecondary }]}>{r.value}</Text>
                          {ValueIcon && <ValueIcon color={colors.gold} fill={colors.gold} size={14} />}
                        </View>
                      )}
                      {interactive && <ChevronRight color={colors.textTertiary} size={20} />}
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
                borderColor: colors.error,
                borderRadius: 16,
                minHeight: 58,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 16,
                marginTop: 22,
                flexDirection: 'row',
                gap: 8,
                backgroundColor: colors.surface,
              }}
            >
              <LogOut color={colors.error} size={19} />
              <Text style={{ color: colors.error, fontSize: 16, fontWeight: '800' }}>{t('deliveryProfileTab.logout', 'Se déconnecter')}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </DeliveryScreen>
  );
}
