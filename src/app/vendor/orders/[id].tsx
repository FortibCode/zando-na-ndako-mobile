import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { ArrowLeft, CheckCircle2, User, Phone, MapPin, Star, XCircle } from 'lucide-react-native';
import { useVendor, type VendorOrderStatus } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { ApiError, fetchNotationsCommande, noterCommande, type ApiNotation } from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Notation du client par le vendeur : une seule fois par commande livrée, jamais de cible
// à préciser (le backend sait que le vendeur ne peut noter que le client de la commande).
function RateClientCard({ commandeId }: { commandeId: string }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [notation, setNotation] = useState<ApiNotation | null | undefined>(undefined);
  const [note, setNote] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await fetchNotationsCommande(commandeId);
        if (!active) return;
        setNotation(list.find((n) => n.type_notateur === 'vendeur' && n.type_cible === 'client') || null);
      } catch {
        if (active) setNotation(null);
      }
    })();
    return () => { active = false; };
  }, [commandeId]);

  const handleSubmit = async () => {
    if (note === 0) return;
    setSubmitting(true);
    try {
      const created = await noterCommande(commandeId, { note, commentaire: comment.trim() || undefined });
      setNotation(created);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        try {
          const list = await fetchNotationsCommande(commandeId);
          setNotation(list.find((n) => n.type_notateur === 'vendeur' && n.type_cible === 'client') || null);
        } catch { /* garde le formulaire tel quel */ }
      } else {
        alert(t('common.error', 'Erreur'), err instanceof Error ? err.message : t('rateClient.sendError', "Impossible d'envoyer votre avis."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (notation === undefined) return null;

  return (
    <>
      <Animated.Text entering={FadeInUp.duration(350).delay(320).springify()} style={[styles.sectionTitle, { color: colors.text }]}>
        {t('rateClient.title', 'Noter le client')}
      </Animated.Text>
      <Animated.View entering={FadeInUp.duration(400).delay(360).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
        {notation ? (
          <View style={styles.rateClientDone}>
            <CheckCircle2 color={colors.success} size={20} />
            <Text style={[styles.rateClientDoneText, { color: colors.text }]}>{t('rateClient.alreadyDone', 'Vous avez déjà noté ce client')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.rateClientStars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Pressable key={s} onPress={() => setNote(s)} hitSlop={8}>
                  <Star color={colors.gold} size={32} fill={s <= note ? colors.gold : 'transparent'} />
                </Pressable>
              ))}
            </View>
            <TextInput
              multiline
              value={comment}
              onChangeText={setComment}
              placeholder={t('rateClient.commentPlaceholder', 'Client agréable, sans problème particulier...')}
              placeholderTextColor={colors.textTertiary}
              style={[styles.rateClientInput, { color: colors.text, borderColor: colors.border }]}
            />
            <Pressable
              disabled={note === 0 || submitting}
              onPress={handleSubmit}
              style={[styles.acceptBtnFull, { backgroundColor: colors.primary, opacity: note === 0 || submitting ? 0.5 : 1 }]}
            >
              {submitting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.acceptBtnText}>{t('rateClient.send', 'Envoyer')}</Text>}
            </Pressable>
          </>
        )}
      </Animated.View>
    </>
  );
}

function statusLabel(statut: VendorOrderStatus, t: (key: string, fallback?: string) => string): string {
  const map: Record<VendorOrderStatus, [string, string]> = {
    en_attente: ['vendorOrdersList.statusPending', 'En attente'],
    preparation: ['vendorOrdersList.statusPreparation', 'Préparation'],
    prete: ['vendorOrdersList.statusReady', 'Prête'],
    en_livraison: ['vendorOrdersList.statusDelivering', 'En livraison'],
    livree: ['vendorOrdersList.statusDelivered', 'Livrée'],
    annulee: ['vendorOrdersList.statusCancelled', 'Annulée'],
    refusee: ['vendorOrdersList.statusRefused', 'Refusée'],
  };
  const [key, fallback] = map[statut];
  return t(key, fallback);
}
export default function VendorOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrder, acceptOrder } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const order = getOrder(id || '');

  const STATUS_COLOR: Record<VendorOrderStatus, { bg: string; text: string }> = {
    en_attente: { bg: colors.warning + '18', text: colors.warning },
    preparation: { bg: colors.info + '18', text: colors.info },
    prete: { bg: colors.accent + '18', text: colors.accent },
    en_livraison: { bg: colors.info + '18', text: colors.info },
    livree: { bg: colors.freshSoft, text: colors.success },
    annulee: { bg: colors.error + '14', text: colors.error },
    refusee: { bg: colors.error + '14', text: colors.error },
  };

  if (!order) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}><ArrowLeft color={colors.primary} size={22} /></Pressable>
          <Text style={[styles.title, { color: colors.text }]}>{t('vendorOrderDetail.notFound', 'Commande introuvable')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const total = order.produits.reduce((sum, p) => sum + p.prix, 0);
  const statusStyle = STATUS_COLOR[order.statut];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorOrderDetail.orderPrefix', 'Commande #')}{order.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{statusLabel(order.statut, t)}</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {(order.statut === 'annulee' || order.statut === 'refusee') && (
          <Animated.View entering={FadeInUp.duration(350).springify()} style={[styles.cancelBanner, { backgroundColor: colors.error + '14', borderColor: colors.error + '40' }]}>
<XCircle color={colors.error} size={18} />
            <Text style={[styles.cancelBannerText, { color: colors.error }]}>
              {order.statut === 'annulee' ? order.motifAnnulation : order.motifRefus}
            </Text>
          </Animated.View>
        )}

        <Animated.Text entering={FadeInUp.duration(350).delay(60).springify()} style={[styles.sectionTitle, { color: colors.text }]}>
          {t('vendorOrderDetail.customerInfo', 'Informations client')}
        </Animated.Text>
        <Animated.View entering={FadeInUp.duration(400).delay(100).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <View style={styles.row}>
            <User color={colors.primary} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowName, { color: colors.text }]}>{order.client.nom}</Text>
              <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{order.client.telephone}</Text>
            </View>
            <Pressable onPress={() => Linking.openURL(`tel:${order.client.telephone.replace(/\s/g, '')}`)} style={[styles.callBtn, { borderColor: colors.freshSoft }]}>
              <Phone color={colors.success} size={18} />
            </Pressable>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}>
            <MapPin color={colors.primary} size={18} />
            <Text style={[styles.address, { color: colors.text }]}>{order.adresse}</Text>
            <View style={[styles.pinBtn, { backgroundColor: colors.primarySoft }]}>
              <MapPin color={colors.primary} size={16} />
            </View>
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(350).delay(160).springify()} style={[styles.sectionTitle, { color: colors.text }]}>
          {t('vendorOrderDetail.orderedProducts', 'Produits commandés')}
        </Animated.Text>
        <Animated.View entering={FadeInUp.duration(400).delay(200).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          {order.produits.length === 0 ? (
            <Text style={[styles.emptyProducts, { color: colors.textTertiary }]}>{t('vendorOrderDetail.noProducts', 'Aucun produit renseigné pour cette commande.')}</Text>
          ) : (
            order.produits.map((p, i) => (
              <Animated.View
                key={p.nom}
                entering={FadeInLeft.duration(300).delay(240 + i * 70).springify()}
                style={[styles.itemRow, i < order.produits.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <Image accessibilityLabel={p.nom} contentFit="cover" source={{ uri: p.image }} style={styles.itemImage} />
                <Text style={[styles.itemName, { color: colors.text }]}>{p.nom}</Text>
                <Text style={[styles.itemQty, { color: colors.textSecondary }]}>x {p.quantite}</Text>
                <Text style={[styles.itemPrice, { color: colors.text }]}>{p.prix.toLocaleString('fr-FR')} FCFA</Text>
              </Animated.View>
            ))
          )}
          {order.produits.length > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>{t('vendorOrderDetail.total', 'Total')}</Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>{total.toLocaleString('fr-FR')} FCFA</Text>
              </View>
            </>
          )}
        </Animated.View>

        {order.instruction && (
          <>
            <Animated.Text entering={FadeInUp.duration(350).delay(260).springify()} style={[styles.sectionTitle, { color: colors.text }]}>
              {t('vendorOrderDetail.customerInstruction', 'Instruction du client')}
            </Animated.Text>
<Animated.Text entering={FadeInUp.duration(400).delay(300).springify()} style={[styles.instruction, { color: colors.warning, borderColor: colors.warning + '40', backgroundColor: colors.warning + '14' }]}>
              {order.instruction}
            </Animated.Text>
          </>
        )}

        {order.statut === 'livree' && <RateClientCard commandeId={order.id} />}
      </ScrollView>

      {order.statut === 'en_attente' && (
        <Animated.View entering={FadeInUp.duration(400).delay(380).springify()} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable onPress={() => router.push(`/vendor/orders/${order.id}/refuse` as any)} style={[styles.refuseBtn, { borderColor: colors.error }]}>
            <Text style={[styles.refuseBtnText, { color: colors.error }]}>{t('vendorOrderDetail.refuse', 'Refuser')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              acceptOrder(order.id)
                .then(() => router.push(`/vendor/orders/${order.id}/prepare` as any))
                .catch((e: any) => alert('Erreur', e.message || t('vendorOrderDetail.acceptErrorDesc', "Impossible d'accepter cette commande.")));
            }}
            style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.acceptBtnText}>{t('vendorOrderDetail.accept', 'Accepter')}</Text>
          </Pressable>
        </Animated.View>
      )}

      {order.statut === 'preparation' && (
        <Animated.View entering={FadeInUp.duration(400).delay(380).springify()} style={[styles.footerSingle, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable onPress={() => router.push(`/vendor/orders/${order.id}/prepare` as any)} style={[styles.acceptBtnFull, { backgroundColor: colors.primary }]}>
            <Text style={styles.acceptBtnText}>{t('vendorOrderDetail.continuePreparation', 'Continuer la préparation')}</Text>
          </Pressable>
        </Animated.View>
      )}

      {order.statut === 'prete' && (
        <Animated.View entering={FadeInUp.duration(400).delay(380).springify()} style={[styles.footerSingle, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable onPress={() => router.push(`/vendor/orders/${order.id}/driver-arrived` as any)} style={[styles.acceptBtnFull, { backgroundColor: colors.primary }]}>
            <Text style={styles.acceptBtnText}>{t('vendorOrderDetail.viewDriver', 'Voir le livreur')}</Text>
          </Pressable>
        </Animated.View>
      )}

      {order.statut === 'en_livraison' && (
        <Animated.View entering={FadeInUp.duration(400).delay(380).springify()} style={[styles.footerSingle, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable onPress={() => router.push(`/vendor/chat/${order.id}?role=livreur` as any)} style={[styles.acceptBtnFull, { backgroundColor: colors.primary }]}>
            <Text style={styles.acceptBtnText}>{t('vendorOrderDetail.contactDriver', 'Contacter le livreur')}</Text>
          </Pressable>
        </Animated.View>
      )}

      {order.statut === 'livree' && (
        <Animated.View entering={FadeInUp.duration(400).delay(380).springify()} style={[styles.footerSingle, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable onPress={() => router.push(`/vendor/orders/${order.id}/payment` as any)} style={[styles.outlineBtnFull, { borderColor: colors.primary }]}>
            <Text style={[styles.outlineBtnFullText, { color: colors.primary }]}>{t('vendorOrderDetail.viewPayment', 'Voir le paiement')}</Text>
          </Pressable>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '900', flex: 1 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  statusBadgeText: { fontSize: 12, fontWeight: '900' },
  content: { padding: 20, gap: 8, paddingBottom: 110 },

  cancelBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 14, borderWidth: 1,
  },
cancelBannerText: { fontSize: 13.5, fontWeight: '700', flex: 1 },

  sectionTitle: { fontSize: 15, fontWeight: '800', marginTop: 10, marginBottom: 4 },
  card: {
    borderRadius: 18, padding: 16,
    borderWidth: 1,
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
    gap: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  rowName: { fontSize: 15.5, fontWeight: '800' },
  rowSub: { fontSize: 13, marginTop: 2 },
  callBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  address: { fontSize: 14, fontWeight: '600', flex: 1 },
  pinBtn: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, marginVertical: 6 },

  emptyProducts: { fontSize: 13.5, textAlign: 'center', paddingVertical: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
itemImage: { width: 46, height: 46, borderRadius: 10 },
  itemName: { fontSize: 14, fontWeight: '700', flex: 1 },
  itemQty: { fontSize: 13 },
  itemPrice: { fontSize: 14, fontWeight: '700', minWidth: 80, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 16, fontWeight: '900' },
  totalValue: { fontSize: 18, fontWeight: '900' },

instruction: {
    borderRadius: 14, padding: 14,
    fontSize: 13.5, lineHeight: 20, borderWidth: 1,
  },

  rateClientDone: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rateClientDoneText: { fontSize: 14, fontWeight: '700', flex: 1 },
  rateClientStars: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: 6 },
  rateClientInput: {
    fontSize: 14, minHeight: 60, textAlignVertical: 'top',
    marginTop: 12, borderWidth: 1, borderRadius: 12, padding: 12,
  },

  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, paddingBottom: 26,
    borderTopWidth: 1, flexDirection: 'row', gap: 12,
  },
  footerSingle: {
    position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, paddingBottom: 26,
    borderTopWidth: 1,
  },
  refuseBtn: {
    flex: 1, height: 56, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF',
  },
  refuseBtnText: { fontSize: 15, fontWeight: '800' },
  acceptBtn: {
    flex: 1, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  acceptBtnFull: {
    height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  acceptBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  outlineBtnFull: {
    height: 56, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF',
  },
  outlineBtnFullText: { fontSize: 15, fontWeight: '800' },
});
