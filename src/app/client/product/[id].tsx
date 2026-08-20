import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, ZoomIn, SlideInDown,
  useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming,
} from 'react-native-reanimated';
import { ArrowLeft, Heart, ShoppingCart, Star, MapPin, Check, Plus, Minus } from 'lucide-react-native';
import { useClient } from '@/contexts/client-context';
import { BLUE, RED } from '@/components/client-ui';
import { useDiaspora, formatEur, formatUsd } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';
import { Palette, Spacing, Radii, Shadows } from '@/design/tokens';
import { useState } from 'react';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, addToCart, toggleFavorite, isFavorite } = useClient();
  const product = products.find((p) => p.id === id) || products[0];
  const { diasporaModeActive } = useDiaspora();
  const { t } = useLanguage();
  const [added, setAdded] = useState(false);

  const btnScale = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const imageScale = useSharedValue(1);

  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));
  const imageStyle = useAnimatedStyle(() => ({ transform: [{ scale: imageScale.value }] }));

  const handleAdd = () => {
    btnScale.value = withSequence(
      withSpring(1.08, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );
    addToCart(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (!product) {
    return (
      <SafeAreaView style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar style="dark" />
        <Text style={styles.title}>{t('productExtra.loadingProduct', 'Chargement du produit…')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
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
          style={[styles.hero, imageStyle]}
        >
          <Image accessibilityLabel={product.name} contentFit="cover" source={{ uri: product.image }} style={styles.heroImage} />
        </Animated.View>

        {/* Product Info */}
        <Animated.Text
          entering={FadeInDown.duration(400).delay(200).springify()}
          style={styles.title}
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
                {product.rating} <Text style={styles.ratingText}>({product.reviews} {t('productExtra.reviewsSuffix', 'avis')})</Text>
              </Text>
            </>
          ) : (
            <Text style={styles.ratingText}>{t('productExtra.noReviews', 'Aucun avis pour le moment')}</Text>
          )}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(300).springify()}
          style={styles.priceRow}
        >
          <View>
            <Text style={styles.price}>
              {product.price.toLocaleString('fr-FR')} <Text style={styles.unit}>{product.unit}</Text>
            </Text>
            {diasporaModeActive && (
              <Text style={styles.priceEquivalent}>
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
          style={styles.divider}
        />

        {/* Description */}
        <Animated.View entering={FadeInUp.duration(400).delay(400).springify()}>
          <Text style={styles.heading}>{t('product.description', 'Description')}</Text>
          <Text style={styles.description}>
            {product.description || t('productExtra.defaultDescription', 'Produit frais sélectionné avec soin. Idéal pour des repas sains et savoureux.')}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(450).springify()}>
          <Text style={styles.heading}>{t('product.origin', 'Origine')}</Text>
          <Text style={styles.description}>
            <MapPin color="#435271" size={16} /> {product.origin || t('productExtra.defaultOrigin', 'Pointe-Noire, Congo')}
          </Text>
        </Animated.View>

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
            <ShoppingCart color="#FFF" size={22} />
            <Text style={styles.buttonText}>
              {added ? t('product.added', 'Ajouté ✓') : t('product.addToCart', 'Ajouter au panier')}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.surface },
  content: { padding: Spacing.xl, paddingBottom: 30 },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  hero: {
    height: 300,
    borderRadius: Radii.xl,
    backgroundColor: Palette.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    ...Shadows.soft,
  },
  heroImage: { width: '100%', height: '100%' },
  title: {
    color: Palette.ink,
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
  ratingText: { color: Palette.muted, fontSize: 15, fontWeight: '500' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
  },
  price: { color: Palette.coral, fontSize: 30, fontWeight: '800' },
  unit: { fontSize: 16, fontWeight: '500', color: Palette.muted },
  priceEquivalent: { fontSize: 13.5, fontWeight: '600', color: Palette.muted, marginTop: 2 },
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
  divider: { height: 1, backgroundColor: Palette.border, marginVertical: 22 },
  heading: {
    color: Palette.ink,
    fontSize: 19,
    fontWeight: '800',
    marginTop: Spacing.lg,
  },
  description: {
    color: Palette.slate,
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
