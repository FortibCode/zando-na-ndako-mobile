import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { EmptyState } from '@/components/lottie-animations';

export default function PromotionsScreen() {
  const { promotions, togglePromotion, addPromotion, products } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [tab, setTab] = useState<'actives' | 'terminees'>('actives');
  const [adding, setAdding] = useState(false);
  const [produit, setProduit] = useState(products[0]?.nom || '');
  const [pourcentage, setPourcentage] = useState('');

  const filtered = useMemo(
    () => promotions.filter((p) => (tab === 'actives' ? !p.terminee : p.terminee)),
    [promotions, tab]
  );

  const isValid = produit.trim().length > 0 && pourcentage.trim().length > 0;

  const handleAdd = () => {
    if (!isValid) return;
    addPromotion({
      titre: `-${pourcentage}% sur ${produit}`,
      produit, pourcentage: Number(pourcentage) || 0,
      dateDebut: new Date().toLocaleDateString('fr-FR'),
      dateFin: new Date().toLocaleDateString('fr-FR'),
    });
    setPourcentage(''); setAdding(false);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorPromotions.title', 'Mes promotions')}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(350).delay(60).springify()} style={[styles.tabRow, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => setTab('actives')} style={[styles.tab, { backgroundColor: colors.backgroundAlt }, tab === 'actives' && { backgroundColor: colors.primary }]}>
          <Text style={[styles.tabText, { color: colors.text }, tab === 'actives' && { color: '#FFF' }]}>{t('vendorPromotions.active', 'Actives')}</Text>
        </Pressable>
        <Pressable onPress={() => setTab('terminees')} style={[styles.tab, { backgroundColor: colors.backgroundAlt }, tab === 'terminees' && { backgroundColor: colors.primary }]}>
          <Text style={[styles.tabText, { color: colors.text }, tab === 'terminees' && { color: '#FFF' }]}>{t('vendorPromotions.ended', 'Terminées')}</Text>
        </Pressable>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(400).springify()}>
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <EmptyState title={t('vendorPromotions.emptyTitle', 'Aucune promotion')} message={t('vendorPromotions.emptyDesc', 'Créez votre première promotion pour booster vos ventes.')} size={110} />
            </View>
          </Animated.View>
        ) : (
          filtered.map((promo, i) => (
            <Animated.View key={promo.id} entering={FadeInDown.duration(350).delay(i * 60).springify()} style={[styles.promoRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={[styles.dot, { backgroundColor: promo.actif ? colors.success : colors.textTertiary }]} />
                <View>
                  <Text style={[styles.promoTitle, { color: colors.text }]}>{promo.titre}</Text>
                  <Text style={[styles.promoDates, { color: colors.textTertiary }]}>{promo.dateDebut} {t('vendorPromotions.toLabel', 'au')} {promo.dateFin}</Text>
                </View>
              </View>
              <Switch
                value={promo.actif}
                onValueChange={() => togglePromotion(promo.id)}
                trackColor={{ false: colors.border, true: colors.success + '60' }}
                thumbColor={promo.actif ? colors.success : colors.textTertiary}
              />
            </Animated.View>
          ))
        )}

        {adding ? (
          <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.addForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.addFormTitle, { color: colors.text }]}>{t('vendorPromotions.newPromotion', 'Nouvelle promotion')}</Text>
            <View style={styles.chipsRow}>
              {products.slice(0, 5).map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setProduit(p.nom)}
                  style={[styles.chip, { borderColor: colors.border }, produit === p.nom && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
                >
                  <Text style={[styles.chipText, { color: colors.text }, produit === p.nom && { color: colors.primary }]}>{p.nom}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={pourcentage}
              onChangeText={(v) => setPourcentage(v.replace(/[^0-9]/g, ''))}
              placeholder={t('vendorPromotions.percentPlaceholder', 'Pourcentage de réduction (ex : 10)')}
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              style={[styles.addInput, { borderColor: colors.border, backgroundColor: colors.backgroundAlt, color: colors.text }]}
            />
            <Pressable onPress={handleAdd} disabled={!isValid} style={[styles.confirmBtn, { backgroundColor: colors.primary }, !isValid && { opacity: 0.5 }]}>
              <Check color="#FFF" size={16} strokeWidth={3} />
              <Text style={styles.confirmBtnText}>{t('vendorPromotions.createPromotion', 'Créer la promotion')}</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.duration(400).delay(200).springify()}>
            <Pressable onPress={() => setAdding(true)} style={[styles.createBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.createBtnText}>{t('vendorPromotions.createPromotionBtn', 'Créer une promotion')}</Text>
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
  title: { fontSize: 19, fontWeight: '900' },

  tabRow: { flexDirection: 'row', gap: 10, padding: 20, paddingBottom: 12 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '700' },

  content: { padding: 20, gap: 12, paddingBottom: 30 },
  emptyBox: { borderRadius: 20, padding: 10, borderWidth: 1, alignItems: 'center' },

  promoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 18, padding: 16,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  promoTitle: { fontSize: 15.5, fontWeight: '800' },
  promoDates: { fontSize: 12, marginTop: 3 },

  createBtn: {
    height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  createBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  addForm: { borderRadius: 18, padding: 16, gap: 12, borderWidth: 1 },
  addFormTitle: { fontSize: 15, fontWeight: '900' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5 },
  chipText: { fontSize: 12.5, fontWeight: '700' },
  addInput: {
    height: 48, borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 14, fontSize: 14,
  },
  confirmBtn: {
    height: 50, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});
