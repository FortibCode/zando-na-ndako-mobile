import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { alert } from '@/contexts/alert-context';
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

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { changeQuantity } = useClient();

  const [commande, setCommande] = useState<ApiCommande | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadDetail = async () => {
    if (!id) {
      setLoading(false);
      setLoadError(true);
      return;
    }
    setLoading(true);
    setLoadError(false);
    try {
      const data = await fetchClientCommandeDetail(id);
      setCommande(data);
    } catch (_err) {
      // Échec réel de récupération : état d'erreur honnête (jamais de commande inventée),
      // avec une action de réessai proposée à l'utilisateur.
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const handleReorder = () => {
    if (!commande?.lignes || commande.lignes.length === 0) {
      alert(t('orderDetail.reorder', 'Recommander'), t('orderDetail.reorderError', 'Aucun article à recommander pour cette commande.'));
      return;
    }
    for (const ligne of commande.lignes) {
      if (ligne.produit?.id) changeQuantity(ligne.produit.id, ligne.quantite);
    }
    alert(t('orderDetail.addedToCart', 'Ajouté au panier'), t('orderDetail.addedToCartDesc', 'Les articles de cette commande ont été ajoutés à votre panier.'), [
      { text: 'OK', onPress: () => router.push('/client/(tabs)/cart' as any) },
    ]);
  };

  const handleCancelOrder = () => {
    if (!id) return;

    alert(
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
              alert(t('common.confirm', 'Confirmer'), t('orderDetail.cancelSuccess', 'Votre commande a bien été annulée.'));
              await loadDetail();
            } catch (err: any) {
              alert('Erreur', err.message || t('orderDetail.cancelError', "Impossible d'annuler la commande."));
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

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
      ) : !commande ? (
        <View style={[styles.loadingBox, styles.errorBox]}>
          <AlertTriangle color={colors.error} size={44} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>{t('orderDetail.errorTitle', 'Impossible de charger cette commande')}</Text>
          <Text style={[styles.errorSub, { color: colors.textSecondary }]}>{t('orderDetail.errorSub', 'Vérifiez votre connexion puis réessayez.')}</Text>
          <View style={styles.errorActions}>
            <Pressable onPress={loadDetail} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
              <RotateCcw color={colors.white} size={16} />
              <Text style={[styles.retryBtnText, { color: colors.white }]}>{t('common.retry', 'Réessayer')}</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} style={[styles.backLinkBtn, { borderColor: colors.border }]}>
              <Text style={[styles.backLinkBtnText, { color: colors.text }]}>{t('common.back', 'Retour')}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <OrderDetailBody
          commande={commande}
          colors={colors}
          t={t}
          cancelling={cancelling}
          onReorder={handleReorder}
          onCancel={handleCancelOrder}
        />
      )}
    </SafeAreaView>
  );
}

function OrderDetailBody({
  commande, colors, t, cancelling, onReorder, onCancel,
}: {
  commande: ApiCommande;
  colors: any;
  t: (key: string, fallback?: string) => string;
  cancelling: boolean;
  onReorder: () => void;
  onCancel: () => void;
}) {
  const statutStr = commande.statut_commande;
  const isCanCancel = statutStr === 'confirmee' || statutStr === 'achat_marche';

  const numeroDisplay = commande.numero_commande;
  const dateDisplay = commande.date_commande || commande.created_at
    ? new Date(commande.date_commande || commande.created_at!).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

  const getStatusMeta = () => {
    switch (statutStr) {
      case 'confirmee': return { label: t('orderDetail.statusConfirmed', 'Confirmée'), color: colors.primary, icon: Clock };
      case 'achat_marche': return { label: t('orderDetail.statusShopping', 'Achat au marché'), color: colors.primary, icon: Package };
      case 'preparation': return { label: t('orderDetail.statusPreparing', 'En préparation'), color: colors.warning, icon: Package };
      case 'en_route': return { label: t('orderDetail.statusEnRoute', 'En route'), color: colors.warning, icon: Truck };
      case 'en_route_client': return { label: t('orderDetail.statusEnRouteClient', 'Livreur en route vers vous'), color: colors.warning, icon: Truck };
      case 'livree': return { label: t('orderDetail.statusDelivered', 'Livrée'), color: colors.success, icon: CheckCircle };
      case 'annulee': return { label: t('orderDetail.statusCancelled', 'Annulée'), color: colors.error, icon: XCircle };
      default: return { label: t('orderDetail.statusProcessing', 'Traitement'), color: colors.textSecondary, icon: Clock };
    }
  };

  const statusMeta = getStatusMeta();

  const itemsDisplay = (commande.lignes || []).map((l) => ({
    image: resolveMediaUrl(l.produit?.photo_produit) || 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?auto=format&fit=crop&w=600&q=85',
    name: l.produit?.nom_produit || 'Produit',
    quantity: `${l.quantite} x`,
    price: `${Math.round(typeof l.sous_total === 'string' ? parseFloat(l.sous_total) : l.sous_total || (typeof l.prix_unitaire === 'string' ? parseFloat(l.prix_unitaire) : l.prix_unitaire) * l.quantite).toLocaleString('fr-FR')} FCFA`,
  }));

  const sousTotalNum = typeof commande.montant_sous_total === 'string' ? parseFloat(commande.montant_sous_total) : commande.montant_sous_total;
  const fraisLivraisonNum = typeof commande.frais_livraison === 'string' ? parseFloat(commande.frais_livraison) : commande.frais_livraison;
  const totalNum = typeof commande.montant_total === 'string' ? parseFloat(commande.montant_total) : commande.montant_total;

  return (
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
        {commande.adresse_livraison && (
          <InfoRow label={t('orderDetail.delivery', 'Livraison')} value={commande.adresse_livraison} colors={colors} />
        )}
      </Animated.View>

      {/* Items */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(200).springify()}
        style={[styles.items, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {itemsDisplay.length === 0 ? (
          <Text style={[styles.itemsEmpty, { color: colors.textSecondary }]}>
            {t('orderDetail.noItems', 'Aucun article trouvé pour cette commande.')}
          </Text>
        ) : (
          itemsDisplay.map((item, index) => (
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
          ))
        )}
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
            onPress={onCancel}
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
          <Pressable onPress={onReorder} style={[styles.reorder, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <RotateCcw color="#FFF" size={18} />
            <Text style={styles.buttonText}>{t('orderDetail.reorder', 'Recommander')}</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => alert(t('orderDetail.invoice', 'Facture'), t('orderDetail.invoiceComingSoon', 'Le téléchargement de la facture sera bientôt disponible.'))}
          style={[styles.invoice, { borderColor: colors.primary, backgroundColor: colors.surface }]}
        >
          <Download color={colors.primary} size={18} />
          <Text style={[styles.invoiceText, { color: colors.primary }]}>{t('orderDetail.invoice', 'Facture')}</Text>
        </Pressable>
      </Animated.View>

      {/* Noter la commande — uniquement une fois livrée */}
      {statutStr === 'livree' && (
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
      {statutStr !== 'annulee' && (
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
  errorBox: { paddingHorizontal: 32 },
  errorTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  errorSub: { fontSize: 14, textAlign: 'center' },
  errorActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 14,
  },
  retryBtnText: { fontSize: 14, fontWeight: '800' },
  backLinkBtn: {
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 14, borderWidth: 1.5,
    justifyContent: 'center',
  },
  backLinkBtnText: { fontSize: 14, fontWeight: '800' },
  itemsEmpty: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
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

