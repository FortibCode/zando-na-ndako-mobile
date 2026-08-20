import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeInDown, FadeInUp, FadeInLeft,
} from 'react-native-reanimated';
import {
  ArrowLeft, CheckCircle, Download, RotateCcw, XCircle, Clock, Truck, Package, AlertTriangle, MessageCircleWarning, Star,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { useClient } from '@/contexts/client-context';
import { fetchClientCommandeDetail, annulerClientCommande, resolveMediaUrl, type ApiCommande } from '@/services/api';

const DEMO_ITEMS = [
  { image: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&w=600&q=85', name: 'Dorade royale', quantity: '1 kg', price: '1 500 FCFA' },
  { image: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?auto=format&fit=crop&w=600&q=85', name: 'Tomate fraîche', quantity: '2 kg', price: '1 200 FCFA' },
  { image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=85', name: 'Riz parfumé 5kg', quantity: '1 sac', price: '3 300 FCFA' },
];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { changeQuantity } = useClient();

  const [commande, setCommande] = useState<ApiCommande | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadDetail = async () => {
    if (!id || id.startsWith('demo')) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchClientCommandeDetail(id);
      setCommande(data);
    } catch (_err) {
      // mode démo / fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleReorder = () => {
    if (!commande?.lignes || commande.lignes.length === 0) {
      Alert.alert(t('orderDetail.reorder', 'Recommander'), t('orderDetail.reorderError', 'Impossible de recommander cette commande de démonstration.'));
      return;
    }
    for (const ligne of commande.lignes) {
      if (ligne.produit?.id) changeQuantity(ligne.produit.id, ligne.quantite);
    }
    Alert.alert(t('orderDetail.addedToCart', 'Ajouté au panier'), t('orderDetail.addedToCartDesc', 'Les articles de cette commande ont été ajoutés à votre panier.'), [
      { text: 'OK', onPress: () => router.push('/client/(tabs)/cart' as any) },
    ]);
  };

  const handleCancelOrder = () => {
    if (!id || id.startsWith('demo')) {
      Alert.alert(t('orderDetail.cancelTitle', 'Annuler la commande'), t('orderDetail.cancelSuccess', 'Votre commande a bien été annulée.'));
      return;
    }

    Alert.alert(
      t('orderDetail.cancelTitle', 'Annuler la commande'),
      t('orderDetail.cancelConfirm', 'Êtes-vous sûr de vouloir annuler cette commande ?'),
      [
        { text: t('common.no', 'Non'), style: 'cancel' },
        {
          text: `${t('common.yes', 'Oui')}, ${t('orderDetail.cancelOrder', 'Annuler la commande').toLowerCase()}`,
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await annulerClientCommande(id, 'Annulée par le client depuis l\'application');
              Alert.alert(t('common.confirm', 'Confirmer'), t('orderDetail.cancelSuccess', 'Votre commande a bien été annulée.'));
              await loadDetail();
            } catch (err: any) {
              Alert.alert('Erreur', err.message || t('orderDetail.cancelError', "Impossible d'annuler la commande."));
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  // Mappage des données réelles ou fallback
  const numeroDisplay = commande ? commande.numero_commande : `#ZNND-2024-${id || '000123'}`;
  const dateDisplay = commande?.date_commande || commande?.created_at
    ? new Date(commande.date_commande || commande.created_at!).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '10 Mai 2024 - 09:15';

  const statutStr = commande ? commande.statut_commande : 'livree';
  const isCanCancel = statutStr === 'confirmee' || statutStr === 'achat_marche';

  const getStatusMeta = () => {
    switch (statutStr) {
      case 'confirmee': return { label: t('orderDetail.statusConfirmed', 'Confirmée'), color: colors.primary, icon: Clock };
      case 'achat_marche': return { label: t('orderDetail.statusShopping', 'Achat au marché'), color: colors.primary, icon: Package };
      case 'preparation': return { label: t('orderDetail.statusPreparing', 'En préparation'), color: colors.warning, icon: Package };
      case 'en_route': return { label: t('orderDetail.statusEnRoute', 'En route'), color: colors.warning, icon: Truck };
      case 'en_route_client': return { label: t('orderDetail.statusEnRouteClient', 'Livreur en route vers vous'), color: colors.warning, icon: Truck };
      case 'livree': return { label: t('orderDetail.statusDelivered', 'Livrée ✓'), color: colors.success, icon: CheckCircle };
      case 'annulee': return { label: t('orderDetail.statusCancelled', 'Annulée'), color: colors.error, icon: XCircle };
      default: return { label: t('orderDetail.statusProcessing', 'Traitement'), color: colors.textSecondary, icon: Clock };
    }
  };

  const statusMeta = getStatusMeta();

  const itemsDisplay = commande?.lignes && commande.lignes.length > 0
    ? commande.lignes.map((l) => ({
        image: resolveMediaUrl(l.produit?.photo_produit) || 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&w=600&q=85',
        name: l.produit?.nom_produit || 'Produit',
        quantity: `${l.quantite} x`,
        price: `${Math.round(typeof l.sous_total === 'string' ? parseFloat(l.sous_total) : l.sous_total || (typeof l.prix_unitaire === 'string' ? parseFloat(l.prix_unitaire) : l.prix_unitaire) * l.quantite).toLocaleString('fr-FR')} FCFA`,
      }))
    : DEMO_ITEMS;

  const sousTotalNum = commande ? (typeof commande.montant_sous_total === 'string' ? parseFloat(commande.montant_sous_total) : commande.montant_sous_total) : 6200;
  const fraisLivraisonNum = commande ? (typeof commande.frais_livraison === 'string' ? parseFloat(commande.frais_livraison) : commande.frais_livraison) : 800;
  const totalNum = commande ? (typeof commande.montant_total === 'string' ? parseFloat(commande.montant_total) : commande.montant_total) : 7000;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <Pressable onPress={() => router.back()}><ArrowLeft color={colors.primary} size={27} /></Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('orderDetail.title', 'Détails de la commande')}</Text>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('orderDetail.loading', 'Chargement de la commande...')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Info */}
          <Animated.View
            entering={FadeInDown.duration(350).delay(100).springify()}
            style={[styles.info, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <InfoRow label={t('orderDetail.order', 'Commande')} value={numeroDisplay} colors={colors} />
            <InfoRow label={t('orderDetail.date', 'Date')} value={dateDisplay} colors={colors} />
            <InfoRow
              label={t('orderDetail.status', 'Statut')}
              value={statusMeta.label}
              valueColor={statusMeta.color}
              icon={statusMeta.icon}
              colors={colors}
            />
            {commande?.adresse_livraison && (
              <InfoRow label={t('orderDetail.delivery', 'Livraison')} value={commande.adresse_livraison} colors={colors} />
            )}
          </Animated.View>

          {/* Items */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(200).springify()}
            style={[styles.items, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {itemsDisplay.map((item, index) => (
              <Animated.View
                key={`${item.name}-${index}`}
                entering={FadeInLeft.duration(300).delay(300 + index * 80).springify()}
                style={[styles.item, { borderBottomColor: colors.border }, index < itemsDisplay.length - 1 && styles.itemBorder]}
              >
                <Image accessibilityLabel={item.name} contentFit="cover" source={{ uri: item.image }} style={styles.itemImage} />
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>{item.quantity}</Text>
                <Text style={[styles.itemPrice, { color: colors.primary }]}>{item.price}</Text>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Summary */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(500).springify()}
            style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <SummaryRow label={t('orderDetail.subtotal', 'Sous-total')} value={`${Math.round(sousTotalNum).toLocaleString('fr-FR')} FCFA`} colors={colors} />
            <SummaryRow label={t('orderDetail.deliveryFee', 'Livraison')} value={`${Math.round(fraisLivraisonNum).toLocaleString('fr-FR')} FCFA`} colors={colors} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SummaryRow label={t('orderDetail.total', 'Total')} value={`${Math.round(totalNum).toLocaleString('fr-FR')} FCFA`} bold colors={colors} />
          </Animated.View>

          {/* Actions */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(600).springify()}
            style={styles.actions}
          >
            {isCanCancel ? (
              <Pressable
                disabled={cancelling}
                onPress={handleCancelOrder}
                style={[styles.cancelBtn, { backgroundColor: colors.error }]}
              >
                {cancelling ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <XCircle color="#FFF" size={18} />
                    <Text style={styles.buttonText}>{t('orderDetail.cancelOrder', 'Annuler la commande')}</Text>
                  </>
                )}
              </Pressable>
            ) : (
              <Pressable onPress={handleReorder} style={[styles.reorder, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
                <RotateCcw color="#FFF" size={18} />
                <Text style={styles.buttonText}>{t('orderDetail.reorder', 'Recommander')}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => Alert.alert(t('orderDetail.invoice', 'Facture'), t('orderDetail.invoiceComingSoon', 'Le téléchargement de la facture sera bientôt disponible.'))}
              style={[styles.invoice, { borderColor: colors.primary, backgroundColor: colors.surface }]}
            >
              <Download color={colors.primary} size={18} />
              <Text style={[styles.invoiceText, { color: colors.primary }]}>{t('orderDetail.invoice', 'Facture')}</Text>
            </Pressable>
          </Animated.View>

          {/* Noter la commande — uniquement une fois livrée */}
          {commande?.id && statutStr === 'livree' && (
            <Animated.View entering={FadeInUp.duration(400).delay(625).springify()}>
              <Pressable
                onPress={() => router.push(
                  `/client/rating?commandeId=${commande.id}` +
                  (commande.vendeur?.nom_commerce || commande.vendeur?.user?.nom_complet
                    ? `&sellerName=${encodeURIComponent(commande.vendeur.nom_commerce || commande.vendeur.user!.nom_complet)}`
                    : '') +
                  (commande.livreur?.user?.nom_complet ? `&driverName=${encodeURIComponent(commande.livreur.user.nom_complet)}` : '') as any
                )}
                style={[styles.disputeBtn, { borderColor: colors.primary, backgroundColor: colors.surface }]}
              >
                <Star color={colors.primary} size={18} />
                <Text style={[styles.disputeBtnText, { color: colors.primary }]}>
                  {t('orderDetail.rateOrder', 'Noter cette commande')}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Litige — uniquement une fois la commande livrée, non pertinent avant */}
          {commande?.id && statutStr !== 'annulee' && (
            <Animated.View entering={FadeInUp.duration(400).delay(650).springify()}>
              {commande.litige ? (
                <Pressable
                  onPress={() => router.push(`/client/disputes/${commande.litige!.id}` as any)}
                  style={[styles.disputeBtn, { borderColor: colors.warning, backgroundColor: colors.surface }]}
                >
                  <MessageCircleWarning color={colors.warning} size={18} />
                  <Text style={[styles.disputeBtnText, { color: colors.warning }]}>
                    {t('orderDetail.viewDispute', 'Voir mon litige')} · {commande.litige.numero}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => router.push(`/client/disputes/new?commandeId=${commande.id}` as any)}
                  style={[styles.disputeBtn, { borderColor: colors.error, backgroundColor: colors.surface }]}
                >
                  <AlertTriangle color={colors.error} size={18} />
                  <Text style={[styles.disputeBtnText, { color: colors.error }]}>
                    {t('orderDetail.reportProblem', 'Signaler un problème')}
                  </Text>
                </Pressable>
              )}
            </Animated.View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function InfoRow({ label, value, valueColor, icon: Icon, colors }: {
  label: string; value: string; valueColor?: string; icon?: any; colors: any;
}) {
  const ValIcon = Icon;
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.infoValueRow}>
        {ValIcon && <ValIcon color={valueColor || colors.primary} size={16} />}
        <Text style={[styles.infoValue, { color: colors.text }, valueColor ? { color: valueColor } : undefined]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function SummaryRow({ label, value, bold, colors }: { label: string; value: string; bold?: boolean; colors: any }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.textSecondary }, bold && { color: colors.text, fontWeight: '800', fontSize: 19 }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.text }, bold && { color: colors.primary, fontWeight: '800', fontSize: 19 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 15,
    padding: 20,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: '800' },
  content: { padding: 20, gap: 16, paddingBottom: 30 },
  info: {
    borderRadius: 18, padding: 18,
    borderWidth: 1,
    shadowColor: '#1A2744', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, alignItems: 'center', gap: 8,
  },
  infoLabel: { fontSize: 15 },
  infoValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  infoValue: { fontSize: 15, fontWeight: '700', textAlign: 'right' },
  items: {
    borderRadius: 18, padding: 14,
    borderWidth: 1,
    shadowColor: '#1A2744', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  item: {
    minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  itemBorder: { borderBottomWidth: 1 },
  itemImage: { width: 50, height: 50, borderRadius: 10 },
  itemName: { fontSize: 15, fontWeight: '700', flex: 1 },
  itemQuantity: { fontSize: 14 },
  itemPrice: { fontSize: 15, fontWeight: '700', minWidth: 80, textAlign: 'right' },
  summary: {
    borderRadius: 18, padding: 18,
    borderWidth: 1,
    shadowColor: '#1A2744', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
  },
  summaryLabel: { fontSize: 16 },
  summaryValue: { fontSize: 16, fontWeight: '600' },
  divider: { height: 1, marginVertical: 8 },
  actions: { flexDirection: 'row', gap: 12 },
  reorder: {
    flex: 1, height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    shadowOpacity: 0.2, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cancelBtn: {
    flex: 1, height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  buttonText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  invoice: {
    flex: 1, height: 56, borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  invoiceText: { fontSize: 14, fontWeight: '800' },
  disputeBtn: {
    height: 52, borderRadius: 16, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  disputeBtnText: { fontSize: 14, fontWeight: '800' },
});

