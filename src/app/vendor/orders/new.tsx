import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { ArrowLeft, User, MapPin, Clock, PackageX } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewOrderScreen() {
  const { orders } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const order = orders.find((o) => o.statut === 'en_attente') || orders[0] || null;
  const produits = order?.produits || [];
  const total = produits.reduce((sum, p) => sum + p.prix, 0);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/vendor/(tabs)' as any);
    }
  };

  if (!order) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.header}>
          <Pressable onPress={handleBack} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]} hitSlop={10}>
            <ArrowLeft color={colors.primary} size={22} />
          </Pressable>
        </Animated.View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Animated.View entering={ZoomIn.duration(400).springify()} style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.primarySoft }]}>
              <PackageX color={colors.primary} size={36} />
            </View>
            <Text style={[styles.title, { color: colors.text, fontSize: 20 }]}>{t('vendorNewOrder.emptyTitle', 'Aucune commande')}</Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 20 }}>
              {t('vendorNewOrder.emptyDesc', 'Vous n\'avez aucune nouvelle commande en attente pour le moment.')}
            </Text>
            <Pressable onPress={handleBack} style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>{t('common.back', 'Retour au tableau de bord')}</Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.header}>
        <Pressable onPress={handleBack} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]} hitSlop={10}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={ZoomIn.duration(400).springify()} style={[styles.title, { color: colors.text }]}>
          {t('vendorNewOrder.title', 'Nouvelle commande reçue 🎉')}
        </Animated.Text>

        <Animated.View entering={FadeInUp.duration(400).delay(120).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <Text style={[styles.orderId, { color: colors.text }]}>{t('vendorNewOrder.orderPrefix', 'Commande #')}{order.id}</Text>

          <View style={styles.row}>
            <User color={colors.textTertiary} size={18} />
            <View>
              <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>{t('vendorNewOrder.client', 'Client')}</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>{order.client.nom}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <MapPin color={colors.textTertiary} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>{t('vendorNewOrder.deliveryAddress', 'Adresse de livraison')}</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>{order.adresse}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Clock color={colors.textTertiary} size={18} />
            <View>
              <Text style={[styles.rowLabel, { color: colors.textTertiary }]}>{t('vendorNewOrder.time', 'Heure')}</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>{order.date} {t('vendorNewOrder.timeAt', 'à')} {order.heure}</Text>
            </View>
          </View>

          <Text style={[styles.productsLabel, { color: colors.text }]}>{t('vendorNewOrder.productsLabel', 'Produits')} ({order.produits.length})</Text>
          <View style={styles.thumbRow}>
            {order.produits.map((p) => (
              <Image key={p.nom} accessibilityLabel={p.nom} contentFit="cover" source={{ uri: p.image }} style={[styles.thumb, { backgroundColor: colors.backgroundAlt }]} />
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>{t('vendorNewOrder.total', 'Total')}</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>{total.toLocaleString('fr-FR')} FCFA</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(260).springify()} style={styles.actions}>
          <Pressable onPress={() => router.replace(`/vendor/orders/${order.id}` as any)} style={[styles.btn, { borderColor: colors.primary, backgroundColor: colors.surface }]}>
            <Text style={[styles.btnText, { color: colors.primary }]}>{t('vendorNewOrder.viewDetail', 'Voir le détail')}</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/vendor/(tabs)' as any)} style={[styles.btn, { borderColor: colors.borderStrong, backgroundColor: colors.surface }]}>
            <Text style={[styles.btnText, { color: colors.text }]}>{t('vendorNewOrder.later', 'Plus tard')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 6, gap: 18, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center' },

  card: {
    width: '100%', borderRadius: 20, padding: 20, gap: 14,
    borderWidth: 1,
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  orderId: { fontSize: 17, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowLabel: { fontSize: 12, fontWeight: '600' },
  rowValue: { fontSize: 15, fontWeight: '800', marginTop: 2 },

  productsLabel: { fontSize: 14, fontWeight: '800', marginTop: 4 },
  thumbRow: { flexDirection: 'row', gap: 8 },
  thumb: { width: 64, height: 64, borderRadius: 12 },

  divider: { height: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '700' },
  totalValue: { fontSize: 20, fontWeight: '900' },

  actions: { width: '100%', flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1, height: 56, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { fontSize: 15, fontWeight: '800' },

  emptyCard: {
    padding: 24, borderRadius: 24, borderWidth: 1,
    alignItems: 'center', width: '100%', maxWidth: 340, gap: 12,
  },
  emptyIconWrap: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyActionBtn: {
    height: 52, paddingHorizontal: 24, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
});
