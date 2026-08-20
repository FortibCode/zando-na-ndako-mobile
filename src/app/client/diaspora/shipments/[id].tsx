import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { ArrowLeft, Upload, ShoppingBag, MapPin } from 'lucide-react-native';
import { BLUE, RED } from '@/components/client-ui';
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
  const { t } = useLanguage();
  const shipment = getShipment(id || '');

  if (!shipment) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={BLUE} size={22} />
          </Pressable>
          <Text style={styles.title}>{t('diaspora.shipmentDetail.title', "Détails de l'envoi")}</Text>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{t('diaspora.shipmentDetail.notFound', 'Envoi introuvable.')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = STATUS_COLORS[shipment.statut];
  const subtotal = shipment.produits.reduce((sum, p) => sum + p.prix, 0);
  const total = subtotal + shipment.fraisLivraison;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={BLUE} size={22} />
        </Pressable>
        <Text style={styles.title}>{t('diaspora.shipmentDetail.title', "Détails de l'envoi")}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.topRow}>
          <View>
            <Text style={styles.orderId}>#{shipment.id}</Text>
            <Text style={styles.date}>{shipment.date} · {shipment.heure}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>{statusLabel(shipment.statut, t)}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(80).springify()} style={styles.card}>
          <Text style={styles.cardLabel}>{t('diaspora.shipmentDetail.beneficiaryLabel', 'Bénéficiaire')}</Text>
          <View style={styles.beneficiaryRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {shipment.beneficiaireNom.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.beneficiaryName}>{shipment.beneficiaireNom}</Text>
              <View style={styles.beneficiaryMeta}>
                <MapPin color="#94A3B8" size={12} />
                <Text style={styles.beneficiaryCity}>{shipment.quartier}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(160).springify()} style={styles.card}>
          <Text style={styles.cardLabel}>{t('diaspora.shipmentDetail.productsLabel', 'Produits')} ({shipment.produits.length})</Text>
          {shipment.produits.map((p, i) => (
            <Animated.View
              key={p.nom}
              entering={FadeInLeft.duration(300).delay(200 + i * 70).springify()}
              style={[styles.itemRow, i < shipment.produits.length - 1 && styles.itemBorder]}
            >
              <Text style={styles.itemName}>{p.nom}</Text>
              <Text style={styles.itemQty}>{p.quantite}</Text>
              <Text style={styles.itemPrice}>{formatFcfa(p.prix)}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(240).springify()} style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.cardLabel}>{t('diaspora.shipmentDetail.paymentLabel', 'Paiement')}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.summaryValue}>{formatFcfa(total)} (≈ {formatPreferred(total, settings.devise)})</Text>
              {shipment.paiementDetail ? <Text style={styles.summarySub}>{shipment.paiementDetail}</Text> : (
                <Text style={styles.summarySub}>{shipment.paiementMethode}</Text>
              )}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('diaspora.shipmentDetail.slotLabel', 'Créneau choisi')}</Text>
            <Text style={styles.summaryValueSm}>{shipment.creneau}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('diaspora.shipmentDetail.deliveryFeeLabel', 'Frais de livraison')}</Text>
            <Text style={styles.summaryValueSm}>{formatFcfa(shipment.fraisLivraison)}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(320).springify()}>
          <Pressable
            onPress={() => Alert.alert(t('diaspora.shipmentDetail.invoiceAlertTitle', 'Facture'), t('diaspora.shipmentDetail.invoiceAlertDesc', 'Le téléchargement de la facture sera bientôt disponible.'))}
            style={styles.invoiceBtn}
          >
            <Upload color={BLUE} size={18} />
            <Text style={styles.invoiceText}>{t('diaspora.shipmentDetail.invoiceButton', 'Télécharger facture')}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(380).springify()}>
          <Pressable onPress={() => router.push('/client/diaspora/beneficiaries' as any)} style={styles.reorderBtn}>
            <ShoppingBag color="#FFF" size={18} />
            <Text style={styles.reorderText}>{t('diaspora.shipmentDetail.reorderButton', 'Commander à nouveau')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFE' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E8ECF2',
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center' },
  title: { color: BLUE, fontSize: 20, fontWeight: '900' },
  content: { padding: 20, gap: 14, paddingBottom: 30 },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: '#64748B', fontSize: 15 },

  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  orderId: { color: BLUE, fontSize: 18, fontWeight: '900' },
  date: { color: '#64748B', fontSize: 12.5, marginTop: 3 },
  badge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 12, fontWeight: '900' },

  card: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#F0F3F8',
    shadowColor: '#1A2744', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  cardLabel: { color: BLUE, fontSize: 13.5, fontWeight: '900', marginBottom: 10 },

  beneficiaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#BFDBFE', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BLUE, fontSize: 15, fontWeight: '900' },
  beneficiaryName: { color: BLUE, fontSize: 16, fontWeight: '800' },
  beneficiaryMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  beneficiaryCity: { color: '#64748B', fontSize: 12.5 },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  itemName: { color: BLUE, fontSize: 14, fontWeight: '700', flex: 1 },
  itemQty: { color: '#64748B', fontSize: 13 },
  itemPrice: { color: BLUE, fontSize: 14, fontWeight: '700', minWidth: 80, textAlign: 'right' },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 4 },
  summaryLabel: { color: '#64748B', fontSize: 13.5 },
  summaryValue: { color: BLUE, fontSize: 15, fontWeight: '900' },
  summarySub: { color: '#94A3B8', fontSize: 11.5, marginTop: 2 },
  summaryValueSm: { color: BLUE, fontSize: 13.5, fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 },

  invoiceBtn: {
    height: 54, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: BLUE,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  invoiceText: { color: BLUE, fontSize: 14.5, fontWeight: '800' },

  reorderBtn: {
    height: 58, borderRadius: 18, backgroundColor: RED,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: RED, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  reorderText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
