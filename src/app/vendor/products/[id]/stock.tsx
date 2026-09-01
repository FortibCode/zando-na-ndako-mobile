import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeInDown, FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { ArrowLeft, Plus, Minus } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProductStockScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProduct, adjustStock } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const product = getProduct(id || '');
  const [addQty, setAddQty] = useState('');
  const [removeQty, setRemoveQty] = useState('');
  const [showAllHistory, setShowAllHistory] = useState(false);

  if (!product) return null;

  const handleAdd = () => {
    const n = Number(addQty);
    if (!n) return;
    setAddQty('');
    adjustStock(product.id, n, 'ajout').catch((e: any) => {
      alert('Erreur', e.message || t('vendorStock.updateErrorDesc', 'Impossible de mettre à jour le stock.'));
    });
  };

  const handleRemove = () => {
    const n = Number(removeQty);
    if (!n) return;
    setRemoveQty('');
    adjustStock(product.id, n, 'retrait').catch((e: any) => {
      alert('Erreur', e.message || t('vendorStock.updateErrorDesc', 'Impossible de mettre à jour le stock.'));
    });
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{t('vendorStock.title', 'Stock du produit')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{product.nom}</Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).delay(60).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('vendorStock.currentStock', 'Stock actuel')}</Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>{product.stock} {product.unite}</Text>
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(400).delay(120).springify()} style={[styles.sectionLabel, { color: colors.text }]}>
          {t('vendorStock.addStockSection', 'Ajouter du stock')}
        </Animated.Text>
        <Animated.View entering={FadeInUp.duration(400).delay(140).springify()} style={styles.adjustRow}>
          <TextInput
            value={addQty}
            onChangeText={(v) => setAddQty(v.replace(/[^0-9]/g, ''))}
            placeholder={t('vendorStock.addPlaceholder', 'Ajouter du stock')}
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            style={[styles.adjustInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
          />
<Pressable onPress={handleAdd} style={[styles.addBtn, { backgroundColor: colors.freshSoft }]}>
            <Plus color={colors.success} size={20} strokeWidth={3} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(180).springify()} style={styles.adjustRow}>
          <TextInput
            value={removeQty}
            onChangeText={(v) => setRemoveQty(v.replace(/[^0-9]/g, ''))}
            placeholder={t('vendorStock.removePlaceholder', 'Retirer du stock')}
            placeholderTextColor={colors.error}
            keyboardType="number-pad"
            style={[styles.adjustInput, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.error }]}
          />
<Pressable onPress={handleRemove} style={[styles.removeBtn, { backgroundColor: colors.error + '1A' }]}>
            <Minus color={colors.error} size={20} strokeWidth={3} />
          </Pressable>
        </Animated.View>

        <Animated.Text entering={FadeInUp.duration(400).delay(240).springify()} style={[styles.sectionLabel, { color: colors.text }]}>
          {t('vendorStock.movementHistory', 'Historique des mouvements')}
        </Animated.Text>
        <Animated.View entering={FadeInUp.duration(400).delay(260).springify()} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {product.mouvements.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{t('vendorStock.noMovements', 'Aucun mouvement pour ce produit.')}</Text>
          ) : (
            (showAllHistory ? product.mouvements : product.mouvements.slice(0, 5)).map((m, i, arr) => (
              <Animated.View
                key={m.id}
                entering={FadeInLeft.duration(300).delay(300 + i * 60).springify()}
                style={[styles.moveRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <Text style={[styles.moveSign, { color: m.quantite >= 0 ? colors.success : colors.error }]}>
                  {m.quantite >= 0 ? '+' : ''}{m.quantite} {product.unite}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.moveType, { color: colors.textSecondary }]}>
                    {m.type === 'ajout' ? t('vendorStock.manualAdd', 'Ajout manuel') : m.type === 'retrait' ? t('vendorStock.manualRemove', 'Retrait manuel') : t('vendorStock.sale', 'Vente')}
                  </Text>
                </View>
                <Text style={[styles.moveDate, { color: colors.textTertiary }]}>{m.date}</Text>
              </Animated.View>
            ))
          )}
        </Animated.View>

        {product.mouvements.length > 5 && (
          <Animated.View entering={FadeInUp.duration(400).delay(360).springify()}>
            <Pressable onPress={() => setShowAllHistory((s) => !s)} style={[styles.historyBtn, { borderColor: colors.borderStrong, backgroundColor: colors.surface }]}>
              <Text style={[styles.historyBtnText, { color: colors.primary }]}>
                {showAllHistory ? t('vendorStock.collapse', 'Réduire') : t('vendorStock.viewAllHistory', "Voir tout l'historique")}
              </Text>
            </Pressable>
          </Animated.View>
        )}
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
  content: { padding: 20, gap: 10, paddingBottom: 30 },

  card: {
    borderRadius: 16, padding: 18,
    borderWidth: 1,
  },
  cardLabel: { fontSize: 13, fontWeight: '600' },
  cardValue: { fontSize: 24, fontWeight: '900', marginTop: 6 },

  sectionLabel: { fontSize: 14.5, fontWeight: '800', marginTop: 10 },
  adjustRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  adjustInput: {
    flex: 1, height: 52, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, fontSize: 14,
  },
  addBtn: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  removeBtn: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  emptyText: { fontSize: 13.5, textAlign: 'center', paddingVertical: 10 },
  moveRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  moveSign: { fontSize: 15, fontWeight: '900', minWidth: 70 },
  moveType: { fontSize: 12.5 },
  moveDate: { fontSize: 12 },

  historyBtn: {
    height: 54, borderRadius: 16, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  historyBtnText: { fontSize: 14, fontWeight: '800' },
});
