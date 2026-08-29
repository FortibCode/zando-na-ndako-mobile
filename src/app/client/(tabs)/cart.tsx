import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import { Image } from 'expo-image';
import Animated, {
  FadeInDown, FadeInUp, SlideInDown, FadeIn,
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingCart, Share2, Scooter } from 'lucide-react-native';
import { useClient, type Product } from '@/contexts/client-context';
import { useDiaspora, formatEur, formatUsd } from '@/contexts/diaspora-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { Palette, Spacing, Radii, Shadows } from '@/design/tokens';
import { EmptyState } from '@/components/lottie-animations';
import { ApiError, sharePanier, viderPanier, ajouterAuPanier, FALLBACK_DELIVERY_FEE } from '@/services/api';

function CartItem({ product, quantity, index }: { product: Product; quantity: number; index: number }) {
  const { changeQuantity } = useClient();
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const lineTotal = product.price * quantity;

  return (
<Animated.View
      entering={FadeInDown.duration(350).delay(index * 70).springify()}
      style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }, animStyle]}
    >
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}
      >
        <View style={[styles.imageWrap, { backgroundColor: colors.backgroundAlt }]}>
          <Image
            accessibilityLabel={product.name}
            contentFit="cover"
            source={{ uri: product.image }}
            style={styles.productImage}
          />
        </View>
<View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{product.name}</Text>
          <Text style={[styles.unitPrice, { color: colors.textSecondary }]}>{product.price.toLocaleString('fr-FR')} FCFA/{product.unit.replace(/^FCFA\/?/, '') || 'unité'}</Text>

          {/* Quantity control */}
          <View style={styles.quantityRow}>
            <Pressable
              onPress={() => changeQuantity(product.id, -1)}
              style={[styles.qBtn, { borderColor: colors.border, backgroundColor: colors.backgroundAlt }]}
              accessibilityLabel="Réduire quantité"
            >
              {quantity === 1
                ? <Trash2 color={colors.error} size={14} />
                : <Minus color={colors.primary} size={14} />
              }
            </Pressable>
            <Text style={[styles.qValue, { color: colors.text }]}>{quantity}</Text>
            <Pressable
              onPress={() => changeQuantity(product.id, 1)}
              style={[styles.qBtn, styles.qBtnPlus, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              accessibilityLabel="Augmenter quantité"
            >
              <Plus color="#FFF" size={14} />
            </Pressable>
          </View>
        </View>

        <View style={styles.priceCol}>
          <Text style={[styles.lineTotal, { color: colors.primary }]}>{lineTotal.toLocaleString('fr-FR')}</Text>
          <Text style={[styles.lineTotalCurrency, { color: colors.textSecondary }]}>FCFA</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CartScreen() {
  const { products, cart, subtotal, clearCart, isDiaspora, selectedAddress, resolveZoneForAddress } = useClient();
  const { selectedBeneficiary, diasporaModeActive } = useDiaspora();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [sharing, setSharing] = useState(false);

  const items = Object.entries(cart)
    .map(([id, quantity]) => ({ product: products.find((p) => p.id === id)!, quantity }))
    .filter((i) => i.product);

  const deliveryFee = Number(resolveZoneForAddress(selectedAddress)?.frais_livraison_base) || FALLBACK_DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  const handleShareCart = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const destinataire = selectedBeneficiary?.nom ? ` à ${selectedBeneficiary.nom}` : '';
      let messageText = '';
      try {
        // Le panier partagé côté serveur doit refléter le panier local avant de générer le lien,
        // sinon le lien pointe vers un panier serveur vide ou périmé (même correctif que web).
        await viderPanier().catch(() => {});
        for (const { product, quantity } of items) {
          await ajouterAuPanier(product.id, quantity);
        }
        const { lien } = await sharePanier();
        messageText = `Voici le panier que je souhaite vous envoyer${destinataire} via Zando na Ndako (${total.toLocaleString('fr-FR')} FCFA) : ${lien}`;
      } catch (_apiErr) {
        const itemList = items.map((i) => `• ${i.product.name} (x${i.quantity})`).join('\n');
        messageText = `Voici mon panier Zando na Ndako${destinataire} (${total.toLocaleString('fr-FR')} FCFA) :\n${itemList}`;
      }
      const webNavigator = Platform.OS === 'web' ? (navigator as any) : null;
      if (webNavigator && !webNavigator.share) {
        // La plupart des navigateurs desktop (Chrome/Firefox/Edge desktop) n'implémentent pas
        // `navigator.share` — Share.share() y échoue systématiquement avec "not supported". On copie
        // le message dans le presse-papiers à la place plutôt que de laisser le bouton ne rien faire.
        await webNavigator.clipboard.writeText(messageText);
        alert(t('cartExtra.shareCopiedTitle', 'Lien copié !'), t('cartExtra.shareCopiedDesc', 'Le message a été copié dans le presse-papiers — colle-le où tu veux l’envoyer.'));
      } else {
        await Share.share({ message: messageText });
      }
    } catch (error) {
      alert('Erreur', error instanceof ApiError ? error.message : t('cartExtra.shareError', 'Impossible de partager le panier pour le moment.'));
    } finally {
      setSharing(false);
    }
  }, [sharing, selectedBeneficiary, total, items, t]);

if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
            <ArrowLeft color={colors.primary} size={24} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Mon panier</Text>
        </View>
        <Animated.View entering={FadeIn.duration(600).springify()} style={styles.empty}>
          <EmptyState title={t('cart.empty', 'Votre panier est vide')} message={t('cart.emptySub', 'Ajoutez des produits pour commencer')} size={130} />
<Pressable onPress={() => router.back()} style={[styles.emptyButton, { backgroundColor: colors.primary }]}>
            <ShoppingCart color="#FFF" size={18} />
            <Text style={styles.emptyButtonText}>{t('cart.emptyBtn', 'Découvrir nos produits')}</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('cart.title', 'Mon panier')} ({items.length})</Text>
        <Pressable
          onPress={() => alert(t('cart.clearTitle', 'Vider le panier ?'), t('cart.clearMsg', 'Tous les articles seront supprimés.'), [
            { text: t('common.cancel', 'Annuler'), style: 'cancel' },
            { text: t('common.remove', 'Retirer'), style: 'destructive', onPress: clearCart },
          ])}
          style={styles.clearBtn}
        >
          <Trash2 color={colors.error} size={18} />
        </Pressable>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Items */}
        {items.map(({ product, quantity }, index) => (
          <CartItem key={product.id} product={product} quantity={quantity} index={index} />
        ))}

        {/* Summary */}
<Animated.View
          entering={FadeInUp.duration(350).delay(items.length * 70 + 160).springify()}
          style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.summaryTitle, { color: colors.text }]}>{t('cart.summary', 'Résumé')}</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('cart.subtotal', 'Sous-total')} ({items.length} articles)</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{subtotal.toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('cart.deliveryFee', 'Frais de livraison')}</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{deliveryFee.toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>{t('cart.total', 'Total à payer')}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.totalValue, { color: colors.primary }]}>{total.toLocaleString('fr-FR')} FCFA</Text>
              {diasporaModeActive && (
                <Text style={{ color: colors.textSecondary, fontSize: 12.5, fontWeight: '600', marginTop: 2 }}>
                  ≈ {formatEur(total)} · ≈ {formatUsd(total)}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Delivery note */}
<Animated.View
          entering={FadeInUp.duration(350).delay(items.length * 70 + 200).springify()}
          style={[styles.deliveryNote, { backgroundColor: colors.primarySoft }]}
        >
          <Scooter color={colors.primary} size={16} />
          <Text style={[styles.deliveryNoteText, { color: colors.primary }]}>
            {t('cartExtra.deliveryNote', 'Livraison en 30–60 min · Zone : Brazzaville uniquement')}
          </Text>
        </Animated.View>

        {isDiaspora && (
          <Animated.View entering={FadeInUp.duration(350).delay(items.length * 70 + 240).springify()}>
            <Pressable
              disabled={sharing}
              onPress={handleShareCart}
              style={[styles.shareCartBtn, { borderColor: colors.border, backgroundColor: colors.surface, opacity: sharing ? 0.6 : 1 }]}
            >
              <Share2 color={colors.primary} size={18} />
              <Text style={[styles.shareCartText, { color: colors.primary }]}>
                {sharing ? t('cartExtra.sharing', 'Partage en cours…') : t('cartExtra.shareCart', 'Partager ce panier avec le bénéficiaire')}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      {/* Footer Button */}
      <Animated.View entering={SlideInDown.duration(400).springify()} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.footerTotal}>
          <Text style={[styles.footerTotalLabel, { color: colors.textSecondary }]}>{t('cart.total', 'Total à payer')}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.footerTotalValue, { color: colors.text }]}>{total.toLocaleString('fr-FR')} FCFA</Text>
            {diasporaModeActive && (
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 1 }}>
                ≈ {formatEur(total)} · ≈ {formatUsd(total)}
              </Text>
            )}
          </View>
        </View>
        <Pressable
          onPress={() => router.push(
            (isDiaspora ? '/client/diaspora/checkout/address' : '/client/checkout/address') as any
          )}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <ShoppingCart color="#FFF" size={18} />
          <Text style={styles.buttonText}>
            {isDiaspora ? t('diaspora.sendForRelative', 'Commander pour un proche') : t('cart.checkout', 'Commander maintenant')}
          </Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.canvas },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.xl, paddingTop: Spacing.md, backgroundColor: Palette.surface,
    borderBottomWidth: 1, borderBottomColor: Palette.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: Radii.sm,
    backgroundColor: Palette.navySoft, alignItems: 'center', justifyContent: 'center',
  },
  title: { color: Palette.navy, fontSize: 22, fontWeight: '900', flex: 1 },
  clearBtn: { padding: 6 },
  content: { padding: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.md, paddingBottom: 20 },

  // Cart item
  item: {
    backgroundColor: Palette.surface, borderRadius: Radii.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Palette.border,
    ...Shadows.soft,
  },
  imageWrap: { width: 90, height: 90, borderRadius: Radii.md, overflow: 'hidden', backgroundColor: Palette.canvas },
  productImage: { width: '100%', height: '100%' },
  info: { flex: 1 },
  name: { color: Palette.navy, fontSize: 15.5, fontWeight: '800' },
  unitPrice: { color: Palette.muted, fontSize: 12, marginTop: 4 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  qBtn: {
    width: 30, height: 30, borderRadius: Spacing.sm,
    borderWidth: 1, borderColor: Palette.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Palette.canvas,
  },
  qBtnPlus: { backgroundColor: Palette.navy, borderColor: Palette.navy },
  qValue: { color: Palette.navy, fontSize: 15, fontWeight: '800', minWidth: 22, textAlign: 'center' },
  priceCol: { alignItems: 'flex-end', justifyContent: 'center', paddingLeft: 4 },
  lineTotal: { color: Palette.coral, fontSize: 16, fontWeight: '900' },
  lineTotalCurrency: { color: Palette.muted, fontSize: 11, marginTop: 2 },

  // Summary
  summary: {
    backgroundColor: Palette.surface, borderRadius: Radii.md,
    padding: Spacing.xl, borderWidth: 1, borderColor: Palette.border,
    ...Shadows.soft,
  },
  summaryTitle: { color: Palette.navy, fontSize: 18, fontWeight: '900', marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  summaryLabel: { color: Palette.muted, fontSize: 15 },
  summaryValue: { color: Palette.navy, fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Palette.border, marginVertical: Spacing.sm },
  totalLabel: { color: Palette.navy, fontSize: 18, fontWeight: '900' },
  totalValue: { color: Palette.coral, fontSize: 18, fontWeight: '900' },

  // Delivery note
  deliveryNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Palette.navySoft, borderRadius: Radii.sm,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
  },
  deliveryNoteText: { color: Palette.navy, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  shareCartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: Spacing.md, paddingVertical: 14, borderRadius: Radii.md, borderWidth: 1.5,
  },
  shareCartText: { fontSize: 13.5, fontWeight: '700' },

  // Footer
  footer: {
    padding: Spacing.xl, paddingBottom: 26,
    backgroundColor: Palette.surface, borderTopWidth: 1, borderTopColor: Palette.border,
  },
  footerTotal: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  footerTotalLabel: { color: Palette.muted, fontSize: 15, fontWeight: '600' },
  footerTotalValue: { color: Palette.navy, fontSize: 18, fontWeight: '900' },
  button: {
    height: 58, borderRadius: Radii.md,
    backgroundColor: Palette.coral, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    ...Shadows.elevated,
  },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: '900' },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: Spacing.lg },
  emptyButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Palette.coral, borderRadius: Radii.md,
    paddingVertical: Spacing.lg, paddingHorizontal: 28,
    ...Shadows.elevated,
  },
  emptyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
