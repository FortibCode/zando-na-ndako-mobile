import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, {
  FadeInDown, FadeInUp, FadeInLeft,
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { ArrowLeft, Plus, Pencil, Trash2, ShoppingBag, Search } from 'lucide-react-native';
import { Palette } from '@/design/tokens';
import { useTheme } from '@/contexts/theme-context';
import { useDiaspora, type Beneficiary } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';
import BeneficiaryFormModal from '@/components/beneficiary-form-modal';
import { EmptyState } from '@/components/lottie-animations';
import type { ThemeColors } from '@/design/theme';

const AVATAR_COLORS = ['#FDE68A', '#BFDBFE', '#FBCFE8', '#C7F9E5', '#FED7AA'];

function BeneficiaryRow({ beneficiary, index, onEdit, onDelete, onToggleFavorite, colors }: {
  beneficiary: Beneficiary; index: number;
  onEdit: () => void; onDelete: () => void; onToggleFavorite: () => void; colors: ThemeColors;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const initials = beneficiary.nom.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const { t } = useLanguage();

  return (
    <Animated.View
      entering={FadeInLeft.duration(350).delay(80 + index * 80).springify()}
      style={animStyle}
    >
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onLongPress={onToggleFavorite}
        style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
      >
        <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.name, { color: colors.text }]}>{beneficiary.nom}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>{beneficiary.telephone}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>{beneficiary.ville}</Text>
        </View>
        {beneficiary.favori && (
          <View style={[styles.favBadge, { backgroundColor: colors.goldSoft }]}>
            <Text style={[styles.favBadgeText, { color: colors.gold }]}>{t('diaspora.beneficiariesManage.favBadge', 'Favori')}</Text>
          </View>
        )}
        <Pressable onPress={onEdit} style={[styles.actionBtn, { backgroundColor: colors.primarySoft }]} accessibilityLabel={t('diaspora.beneficiariesManage.edit', 'Modifier')}>
          <Pencil color={colors.primary} size={16} />
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.actionBtn, { backgroundColor: colors.error + '18' }]} accessibilityLabel={t('diaspora.beneficiariesManage.delete', 'Supprimer')}>
          <Trash2 color={colors.error} size={16} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

export default function ManageBeneficiariesScreen() {
  const { beneficiaries, removeBeneficiary, toggleFavoriteBeneficiary } = useDiaspora();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Beneficiary | null>(null);
  const [query, setQuery] = useState('');

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

  const handleDelete = (b: Beneficiary) => {
    alert(
      t('diaspora.beneficiariesManage.deleteConfirmTitle', 'Supprimer ce bénéficiaire ?'),
      `« ${b.nom} » ${t('diaspora.beneficiariesManage.deleteConfirmDesc', 'sera définitivement supprimé de votre liste.')}`,
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        { text: t('diaspora.beneficiariesManage.delete', 'Supprimer'), style: 'destructive', onPress: () => removeBeneficiary(b.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('diaspora.beneficiariesManage.title', 'Mes bénéficiaires')}</Text>
        <Pressable onPress={() => { setEditing(null); setModalVisible(true); }} style={[styles.addBtn, { backgroundColor: colors.primarySoft }]}>
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
            <BeneficiaryRow
              key={b.id}
              beneficiary={b}
              index={index}
              onEdit={() => { setEditing(b); setModalVisible(true); }}
              onDelete={() => handleDelete(b)}
              onToggleFavorite={() => toggleFavoriteBeneficiary(b.id)}
              colors={colors}
            />
          ))
        )}

        <Animated.View entering={FadeInUp.duration(400).delay(300).springify()}>
          <Pressable onPress={() => { setEditing(null); setModalVisible(true); }} style={[styles.addCard, { borderColor: colors.border }]}>
            <Plus color={colors.primary} size={20} />
            <Text style={[styles.addText, { color: colors.primary }]}>{t('diaspora.beneficiariesManage.addButton', 'Ajouter un bénéficiaire')}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(360).springify()}>
          <Pressable onPress={() => router.push('/client/diaspora/beneficiaries' as any)} style={[styles.reorder, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
            <ShoppingBag color={colors.textInverse} size={18} />
            <Text style={[styles.reorderText, { color: colors.textInverse }]}>{t('diaspora.beneficiariesManage.reorderButton', 'Commander à nouveau')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <BeneficiaryFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        beneficiary={editing}
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
  content: { padding: 20, gap: 12, paddingBottom: 30 },

  emptyBox: { borderRadius: 20, padding: 10, borderWidth: 1, alignItems: 'center' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 18, padding: 14,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Palette.navy, fontSize: 15, fontWeight: '900' },
  copy: { flex: 1, gap: 2 },
  name: { fontSize: 15.5, fontWeight: '800' },
  meta: { fontSize: 12 },
  favBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  favBadgeText: { fontSize: 10.5, fontWeight: '900' },
  actionBtn: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  addCard: {
    height: 60, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  addText: { fontSize: 14.5, fontWeight: '800' },

  reorder: {
    height: 58, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    marginTop: 4,
  },
  reorderText: { fontSize: 16, fontWeight: '800' },
});
