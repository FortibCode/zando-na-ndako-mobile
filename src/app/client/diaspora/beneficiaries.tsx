import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, FadeInLeft, ZoomIn,
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { ArrowLeft, Plus, UserPlus, Phone, MapPin, Check, Search, Trash2, Pencil } from 'lucide-react-native';
import { Palette } from '@/design/tokens';
import { useTheme } from '@/contexts/theme-context';
import { useDiaspora, type Beneficiary } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';
import BeneficiaryFormModal from '@/components/beneficiary-form-modal';
import { EmptyState } from '@/components/lottie-animations';
import type { ThemeColors } from '@/design/theme';

const AVATAR_COLORS = ['#FDE68A', '#BFDBFE', '#FBCFE8', '#C7F9E5', '#FED7AA'];

function BeneficiaryCard({ beneficiary, index, selected, onSelect, onEdit, onDelete, colors }: {
  beneficiary: Beneficiary; index: number; selected: boolean; onSelect: () => void;
  onEdit: () => void; onDelete: () => void; colors: ThemeColors;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const initials = beneficiary.nom.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Animated.View
      entering={FadeInLeft.duration(350).delay(100 + index * 80).springify()}
      style={animStyle}
    >
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onSelect}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }, selected && { borderColor: colors.primary, borderWidth: 2 }]}
      >
        <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.name, { color: colors.text }]}>{beneficiary.nom}</Text>
          <View style={styles.metaRow}>
            <Phone color={colors.textTertiary} size={12} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{beneficiary.telephone}</Text>
          </View>
          <View style={styles.metaRow}>
            <MapPin color={colors.textTertiary} size={12} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{beneficiary.ville}</Text>
          </View>
        </View>
        <Pressable onPress={onEdit} style={[styles.actionBtn, { backgroundColor: colors.primarySoft }]} accessibilityLabel="Modifier">
          <Pencil color={colors.primary} size={15} />
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.actionBtn, { backgroundColor: colors.error + '18' }]} accessibilityLabel="Supprimer">
          <Trash2 color={colors.error} size={15} />
        </Pressable>
        <View style={[styles.radio, { borderColor: colors.border }, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          {selected && <Check color={colors.textInverse} size={14} strokeWidth={3} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ChooseBeneficiaryScreen() {
  const { beneficiaries, selectedBeneficiary, setSelectedBeneficiary, removeBeneficiary } = useDiaspora();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Beneficiary | null>(null);
  const [query, setQuery] = useState('');
  const [localSelected, setLocalSelected] = useState<Beneficiary | null>(
    selectedBeneficiary || beneficiaries.find((b) => b.favori) || beneficiaries[0] || null
  );

  const handleDelete = (b: Beneficiary) => {
    Alert.alert(
      t('diaspora.beneficiariesManage.deleteConfirmTitle', 'Supprimer ce bénéficiaire ?'),
      `« ${b.nom} » ${t('diaspora.beneficiariesManage.deleteConfirmDesc', 'sera définitivement supprimé de votre liste.')}`,
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        {
          text: t('diaspora.beneficiariesManage.delete', 'Supprimer'),
          style: 'destructive',
          onPress: async () => {
            await removeBeneficiary(b.id);
            if (localSelected?.id === b.id) {
              setLocalSelected(null);
            }
            Alert.alert('✅ Supprimé', `Le bénéficiaire « ${b.nom} » a été supprimé.`);
          },
        },
      ],
    );
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return beneficiaries;
    return beneficiaries.filter((b) =>
      b.nom.toLowerCase().includes(q) ||
      b.telephone.toLowerCase().includes(q) ||
      b.ville.toLowerCase().includes(q) ||
      (b.quartier || '').toLowerCase().includes(q)
    );
  }, [beneficiaries, query]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('diaspora.beneficiaries.title', 'Choisir un bénéficiaire')}</Text>
        <Pressable onPress={() => setModalVisible(true)} style={[styles.addBtn, { backgroundColor: colors.primarySoft }]}>
          <Plus color={colors.primary} size={22} />
        </Pressable>
      </Animated.View>

      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search color={colors.textTertiary} size={18} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('diaspora.beneficiaries.searchPlaceholder', 'Rechercher un bénéficiaire…')}
          placeholderTextColor={colors.textTertiary}
          style={[styles.searchInput, { color: colors.text }]}
          autoCapitalize="words"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(400).springify()}>
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <EmptyState
                title={query ? t('diaspora.beneficiaries.emptyResultsTitle', 'Aucun résultat') : t('diaspora.beneficiaries.emptyTitle', 'Aucun bénéficiaire')}
                message={query ? t('diaspora.beneficiaries.emptyResultsDesc', 'Aucun bénéficiaire ne correspond à votre recherche.') : t('diaspora.beneficiaries.emptyDesc', 'Ajoutez la personne qui recevra vos courses au Congo.')}
                size={120}
              />
            </View>
          </Animated.View>
        ) : (
          filtered.map((b, index) => (
            <BeneficiaryCard
              key={b.id}
              beneficiary={b}
              index={index}
              selected={localSelected?.id === b.id}
              onSelect={() => setLocalSelected(b)}
              onEdit={() => { setEditing(b); setModalVisible(true); }}
              onDelete={() => handleDelete(b)}
              colors={colors}
            />
          ))
        )}

        <Animated.View entering={FadeInUp.duration(400).delay(300).springify()}>
          <Pressable onPress={() => { setEditing(null); setModalVisible(true); }} style={[styles.addCard, { borderColor: colors.border }]}>
            <View style={[styles.addIcon, { backgroundColor: colors.primary }]}>
              <UserPlus color={colors.textInverse} size={20} />
            </View>
            <Text style={[styles.addText, { color: colors.primary }]}>{t('diaspora.beneficiaries.addButton', 'Ajouter un bénéficiaire')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).delay(400).springify()} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => {
            if (!localSelected) return;
            setSelectedBeneficiary(localSelected);
            router.push('/client/(tabs)' as any);
          }}
          style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }, !localSelected && { backgroundColor: colors.border, shadowOpacity: 0 }]}
        >
          <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('diaspora.beneficiaries.continueButton', 'Continuer')}</Text>
        </Pressable>
      </Animated.View>

      <BeneficiaryFormModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditing(null); }}
        beneficiary={editing}
        onSaved={(saved) => setLocalSelected(saved)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '900', flex: 1 },
  addBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginTop: 14, height: 50,
    borderRadius: 14, paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  searchInput: { flex: 1, fontSize: 14.5, fontWeight: '500' },
  content: { padding: 20, gap: 12, paddingBottom: 20 },

  emptyBox: {
    borderRadius: 20, padding: 10,
    borderWidth: 1, alignItems: 'center',
  },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 14,
    borderWidth: 1.5,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Palette.navy, fontSize: 17, fontWeight: '900' },
  copy: { flex: 1, gap: 3 },
  name: { fontSize: 16, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12.5 },
  radio: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  addCard: {
    height: 60, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed',
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16,
  },
  addIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 14.5, fontWeight: '800' },

  footer: { padding: 20, paddingBottom: 26, borderTopWidth: 1 },
  button: { height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  buttonText: { fontSize: 18, fontWeight: '800' },
});
