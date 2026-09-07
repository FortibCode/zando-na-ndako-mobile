import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, ZoomIn, SlideInDown,
  useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming,
} from 'react-native-reanimated';
import { ArrowLeft, Heart, ShoppingCart, Star, MapPin, Check, Plus, Minus, Store, ChevronRight } from 'lucide-react-native';
import { useClient, mapApiProduitToProduct, type Product } from '@/contexts/client-context';
import { BLUE, RED } from '@/components/client-ui';
import { useDiaspora, formatEur, formatUsd } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from '@/contexts/theme-context';
import { Palette, Spacing, Radii, Shadows } from '@/design/tokens';
import { fetchProduitDetail } from '@/services/api';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, addToCart, toggleFavorite, isFavorite } = useClient();
  const localProduct = products.find((p) => p.id === id);
  const { diasporaModeActive } = useDiaspora();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const [added, setAdded] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Le produit peut ne pas être dans la liste générale déjà chargée (ex: venu du carrousel promo/
  // populaires, alimenté par un autre endpoint) — on va alors le chercher directement par id plutôt
  // que d'afficher silencieusement un produit différent au hasard (ancien bug : `|| products[0]`).
  useEffect(() => {
    if (localProduct || !id) return;
    let cancelled = false;
    fetchProduitDetail(id)
      .then((p) => { if (!cancelled) setFetchedProduct(mapApiProduitToProduct(p)); })
      .catch(() => { if (!cancelled) setNotFound(true); });
    return () => { cancelled = true; };
  }, [id, localProduct]);

  const product = localProduct || fetchedProduct;

  const btnScale = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const imageScale = useSharedValue(1);

  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));
  const imageStyle = useAnimatedStyle(() => ({ transform: [{ scale: imageScale.value }] }));

  const [selectedQuantity, setSelectedQuantity] = useState<number>(
    product?.quantiteMinimale ?? (product?.uniteMesure === 'kg' ? 0.5 : 1)
  );

  const isKgProduct = product?.uniteMesure === 'kg' || (product?.pasQuantite ?? 1) < 1;

  const WEIGHT_OPTIONS = [
    { qty: 0.25, label: '250g (1/4 kg)' },
    { qty: 0.5, label: '500g (1/2 kg)' },
    { qty: 1, label: '1 kg' },
    { qty: 1.5, label: '1,5 kg' },
    { qty: 2, label: '2 kg' },
  ];

  const handleAdd = () => {
    if (!product) return;
    btnScale.value = withSequence(
      withSpring(1.08, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );
    addToCart(product.id, selectedQuantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (!product) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Text style={[styles.title, { color: colors.text }]}>
          {notFound
            ? t('productExtra.notFound', 'Produit introuvable.')
            : t('productExtra.loadingProduct', 'Chargement du produit…')}
        </Text>
        {notFound && (
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: BLUE, fontWeight: '800' }}>{t('common.back', 'Retour')}</Text>
          </Pressable>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Actions */}
        <Animated.View
          entering={FadeInDown.duration(300).springify()}
          style={styles.top}
        >
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ArrowLeft color={BLUE} size={27} />
          </Pressable>
          <Pressable
            onPress={() => toggleFavorite(product.id)}
            onPressIn={() => { heartScale.value = withSpring(0.85); }}
            onPressOut={() => { heartScale.value = withSpring(1); }}
          >
            <Animated.View style={heartStyle}>
              <Heart color={BLUE} size={27} fill={isFavorite(product.id) ? BLUE : 'none'} />
            </Animated.View>
          </Pressable>
        </Animated.View>

        {/* Hero Image */}
        <Animated.View
          entering={ZoomIn.duration(500).springify()}
          style={[styles.hero, { backgroundColor: colors.backgroundAlt }, imageStyle]}
        >
          <Image accessibilityLabel={product.name} contentFit="cover" source={{ uri: product.image }} style={styles.heroImage} />
        </Animated.View>

        {/* Product Info */}
        <Animated.Text
          entering={FadeInDown.duration(400).delay(200).springify()}
          style={[styles.title, { color: colors.text }]}
        >
          {product.name}
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.duration(400).delay(250).springify()}
          style={styles.ratingRow}
        >
          {product.reviews > 0 ? (
            <>
              <Star color="#F5A623" size={20} fill="#F5A623" />
              <Text style={styles.rating}>
                {product.rating} <Text style={[styles.ratingText, { color: colors.textSecondary }]}>({product.reviews} {t('productExtra.reviewsSuffix', 'avis')})</Text>
              </Text>
            </>
          ) : (
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{t('productExtra.noReviews', 'Aucun avis pour le moment')}</Text>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(300).springify()}
          style={styles.priceRow}
        >
          <View>
            <Text style={styles.price}>
              {product.price.toLocaleString('fr-FR')} <Text style={[styles.unit, { color: colors.textSecondary }]}>{product.unit}</Text>
            </Text>
            {diasporaModeActive && (
              <Text style={[styles.priceEquivalent, { color: colors.textSecondary }]}>
                {formatEur(product.price)} · {formatUsd(product.price)}
              </Text>
            )}
          </View>
          <View style={[styles.stockBadge, !product.stock && styles.outOfStockBadge]}>
            {product.stock ? <Check color="#159A53" size={14} /> : null}
            <Text style={[styles.stockText, !product.stock && styles.outOfStockText]}>
              {product.stock ? t('product.inStock', 'En stock') : t('product.outOfStock', 'Rupture')}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(400).delay(350).springify()}
          style={[styles.divider, { backgroundColor: colors.border }]}
        />

        {/* Description */}
        <Animated.View entering={FadeInUp.duration(400).delay(400).springify()}>
          <Text style={[styles.heading, { color: colors.text }]}>{t('product.description', 'Description')}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {product.description || t('productExtra.defaultDescription', 'Produit frais sélectionné avec soin. Idéal pour des repas sains et savoureux.')}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(450).springify()}>
          <Text style={[styles.heading, { color: colors.text }]}>{t('product.origin', 'Origine')}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            <MapPin color={colors.textTertiary} size={16} /> {product.origin || t('productExtra.defaultOrigin', 'Pointe-Noire, Congo')}
          </Text>
        </Animated.View>

        {/* Boutique */}
        {product.vendorId && (
          <Animated.View entering={FadeInUp.duration(400).delay(470).springify()}>
            <Pressable
              onPress={() => router.push(`/client/boutique/${product.vendorId}` as any)}
              style={[styles.vendorRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.vendorIcon, { backgroundColor: colors.primarySoft }]}><Store color={BLUE} size={18} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.vendorLabel, { color: colors.textSecondary }]}>{t('productExtra.soldBy', 'Vendu par')}</Text>
                <Text style={[styles.vendorName, { color: colors.text }]}>{product.vendorName}</Text>
              </View>
              <ChevronRight color={colors.textTertiary} size={18} />
            </Pressable>
          </Animated.View>
        )}

        {/* Quantity / Weight portion selector */}
        {isKgProduct ? (
          <Animated.View entering={FadeInUp.duration(400).delay(480).springify()} style={{ marginTop: 24 }}>
            <Text style={[styles.heading, { color: colors.text, marginBottom: 10 }]}>
              Choisissez le poids souhaité :
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {WEIGHT_OPTIONS.map((opt) => {
                const selected = selectedQuantity === opt.qty;
                return (
                  <Pressable
                    key={opt.qty}
                    onPress={() => setSelectedQuantity(opt.qty)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primarySoft : colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13.5,
                        fontWeight: selected ? '900' : '600',
                        color: selected ? colors.primary : colors.text,
                      }}
                    >
                      {opt.label}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginTop: 2 }}>
                      {Math.round(product.price * opt.qty).toLocaleString('fr-FR')} FCFA
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(400).delay(480).springify()} style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[styles.heading, { color: colors.text }]}>Quantité :</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
              <Pressable onPress={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}>
                <Minus color={colors.primary} size={18} />
              </Pressable>
              <Text style={{ fontSize: 16, fontWeight: '900', color: colors.text }}>{selectedQuantity}</Text>
              <Pressable onPress={() => setSelectedQuantity(selectedQuantity + 1)}>
                <Plus color={colors.primary} size={18} />
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Add to Cart Button */}
        <Animated.View
          entering={SlideInDown.duration(500).delay(500).springify()}
          style={btnStyle}
        >
          <Pressable
            onPress={handleAdd}
            onPressIn={() => { btnScale.value = withSpring(0.96); }}
            onPressOut={() => { btnScale.value = withSpring(1); }}
            style={styles.button}
          >
            {added ? <Check color="#FFF" size={22} /> : <ShoppingCart color="#FFF" size={22} />}
            <Text style={styles.buttonText}>
              {added ? t('product.added', 'Ajouté') : t('product.addToCart', 'Ajouter au panier')}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: 30 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  hero: {
    height: 300,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    ...Shadows.soft,
  },
  heroImage: { width: '100%', height: '100%' },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 22,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
  },
  rating: { color: Palette.gold, fontSize: 20, fontWeight: '700' },
  ratingText: { fontSize: 15, fontWeight: '500' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
  },
  price: { color: Palette.coral, fontSize: 30, fontWeight: '800' },
  unit: { fontSize: 16, fontWeight: '500' },
  priceEquivalent: { fontSize: 13.5, fontWeight: '600', marginTop: 2 },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.freshSoft,
    borderRadius: Radii.full,
    paddingHorizontal: Radii.md,
    paddingVertical: Spacing.sm,
  },
  stockText: { color: Palette.fresh, fontWeight: '800', fontSize: 13 },
  outOfStockBadge: { backgroundColor: Palette.coralSoft },
  outOfStockText: { color: Palette.coral },
  divider: { height: 1, marginVertical: 22 },
  vendorRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginTop: Spacing.lg, padding: Spacing.md, borderRadius: Radii.md,
    borderWidth: 1,
  },
  vendorIcon: {
    width: 38, height: 38, borderRadius: Radii.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  vendorLabel: { fontSize: 11, fontWeight: '700' },
  vendorName: { fontSize: 15, fontWeight: '800', marginTop: 1 },
  heading: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: Spacing.lg,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    marginTop: Spacing.sm,
  },
  button: {
    height: 62,
    borderRadius: 31,
    backgroundColor: Palette.coral,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: 32,
    ...Shadows.elevated,
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});
