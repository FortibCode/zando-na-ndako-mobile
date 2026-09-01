import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Camera, ChevronDown, Check, AlertTriangle } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { SafeAreaView } from 'react-native-safe-area-context';

// Alignée avec admin_web/src/lib/produitConstants.ts (UNITES_MESURE_SUGGESTIONS) — les 3 valeurs
// d'origine ne couvraient pas les unités réellement utilisées par de vrais produits (voir
// ProduitsSeeder.php côté backend : "Sachet", "Régime", "Boîte"), forçant à en taper une hors-liste
// de toute façon, ce qui revient au même problème qu'un champ texte libre.
const UNITES = ['kg', 'pièce', 'litre', 'sachet', 'boîte', 'régime', 'sac'];
const FRAICHEURS: { value: 'frais' | 'fume' | 'congele'; label: string }[] = [
  { value: 'frais', label: 'Frais' },
  { value: 'fume', label: 'Fumé' },
  { value: 'congele', label: 'Congelé' },
];

export default function AddProductScreen() {
  const { addProduct, vendorValidationStatus, refreshVendorProfile, refreshCategories, vendorCategoryNames } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const isPending = vendorValidationStatus === 'en_attente';
  const isSuspended = vendorValidationStatus === 'suspendu';
  const [photo, setPhoto] = useState<string | null>(null);
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState(vendorCategoryNames[0] || '');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [prix, setPrix] = useState('');
  const [stock, setStock] = useState('');
  const [unite, setUnite] = useState('kg');
  const [fraicheur, setFraicheur] = useState<'frais' | 'fume' | 'congele'>('frais');
  const [description, setDescription] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Rafraîchit le profil vendeur et les catégories au chargement de l'écran (pour répercuter immédiatement une validation de l'admin)
  useEffect(() => {
    refreshVendorProfile();
    refreshCategories();
  }, [refreshVendorProfile, refreshCategories]);

  // La liste de catégories arrive de manière asynchrone (API) après le premier rendu ;
  // resynchronise la sélection par défaut si elle ne correspond plus à la liste réelle.
  useEffect(() => {
    if (vendorCategoryNames.length > 0 && (!categorie || !vendorCategoryNames.includes(categorie))) {
      setCategorie(vendorCategoryNames[0]);
    }
  }, [vendorCategoryNames, categorie]);

  const isBlocked = isSuspended || isPending;
  const isFormFilled = nom.trim().length >= 2 && prix.trim().length > 0 && stock.trim().length > 0;
  const isValid = isFormFilled && !isBlocked;

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handlePublish = async () => {
    if (isBlocked) {
      if (isSuspended) {
        alert('Compte suspendu', t('vendorAddProduct.suspendedWarning', 'Votre compte vendeur est suspendu. Contactez le support pour publier des produits.'));
      } else {
        alert('Compte en attente', t('vendorAddProduct.pendingWarning', "Votre compte vendeur est en attente de validation par un administrateur. Vous pourrez publier dès qu'il sera validé."));
      }
      return;
    }
    if (!isFormFilled) {
      alert('Champs incomplets', 'Veuillez renseigner le nom (au moins 2 caractères), le prix et le stock du produit.');
      return;
    }
    if (publishing) return;
    setPublishing(true);
    try {
      await addProduct({
        nom: nom.trim(),
        categorie,
        prix: Number(prix) || 0,
        stock: Number(stock) || 0,
        unite,
        fraicheur,
        description: description.trim() || undefined,
        image: photo || undefined,
      });
      alert(t('vendorAddProduct.publishedTitle', '✅ Produit publié'), `« ${nom.trim()} » ${t('vendorAddProduct.publishedDescSuffix', 'a été ajouté à votre catalogue et est visible par les clients.')}`, [
        { text: 'OK', onPress: () => router.replace('/vendor/(tabs)/products' as any) },
      ]);
    } catch (e: any) {
      alert('Erreur', e.message || t('vendorAddProduct.publishErrorDesc', 'Impossible de publier ce produit. Vérifiez votre connexion.'));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('vendorAddProduct.title', 'Ajouter un produit')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isBlocked && (
          <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.warningBanner, { backgroundColor: colors.error + '14', borderColor: colors.error + '40' }]}>
            <AlertTriangle color={colors.error} size={18} />
            <Text style={[styles.warningText, { color: colors.error }]}>
              {isSuspended
                ? t('vendorAddProduct.suspendedWarning', 'Votre compte vendeur est suspendu. Contactez le support pour publier des produits.')
                : t('vendorAddProduct.pendingWarning', "Votre compte vendeur est en attente de validation par un administrateur. Vous pourrez publier dès qu'il sera validé.")}
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.duration(400).delay(60).springify()}>
          <Pressable onPress={handlePickPhoto} style={[styles.photoBox, { borderColor: colors.borderStrong, backgroundColor: colors.surface }]}>
            {photo ? (
              <Image accessibilityLabel="Photo du produit" contentFit="cover" source={{ uri: photo }} style={styles.photoPreview} />
            ) : (
              <>
                <Text style={[styles.photoLabel, { color: colors.text }]}>{t('vendorAddProduct.photoLabel', 'Photo du produit')}</Text>
                <Camera color={colors.primary} size={34} />
                <Text style={[styles.photoAdd, { color: colors.primary }]}>{t('vendorAddProduct.addPhoto', 'Ajouter une photo')}</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(120).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorAddProduct.productName', 'Nom du produit')}</Text>
          <TextInput
            value={nom}
            onChangeText={setNom}
            placeholder={t('vendorAddProduct.productNamePlaceholder', 'Ex : Grande royale')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.field, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
          />
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
              placeholder={t('vendorAddProduct.pricePlaceholder', 'Ex : 2500')}
              placeholderTextColor={colors.textTertiary}
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
            placeholder={t('vendorAddProduct.stockPlaceholder', 'Ex : 10')}
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            style={[styles.field, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(250).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorAddProduct.unit', 'Unité de mesure')}</Text>
          <View style={styles.pillRow}>
            {UNITES.map((u) => (
              <Pressable
                key={u}
                onPress={() => setUnite(u)}
                style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.surface }, unite === u && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.pillText, { color: colors.textSecondary }, unite === u && { color: '#FFF' }]}>{u}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(260).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorAddProduct.freshness', 'Type de fraîcheur')}</Text>
          <View style={styles.pillRow}>
            {FRAICHEURS.map((f) => (
              <Pressable
                key={f.value}
                onPress={() => setFraicheur(f.value)}
                style={[styles.pill, { borderColor: colors.border, backgroundColor: colors.surface }, fraicheur === f.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.pillText, { color: colors.textSecondary }, fraicheur === f.value && { color: '#FFF' }]}>
                  {t(`vendorAddProduct.freshness.${f.value}`, f.label)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(280).springify()}>
          <Text style={[styles.label, { color: colors.text }]}>{t('vendorAddProduct.description', 'Description')}</Text>
          <View style={[styles.descBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={description}
              onChangeText={(v) => setDescription(v.slice(0, 200))}
              placeholder={t('vendorAddProduct.descriptionPlaceholder', 'Décrivez votre produit...')}
              placeholderTextColor={colors.textTertiary}
              multiline
              style={[styles.descInput, { color: colors.text }]}
            />
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>{description.length}/200</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(340).springify()}>
          <Pressable onPress={handlePublish} disabled={!isValid || publishing} style={[styles.publishBtn, { backgroundColor: colors.primary }, (!isValid || publishing) && { opacity: 0.5 }]}>
            {publishing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.publishBtnText}>{t('vendorAddProduct.publishBtn', 'Publier le produit')}</Text>}
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

  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  warningText: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },

  photoBox: {
    height: 180, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden',
  },
  photoLabel: { fontSize: 14, fontWeight: '800' },
  photoAdd: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  photoPreview: { width: '100%', height: '100%' },

  label: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  field: {
    height: 52, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, fontSize: 15,
  },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fieldUnit: { fontSize: 13, fontWeight: '700' },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    height: 42, borderRadius: 21, borderWidth: 1.5,
    paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center',
  },
  pillText: { fontSize: 13.5, fontWeight: '700' },

  dropdown: {
    height: 52, borderRadius: 14, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  dropdownValue: { fontSize: 15, fontWeight: '700' },
  dropdownPanel: { marginTop: 8, borderRadius: 14, borderWidth: 1, overflow: 'hidden', maxHeight: 260 },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  dropdownOptionText: { fontSize: 14, fontWeight: '600' },

  descBox: { borderRadius: 14, borderWidth: 1.5, padding: 14, minHeight: 100 },
  descInput: { fontSize: 14.5, minHeight: 60, textAlignVertical: 'top' },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 6 },

  publishBtn: {
    height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  publishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
