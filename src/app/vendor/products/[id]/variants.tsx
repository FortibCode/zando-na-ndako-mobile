import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { ArrowLeft, ChevronRight, Plus, Check } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

export default function ProductVariantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProduct, addVariant } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const product = getProduct(id || '');

  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [prix, setPrix] = useState('');
  const [stock, setStock] = useState('');

  if (!product) return null;

  const isValid = label.trim().length > 0 && prix.trim().length > 0;

  const handleAdd = () => {
    if (!isValid) return;
    addVariant(product.id, { label: label.trim(), prix: Number(prix) || 0, stock: Number(stock) || 0, disponible: true });
    setLabel(''); setPrix(''); setStock(''); setAdding(false);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t('vendorVariants.title', 'Variantes du produit')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{product.nom}</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInUp.duration(350).delay(60).springify()} style={[styles.sectionLabel, { color: colors.textTertiary }]}>
          {t('vendorVariants.existingVariants', 'Variantes existantes')}
        </Animated.Text>

        <Animated.View entering={FadeInUp.duration(400).delay(100).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          {product.variantes.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{t('vendorVariants.noVariants', 'Aucune variante pour ce produit.')}</Text>
          ) : (
            product.variantes.map((v, i) => (
              <Animated.View
                key={v.id}
                entering={FadeInLeft.duration(300).delay(140 + i * 70).springify()}
                style={[styles.variantRow, i < product.variantes.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              >
                <View>
                  <Text style={[styles.variantLabel, { color: colors.text }]}>{v.label}</Text>
                  <Text style={[styles.variantStock, { color: colors.success }, !v.disponible && { color: colors.error }]}>
                    {v.disponible && v.stock > 0 ? t('vendorVariants.inStock', 'En stock') : t('vendorVariants.outOfStock', 'Rupture')}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={[styles.variantPrice, { color: colors.text }]}>{v.prix.toLocaleString('fr-FR')} FCFA</Text>
                  <ChevronRight color={colors.textTertiary} size={18} />
                </View>
              </Animated.View>
            ))
          )}
        </Animated.View>

        {adding ? (
          <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.addForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder={t('vendorVariants.labelPlaceholder', 'Label (ex : 500 g)')}
              placeholderTextColor={colors.textTertiary}
              style={[styles.addInput, { borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground }]}
            />
            <View style={styles.addRow}>
              <TextInput
                value={prix}
                onChangeText={(v) => setPrix(v.replace(/[^0-9]/g, ''))}
                placeholder={t('vendorVariants.pricePlaceholder', 'Prix FCFA')}
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                style={[styles.addInput, { flex: 1, borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground }]}
              />
              <TextInput
                value={stock}
                onChangeText={(v) => setStock(v.replace(/[^0-9]/g, ''))}
                placeholder={t('vendorVariants.stockPlaceholder', 'Stock')}
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                style={[styles.addInput, { flex: 1, borderColor: colors.inputBorder, color: colors.text, backgroundColor: colors.inputBackground }]}
              />
            </View>
            <Pressable onPress={handleAdd} disabled={!isValid} style={[styles.confirmAddBtn, { backgroundColor: colors.primary }, !isValid && { opacity: 0.5 }]}>
              <Check color="#FFF" size={16} strokeWidth={3} />
              <Text style={styles.confirmAddText}>{t('vendorVariants.saveVariant', 'Enregistrer la variante')}</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(400).delay(200).springify()}>
            <Pressable onPress={() => setAdding(true)} style={[styles.addBtn, { borderColor: colors.borderStrong, backgroundColor: colors.surface }]}>
              <Plus color={colors.primary} size={18} />
              <Text style={[styles.addBtnText, { color: colors.primary }]}>{t('vendorVariants.addVariant', 'Ajouter une variante')}</Text>
            </Pressable>
          </Animated.View>
        )}

        <Animated.Text entering={FadeInUp.duration(400).delay(260).springify()} style={[styles.note, { color: colors.textTertiary }]}>
          {t('vendorVariants.note', 'Les variantes permettent à vos clients de choisir le poids souhaité.')}
        </Animated.Text>
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
  title: { fontSize: 17, fontWeight: '900' },
  subtitle: { fontSize: 12.5, marginTop: 2 },
  content: { padding: 20, gap: 14, paddingBottom: 30 },

  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  card: {
    borderRadius: 18, paddingHorizontal: 16,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  emptyText: { fontSize: 13.5, textAlign: 'center', paddingVertical: 20 },
  variantRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  variantLabel: { fontSize: 15.5, fontWeight: '800' },
  variantStock: { fontSize: 12.5, fontWeight: '700', marginTop: 3 },
  variantPrice: { fontSize: 14.5, fontWeight: '700' },

  addBtn: {
    height: 54, borderRadius: 16, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  addBtnText: { fontSize: 14.5, fontWeight: '800' },

  addForm: {
    borderRadius: 18, padding: 16, gap: 10,
    borderWidth: 1,
  },
  addInput: {
    height: 48, borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 14, fontSize: 14,
  },
  addRow: { flexDirection: 'row', gap: 10 },
  confirmAddBtn: {
    height: 50, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmAddText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  note: { fontSize: 12.5, textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 },
});
