import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, AlertTriangle } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductOutOfStockScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProduct } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const product = getProduct(id || '');

  if (!product) return null;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorOutOfStock.title', 'Rupture de stock')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).delay(60).springify()} style={styles.productRow}>
          <Image accessibilityLabel={product.nom} contentFit="cover" source={{ uri: product.image }} style={styles.productImage} />
          <Text style={[styles.productName, { color: colors.text }]}>{product.nom}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(120).springify()} style={[styles.banner, { backgroundColor: colors.error }]}>
<Text style={[styles.bannerText, { color: colors.white }]}>{t('vendorOutOfStock.bannerText', 'RUPTURE DE STOCK')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(180).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('vendorOutOfStock.currentStock', 'Stock actuel')}</Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>{product.stock} {product.unite}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(220).springify()} style={styles.warning}>
          <AlertTriangle color={colors.warning} size={16} />
          <Text style={[styles.warningText, { color: colors.error }]}>{t('vendorOutOfStock.unavailableNote', "Ce produit n'est plus disponible à la vente.")}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(260).springify()}>
          <Text style={[styles.updateLabel, { color: colors.text }]}>{t('vendorOutOfStock.lastUpdate', 'Dernière mise à jour')}</Text>
          <Text style={[styles.updateValue, { color: colors.textSecondary }]}>{product.derniereMaj || '—'}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(320).springify()} style={{ gap: 12, marginTop: 8 }}>
<Pressable onPress={() => router.push(`/vendor/products/${product.id}/stock` as any)} style={[styles.restockBtn, { backgroundColor: colors.primary }]}>
            <Text style={[styles.restockBtnText, { color: colors.white }]}>{t('vendorOutOfStock.restock', 'Réapprovisionner')}</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/vendor/products/${product.id}/edit` as any)} style={[styles.editBtn, { borderColor: colors.primary, backgroundColor: colors.surface }]}>
            <Text style={[styles.editBtnText, { color: colors.primary }]}>{t('vendorOutOfStock.editProduct', 'Modifier le produit')}</Text>
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
    padding: 20, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '900' },
  content: { padding: 20, gap: 16, paddingBottom: 30 },

  productRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
productImage: { width: 64, height: 64, borderRadius: 14 },
  productName: { fontSize: 19, fontWeight: '900' },

  banner: {
    height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  bannerText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  card: {
    borderRadius: 16, padding: 18,
    borderWidth: 1,
  },
  cardLabel: { fontSize: 13, fontWeight: '600' },
  cardValue: { fontSize: 24, fontWeight: '900', marginTop: 6 },

  warning: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  warningText: { fontSize: 13.5, fontWeight: '700', flex: 1 },

  updateLabel: { fontSize: 14, fontWeight: '800' },
  updateValue: { fontSize: 14, marginTop: 4 },

  restockBtn: {
    height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
restockBtnText: { fontSize: 16, fontWeight: '800' },
  editBtn: { height: 56, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontSize: 15, fontWeight: '800' },
});
