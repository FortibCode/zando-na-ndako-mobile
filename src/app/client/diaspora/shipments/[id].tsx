import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { ArrowLeft, Upload, ShoppingBag, MapPin, Star } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import {
  useDiaspora, formatPreferred, formatFcfa, type ShipmentStatus,
} from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';

function statusLabel(status: ShipmentStatus, t: (key: string, fallback?: string) => string): string {
  if (status === 'livree') return t('diaspora.shipments.statusDelivered', 'Livrée');
  if (status === 'en_cours') return t('diaspora.shipments.statusOngoing', 'En cours');
  return t('diaspora.shipments.statusCancelled', 'Annulée');
}

const STATUS_COLORS: Record<ShipmentStatus, { bg: string; text: string }> = {
  livree: { bg: '#D1FAE5', text: '#15803D' },
  en_cours: { bg: '#FEF3C7', text: '#92400E' },
  annulee: { bg: '#FEE2E2', text: '#B91C1C' },
};

export default function ShipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getShipment, settings } = useDiaspora();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const shipment = getShipment(id || '');

  if (!shipment) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
            <ArrowLeft color={colors.primary} size={22} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>{t('diaspora.shipmentDetail.title', "Détails de l'envoi")}</Text>
        </View>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>{t('diaspora.shipmentDetail.notFound', 'Envoi introuvable.')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = STATUS_COLORS[shipment.statut];
  const subtotal = shipment.produits.reduce((sum, p) => sum + p.prix, 0);
  const total = subtotal + shipment.fraisLivraison;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('diaspora.shipmentDetail.title', "Détails de l'envoi")}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.topRow}>
          <View>
            <Text style={[styles.orderId, { color: colors.text }]}>#{shipment.id}</Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>{shipment.date} · {shipment.heure}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>{statusLabel(shipment.statut, t)}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(80).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <Text style={[styles.cardLabel, { color: colors.text }]}>{t('diaspora.shipmentDetail.beneficiaryLabel', 'Bénéficiaire')}</Text>
          <View style={styles.beneficiaryRow}>
            <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {shipment.beneficiaireNom.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={[styles.beneficiaryName, { color: colors.text }]}>{shipment.beneficiaireNom}</Text>
              <View style={styles.beneficiaryMeta}>
                <MapPin color={colors.textTertiary} size={12} />
                <Text style={[styles.beneficiaryCity, { color: colors.textSecondary }]}>{shipment.quartier}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(160).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <Text style={[styles.cardLabel, { color: colors.text }]}>{t('diaspora.shipmentDetail.productsLabel', 'Produits')} ({shipment.produits.length})</Text>
          {shipment.produits.map((p, i) => (
            <Animated.View
              key={p.nom}
              entering={FadeInLeft.duration(300).delay(200 + i * 70).springify()}
              style={[styles.itemRow, i < shipment.produits.length - 1 && [styles.itemBorder, { borderBottomColor: colors.border }]]}
            >
              <Text style={[styles.itemName, { color: colors.text }]}>{p.nom}</Text>
              <Text style={[styles.itemQty, { color: colors.textSecondary }]}>{p.quantite}</Text>
              <Text style={[styles.itemPrice, { color: colors.text }]}>{formatFcfa(p.prix)}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(240).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.cardLabel, { color: colors.text }]}>{t('diaspora.shipmentDetail.paymentLabel', 'Paiement')}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatFcfa(total)} (≈ {formatPreferred(total, settings.devise)})</Text>
              {shipment.paiementDetail ? <Text style={[styles.summarySub, { color: colors.textTertiary }]}>{shipment.paiementDetail}</Text> : (
                <Text style={[styles.summarySub, { color: colors.textTertiary }]}>{shipment.paiementMethode}</Text>
              )}
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('diaspora.shipmentDetail.slotLabel', 'Créneau choisi')}</Text>
            <Text style={[styles.summaryValueSm, { color: colors.text }]}>{shipment.creneau}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('diaspora.shipmentDetail.deliveryFeeLabel', 'Frais de livraison')}</Text>
            <Text style={[styles.summaryValueSm, { color: colors.text }]}>{formatFcfa(shipment.fraisLivraison)}</Text>
          </View>
        </Animated.View>

        {shipment.needsRating && (
          <Animated.View entering={FadeInUp.duration(400).delay(300).springify()}>
            <Pressable
              onPress={() => router.push(
                (shipment.livreur
                  ? `/client/rating?commandeId=${shipment.rawId}&driverName=${encodeURIComponent(shipment.livreur)}&sellerName=${encodeURIComponent(shipment.vendeur || '')}`
                  : `/client/rating?commandeId=${shipment.rawId}`) as any
              )}
              style={[styles.invoiceBtn, { borderColor: colors.gold, backgroundColor: colors.goldSoft }]}
            >
              <Star color={colors.gold} size={18} fill={colors.gold} />
              <Text style={[styles.invoiceText, { color: colors.gold }]}>{t('diaspora.shipmentDetail.rateButton', 'Noter cette commande')}</Text>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.duration(400).delay(320).springify()}>
          <Pressable
            onPress={() => Alert.alert(t('diaspora.shipmentDetail.invoiceAlertTitle', 'Facture'), t('diaspora.shipmentDetail.invoiceAlertDesc', 'Le téléchargement de la facture sera bientôt disponible.'))}
            style={[styles.invoiceBtn, { borderColor: colors.primary }]}
          >
            <Upload color={colors.primary} size={18} />
            <Text style={[styles.invoiceText, { color: colors.primary }]}>{t('diaspora.shipmentDetail.invoiceButton', 'Télécharger facture')}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(380).springify()}>
          <Pressable onPress={() => router.push('/client/diaspora/beneficiaries' as any)} style={[styles.reorderBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <ShoppingBag color={colors.textInverse} size={18} />
            <Text style={[styles.reorderText, { color: colors.textInverse }]}>{t('diaspora.shipmentDetail.reorderButton', 'Commander à nouveau')}</Text>
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
  title: { fontSize: 20, fontWeight: '900' },
  content: { padding: 20, gap: 14, paddingBottom: 30 },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 15 },

  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  orderId: { fontSize: 18, fontWeight: '900' },
  date: { fontSize: 12.5, marginTop: 3 },
  badge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 12, fontWeight: '900' },

  card: {
    borderRadius: 18, padding: 16,
    borderWidth: 1,
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  cardLabel: { fontSize: 13.5, fontWeight: '900', marginBottom: 10 },

  beneficiaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '900' },
  beneficiaryName: { fontSize: 16, fontWeight: '800' },
  beneficiaryMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  beneficiaryCity: { fontSize: 12.5 },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  itemBorder: { borderBottomWidth: 1 },
  itemName: { fontSize: 14, fontWeight: '700', flex: 1 },
  itemQty: { fontSize: 13 },
  itemPrice: { fontSize: 14, fontWeight: '700', minWidth: 80, textAlign: 'right' },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 4 },
  summaryLabel: { fontSize: 13.5 },
  summaryValue: { fontSize: 15, fontWeight: '900' },
  summarySub: { fontSize: 11.5, marginTop: 2 },
  summaryValueSm: { fontSize: 13.5, fontWeight: '700' },
  divider: { height: 1, marginVertical: 8 },

  invoiceBtn: {
    height: 54, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  invoiceText: { fontSize: 14.5, fontWeight: '800' },

  reorderBtn: {
    height: 58, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  reorderText: { fontSize: 16, fontWeight: '800' },
});
