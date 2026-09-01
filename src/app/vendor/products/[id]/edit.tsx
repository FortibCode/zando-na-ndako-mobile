import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Camera, Check, ChevronDown, ChevronRight, Layers, PackageSearch } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProduct, updateProduct, refreshCategories, vendorCategoryNames } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const product = getProduct(id || '');

  const [photo, setPhoto] = useState(product?.image);
  const [nom, setNom] = useState(product?.nom || '');
  // Remplace l'ancien champ texte libre (jamais transmis à l'API — modifier la catégorie ici
  // n'avait aucun effet, elle revenait silencieusement à son ancienne valeur) par le même vrai
  // sélecteur que l'écran "Ajouter un produit", alimenté par les catégories réelles du backend.
  const [categorie, setCategorie] = useState(product?.categorie || '');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [prix, setPrix] = useState(String(product?.prix || ''));
  const [stock, setStock] = useState(String(product?.stock || ''));
  const [description, setDescription] = useState(product?.description || '');
  const [disponible, setDisponible] = useState(product?.disponible ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  useEffect(() => {
    if (product) {
      setPhoto(product.image);
      setNom(product.nom);
      setCategorie(product.categorie);
      setPrix(String(product.prix));
      setStock(String(product.stock));
      setDescription(product.description || '');
      setDisponible(product.disponible);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!product) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}><ArrowLeft color={colors.primary} size={22} /></Pressable>
          <Text style={[styles.title, { color: colors.text }]}>{t('vendorEditProduct.notFound', 'Produit introuvable')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhoto(result.assets[0].uri);
    }
  };


  const handleUpdate = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateProduct(product.id, {
        nom: nom.trim(), categorie, prix: Number(prix) || 0, stock: Number(stock) || 0,
        description: description.trim(), disponible, image: photo,
        derniereMaj: new Date().toLocaleDateString('fr-FR'),
      });
      alert(t('vendorEditProduct.updatedTitle', '✅ Produit mis à jour'), `« ${nom.trim()} » ${t('vendorEditProduct.updatedDescSuffix', 'a bien été enregistré.')}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      alert('Erreur', e.message || t('vendorEditProduct.updateErrorDesc', 'Impossible de mettre à jour ce produit.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorEditProduct.title', 'Modifier le produit')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400).delay(60).springify()} style={[styles.photoBox, { backgroundColor: colors.backgroundAlt }]}>
          <Image accessibilityLabel={product.nom} contentFit="cover" source={{ uri: photo }} style={styles.photo} />
          <Pressable onPress={handlePickPhoto} style={[styles.photoEditBtn, { backgroundColor: colors.surface }]}>
            <Camera color={colors.primary} size={20} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(120).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorAddProduct.productName', 'Nom du produit')}</Text>
          <TextInput value={nom} onChangeText={setNom} style={[styles.field, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]} placeholderTextColor={colors.textTertiary} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(160).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorAddProduct.category', 'Catégorie')}</Text>
          <Pressable onPress={() => setCategoryOpen((o) => !o)} style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.dropdownValue, { color: colors.text }]}>{categorie}</Text>
            <ChevronDown color={colors.primary} size={18} style={{ transform: [{ rotate: categoryOpen ? '180deg' : '0deg' }] }} />
          </Pressable>
          {categoryOpen && (
            <Animated.View entering={FadeInDown.duration(200)} style={[styles.dropdownPanel, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              {vendorCategoryNames.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => { setCategorie(c); setCategoryOpen(false); }}
                  style={[styles.dropdownOption, { borderBottomColor: colors.border }, c === categorie && { backgroundColor: colors.primarySoft }]}
                >
                  <Text style={[styles.dropdownOptionText, { color: colors.textSecondary }, c === categorie && { color: colors.primary }]}>{c}</Text>
                  {c === categorie && <Check color={colors.primary} size={16} strokeWidth={3} />}
                </Pressable>
              ))}
            </Animated.View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(200).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorAddProduct.price', 'Prix')}</Text>
          <View style={styles.fieldRow}>
            <TextInput
              value={prix}
              onChangeText={(v) => setPrix(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={[styles.field, { flex: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
            />
            <Text style={[styles.fieldUnit, { color: colors.textSecondary }]}>FCFA</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(240).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorAddProduct.availableStock', 'Stock disponible')}</Text>
          <TextInput
            value={stock}
            onChangeText={(v) => setStock(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            style={[styles.field, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(280).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorAddProduct.description', 'Description')}</Text>
          <View style={[styles.descBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={description}
              onChangeText={(v) => setDescription(v.slice(0, 200))}
              multiline
              style={[styles.descInput, { color: colors.text }]}
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(320).springify()} style={[styles.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>{t('vendorEditProduct.availableSwitch', 'Produit disponible')}</Text>
          <Switch
            value={disponible}
            onValueChange={setDisponible}
            trackColor={{ false: colors.border, true: colors.success + '60' }}
            thumbColor={disponible ? colors.success : colors.textTertiary}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(360).springify()} style={[styles.linksCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable onPress={() => router.push(`/vendor/products/${product.id}/variants` as any)} style={styles.linkRow}>
            <Layers color={colors.primary} size={18} />
            <Text style={[styles.linkText, { color: colors.text }]}>{t('vendorEditProduct.manageVariants', 'Gérer les variantes')}</Text>
            <ChevronRight color={colors.textTertiary} size={18} />
          </Pressable>
          <View style={[styles.linkDivider, { backgroundColor: colors.border }]} />
          <Pressable onPress={() => router.push(`/vendor/products/${product.id}/stock` as any)} style={styles.linkRow}>
            <PackageSearch color={colors.primary} size={18} />
            <Text style={[styles.linkText, { color: colors.text }]}>{t('vendorEditProduct.manageStock', 'Gérer le stock')}</Text>
            <ChevronRight color={colors.textTertiary} size={18} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(400).springify()}>
          <Pressable onPress={handleUpdate} disabled={saving} style={[styles.updateBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.updateBtnText}>{t('vendorEditProduct.updateBtn', 'Mettre à jour')}</Text>}
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

  photoBox: { height: 180, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  photo: { width: '100%', height: '100%' },
  photoEditBtn: {
    position: 'absolute', bottom: 12, right: 12, width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },

  label: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  field: {
    height: 52, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, fontSize: 15,
  },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fieldUnit: { fontSize: 13, fontWeight: '700' },

  dropdown: {
    height: 52, borderRadius: 14, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  dropdownValue: { fontSize: 15, fontWeight: '700' },
  dropdownPanel: { marginTop: 8, borderRadius: 14, borderWidth: 1, overflow: 'hidden', maxHeight: 260 },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  dropdownOptionText: { fontSize: 14, fontWeight: '600' },

  descBox: { borderRadius: 14, borderWidth: 1.5, padding: 14, minHeight: 90 },
  descInput: { fontSize: 14.5, minHeight: 60, textAlignVertical: 'top' },

  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, padding: 16, borderWidth: 1,
  },
  switchLabel: { fontSize: 15, fontWeight: '800' },

  linksCard: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  linkText: { fontSize: 14, fontWeight: '700', flex: 1 },
  linkDivider: { height: 1 },

  updateBtn: {
    height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  updateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
