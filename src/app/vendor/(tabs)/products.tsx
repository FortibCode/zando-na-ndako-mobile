import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Search, Plus } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { EmptyState } from '@/components/lottie-animations';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VendorProductsScreen() {
  const { products } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => products.filter((p) => p.nom.toLowerCase().includes(query.trim().toLowerCase())),
    [products, query]
  );

  const prixRupture = products.filter((p) => !p.disponible || p.stock === 0).length;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorProductsList.title', 'Mes produits')}</Text>
        {prixRupture > 0 && (
          <View style={[styles.rupturePill, { backgroundColor: colors.error + '14' }]}>
            <Text style={[styles.rupturePillText, { color: colors.error }]}>{prixRupture} {t('vendorProductsList.ruptureSuffix', 'rupture')}</Text>
          </View>
        )}
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(60).springify()} style={[styles.searchRow, { backgroundColor: colors.surface }]}>
        <View style={[styles.search, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}>
          <Search color={colors.textTertiary} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('vendorProductsList.searchPlaceholder', 'Rechercher un produit')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(400).springify()}>
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <EmptyState title={t('vendorProductsList.emptyTitle', 'Aucun produit')} message={t('vendorProductsList.emptyDesc', 'Ajoutez votre premier produit pour commencer à vendre.')} size={120} />
            </View>
          </Animated.View>
        ) : (
          filtered.map((product, index) => {
            const isOutOfStock = !product.disponible || product.stock === 0;
            return (
              <Animated.View key={product.id} entering={FadeInDown.duration(350).delay(index * 60).springify()}>
                <Pressable
                  onPress={() => router.push(
                    (isOutOfStock ? `/vendor/products/${product.id}/out-of-stock` : `/vendor/products/${product.id}/edit`) as any
                  )}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
                >
                  <Image
                    accessibilityLabel={product.nom}
                    contentFit="cover"
                    source={{ uri: product.image }}
                    style={styles.image}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.text }]}>{product.nom}</Text>
                    <Text style={[styles.price, { color: colors.primary }]}>{product.prix.toLocaleString('fr-FR')} FCFA/{product.unite}</Text>
                    <Text style={[styles.stock, { color: colors.textSecondary }]}>{t('vendorProductsList.stockLabel', 'Stock :')} {product.stock} {product.unite}</Text>
                  </View>
                  <View style={[styles.badge, isOutOfStock ? { backgroundColor: colors.error + '14' } : { backgroundColor: colors.freshSoft }]}>
                    <Text style={[styles.badgeText, isOutOfStock ? { color: colors.error } : { color: colors.success }]}>
                      {isOutOfStock ? t('vendorProductsList.outOfStock', 'Rupture') : t('vendorProductsList.active', 'Actif')}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).delay(300).springify()} style={styles.footer}>
<Pressable onPress={() => router.push('/vendor/products/add' as any)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Plus color={colors.white} size={18} />
          <Text style={[styles.addBtnText, { color: colors.white }]}>{t('vendorProductsList.addProduct', 'Ajouter un produit')}</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    padding: 20, borderBottomWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  title: { fontSize: 22, fontWeight: '900', flex: 1 },
  rupturePill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  rupturePillText: { fontSize: 11.5, fontWeight: '800' },

  searchRow: { flexDirection: 'row', gap: 10, padding: 20, paddingBottom: 10 },
  search: {
    flex: 1, height: 48, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },

  content: { padding: 20, paddingTop: 10, gap: 12, paddingBottom: 100 },
  emptyBox: { borderRadius: 20, padding: 10, borderWidth: 1, alignItems: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 14,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
image: { width: 60, height: 60, borderRadius: 14 },
  name: { fontSize: 15.5, fontWeight: '800' },
  price: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  stock: { fontSize: 12, marginTop: 3 },
  badge: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 11.5, fontWeight: '800' },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: 26 },
  addBtn: {
    height: 58, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
addBtnText: { fontSize: 16, fontWeight: '800' },
});
