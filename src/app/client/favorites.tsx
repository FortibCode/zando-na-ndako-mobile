import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react-native';
import { useClient } from '@/contexts/client-context';
import { ProductCard } from '@/components/client-ui';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { EmptyState } from '@/components/lottie-animations';

export default function FavoritesScreen() {
  const { products, favorites, addToCart } = useClient();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const favProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t('favorites.title', 'Mes favoris')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{favProducts.length} {t('favorites.savedCount', 'produit(s) sauvegardé(s)')}</Text>
        </View>
<View style={[styles.heartIcon, { backgroundColor: isDark ? 'rgba(237,28,36,0.18)' : '#FEE2E2' }]}>
          <Heart color={colors.error} fill={colors.error} size={20} />
        </View>
      </Animated.View>

      {favProducts.length === 0 ? (
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.empty}>
          <EmptyState
            title={t('favorites.emptyTitle', 'Aucun favori')}
            message={t('favorites.emptyDesc', "Appuyez sur ❤️ sur un produit pour l'ajouter à vos favoris")}
            size={130}
          />
          <Pressable onPress={() => router.back()} style={[styles.browseBtn, { backgroundColor: colors.primary }]}>
            <ShoppingBag color="#FFF" size={18} />
            <Text style={styles.browseBtnText}>{t('favorites.browse', 'Explorer les produits')}</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {favProducts.map((product, index) => (
              <Animated.View
                key={product.id}
                entering={FadeInDown.duration(380).delay(index * 60).springify()}
                style={styles.cardWrap}
              >
                <ProductCard
                  product={product}
                  onAdd={() => addToCart(product.id)}
                />
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 18, paddingTop: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { fontSize: 12, marginTop: 1 },
  heartIcon: {
    marginLeft: 'auto', width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { padding: 18, paddingBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  cardWrap: { width: '47%' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 18,
    paddingVertical: 16, paddingHorizontal: 28,
    shadowColor: '#FF4500', shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  browseBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
