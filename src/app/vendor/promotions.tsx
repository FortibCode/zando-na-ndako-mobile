import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Check, ChevronDown, Trash2 } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { EmptyState } from '@/components/lottie-animations';

export default function PromotionsScreen() {
  const { promotions, promotionsLoading, togglePromotion, addPromotion, deletePromotion, products } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [tab, setTab] = useState<'actives' | 'terminees'>('actives');
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  // Sélectionné par id (pas par nom) dans un menu déroulant sur TOUS les produits — avant, seuls
  // les 5 premiers produits étaient proposés sous forme de puces, et le nom affiché était renvoyé
  // tel quel puis recherché par correspondance exacte côté contexte, silencieusement muet en cas
  // de doublon/renommage entre-temps (voir addPromotion dans vendor-context.tsx).
  const [produitId, setProduitId] = useState<string | null>(products[0]?.id ?? null);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [pourcentage, setPourcentage] = useState('');
  const selectedProduct = products.find((p) => p.id === produitId) ?? null;
  // Ids en cours de bascule/suppression — désactive le contrôle correspondant le temps de
  // l'appel réseau, plutôt que de laisser croire que l'action a déjà réussi côté serveur.
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});

  const filtered = useMemo(
    () => promotions.filter((p) => (tab === 'actives' ? !p.terminee : p.terminee)),
    [promotions, tab]
  );

  const isValid = !!selectedProduct && pourcentage.trim().length > 0;

  const handleAdd = async () => {
    if (!isValid || !selectedProduct || saving) return;
    setSaving(true);
    try {
      await addPromotion({
        titre: `-${pourcentage}% sur ${selectedProduct.nom}`,
        produitId: selectedProduct.id,
        pourcentage: Number(pourcentage) || 0,
      });
      setPourcentage('');
      setAdding(false);
    } catch (e: any) {
      alert('Erreur', e?.message || 'Impossible de créer cette promotion. Vérifiez votre connexion.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    if (busyIds[id]) return;
    setBusyIds((prev) => ({ ...prev, [id]: true }));
    try {
      await togglePromotion(id);
    } catch (e: any) {
      alert('Erreur', e?.message || 'Impossible de mettre à jour cette promotion.');
    } finally {
      setBusyIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = (id: string, titre: string) => {
    alert(
      t('vendorPromotions.deleteTitle', 'Supprimer la promotion'),
      t('vendorPromotions.deleteConfirm', `Supprimer « ${titre} » ? Cette action est définitive.`),
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        {
          text: t('common.delete', 'Supprimer'), style: 'destructive',
          onPress: async () => {
            setBusyIds((prev) => ({ ...prev, [id]: true }));
            try {
              await deletePromotion(id);
            } catch (e: any) {
              alert('Erreur', e?.message || 'Impossible de supprimer cette promotion.');
              setBusyIds((prev) => ({ ...prev, [id]: false }));
            }
          },
        },
      ]
    );
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
        {promotionsLoading && promotions.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : filtered.length === 0 ? (
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
                <View style={{ flex: 1 }}>
                  <Text style={[styles.promoTitle, { color: colors.text }]}>{promo.titre}</Text>
                  <Text style={[styles.promoDates, { color: colors.textTertiary }]}>{promo.dateDebut} {t('vendorPromotions.toLabel', 'au')} {promo.dateFin}</Text>
                </View>
              </View>
              {busyIds[promo.id] ? (
                <ActivityIndicator color={colors.primary} size="small" style={{ marginRight: 6 }} />
              ) : (
                <>
                  <Switch
                    value={promo.actif}
                    onValueChange={() => handleToggle(promo.id)}
                    trackColor={{ false: colors.border, true: colors.success + '60' }}
                    thumbColor={promo.actif ? colors.success : colors.textTertiary}
                  />
                  <Pressable onPress={() => handleDelete(promo.id, promo.titre)} hitSlop={8} style={styles.deleteBtn}>
                    <Trash2 color={colors.textTertiary} size={18} />
                  </Pressable>
                </>
              )}
            </Animated.View>
          ))
        )}

        {adding ? (
          <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.addForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.addFormTitle, { color: colors.text }]}>{t('vendorPromotions.newPromotion', 'Nouvelle promotion')}</Text>
            <Pressable onPress={() => setProductPickerOpen((o) => !o)} style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.backgroundAlt }]}>
              <Text style={[styles.dropdownValue, { color: colors.text }]} numberOfLines={1}>
                {selectedProduct?.nom || t('vendorPromotions.selectProduct', 'Choisir un produit')}
              </Text>
              <ChevronDown color={colors.primary} size={18} style={{ transform: [{ rotate: productPickerOpen ? '180deg' : '0deg' }] }} />
            </Pressable>
            {productPickerOpen && (
              <Animated.View entering={FadeInDown.duration(200)} style={[styles.dropdownPanel, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <ScrollView style={{ maxHeight: 260 }} nestedScrollEnabled showsVerticalScrollIndicator>
                  {products.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => { setProduitId(p.id); setProductPickerOpen(false); }}
                      style={[styles.dropdownOption, { borderBottomColor: colors.border }, p.id === produitId && { backgroundColor: colors.primarySoft }]}
                    >
                      <Text style={[styles.dropdownOptionText, { color: colors.textSecondary }, p.id === produitId && { color: colors.primary }]} numberOfLines={1}>{p.nom}</Text>
                      {p.id === produitId && <Check color={colors.primary} size={16} strokeWidth={3} />}
                    </Pressable>
                  ))}
                </ScrollView>
              </Animated.View>
            )}
            <TextInput
              value={pourcentage}
              onChangeText={(v) => setPourcentage(v.replace(/[^0-9]/g, ''))}
              placeholder={t('vendorPromotions.percentPlaceholder', 'Pourcentage de réduction (ex : 10)')}
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              style={[styles.addInput, { borderColor: colors.border, backgroundColor: colors.backgroundAlt, color: colors.text }]}
            />
            <Pressable onPress={handleAdd} disabled={!isValid || saving} style={[styles.confirmBtn, { backgroundColor: colors.primary }, (!isValid || saving) && { opacity: 0.5 }]}>
              {saving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Check color="#FFF" size={16} strokeWidth={3} />
                  <Text style={styles.confirmBtnText}>{t('vendorPromotions.createPromotion', 'Créer la promotion')}</Text>
                </>
              )}
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
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  emptyBox: { borderRadius: 20, padding: 10, borderWidth: 1, alignItems: 'center' },

  promoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 18, padding: 16,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  promoTitle: { fontSize: 15.5, fontWeight: '800' },
  promoDates: { fontSize: 12, marginTop: 3 },
  deleteBtn: { marginLeft: 10, padding: 4 },

  createBtn: {
    height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  createBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  addForm: { borderRadius: 18, padding: 16, gap: 12, borderWidth: 1 },
  addFormTitle: { fontSize: 15, fontWeight: '900' },
  dropdown: {
    height: 48, borderRadius: 12, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  dropdownValue: { fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  dropdownPanel: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  dropdownOptionText: { fontSize: 13.5, fontWeight: '600', flex: 1, marginRight: 8 },
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
