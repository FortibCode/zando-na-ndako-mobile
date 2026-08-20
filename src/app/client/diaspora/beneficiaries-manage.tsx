import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, FadeInLeft,
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { ArrowLeft, Plus, Pencil, Trash2, Star, ShoppingBag, Search } from 'lucide-react-native';
import { BLUE, RED, GOLD } from '@/components/client-ui';
import { useDiaspora, type Beneficiary } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';
import BeneficiaryFormModal from '@/components/beneficiary-form-modal';
import { EmptyState } from '@/components/lottie-animations';

const AVATAR_COLORS = ['#FDE68A', '#BFDBFE', '#FBCFE8', '#C7F9E5', '#FED7AA'];

function BeneficiaryRow({ beneficiary, index, onEdit, onDelete, onToggleFavorite }: {
  beneficiary: Beneficiary; index: number;
  onEdit: () => void; onDelete: () => void; onToggleFavorite: () => void;
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
        style={styles.row}
      >
        <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.name}>{beneficiary.nom}</Text>
          <Text style={styles.meta}>{beneficiary.telephone}</Text>
          <Text style={styles.meta}>{beneficiary.ville}</Text>
        </View>
        {beneficiary.favori && (
          <View style={styles.favBadge}>
            <Text style={styles.favBadgeText}>{t('diaspora.beneficiariesManage.favBadge', 'Favori')}</Text>
          </View>
        )}
        <Pressable onPress={onEdit} style={styles.actionBtn} accessibilityLabel={t('diaspora.beneficiariesManage.edit', 'Modifier')}>
          <Pencil color={BLUE} size={16} />
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.actionBtn, styles.actionDanger]} accessibilityLabel={t('diaspora.beneficiariesManage.delete', 'Supprimer')}>
          <Trash2 color={RED} size={16} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

export default function ManageBeneficiariesScreen() {
  const { beneficiaries, removeBeneficiary, toggleFavoriteBeneficiary } = useDiaspora();
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
    Alert.alert(
      t('diaspora.beneficiariesManage.deleteConfirmTitle', 'Supprimer ce bénéficiaire ?'),
      `« ${b.nom} » ${t('diaspora.beneficiariesManage.deleteConfirmDesc', 'sera définitivement supprimé de votre liste.')}`,
      [
        { text: t('common.cancel', 'Annuler'), style: 'cancel' },
        { text: t('diaspora.beneficiariesManage.delete', 'Supprimer'), style: 'destructive', onPress: () => removeBeneficiary(b.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />

      <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={BLUE} size={22} />
        </Pressable>
        <Text style={styles.title}>{t('diaspora.beneficiariesManage.title', 'Mes bénéficiaires')}</Text>
        <Pressable onPress={() => { setEditing(null); setModalVisible(true); }} style={styles.addBtn}>
          <Plus color={BLUE} size={22} />
        </Pressable>
      </Animated.View>

      <View style={styles.searchWrap}>
        <Search color="#94A3B8" size={18} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('diaspora.beneficiaries.searchPlaceholder', 'Rechercher un bénéficiaire…')}
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
          autoCapitalize="words"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(400).springify()}>
            <View style={styles.emptyBox}>
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
            />
          ))
        )}

        <Animated.View entering={FadeInUp.duration(400).delay(300).springify()}>
          <Pressable onPress={() => { setEditing(null); setModalVisible(true); }} style={styles.addCard}>
            <Plus color={BLUE} size={20} />
            <Text style={styles.addText}>{t('diaspora.beneficiariesManage.addButton', 'Ajouter un bénéficiaire')}</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(360).springify()}>
          <Pressable onPress={() => router.push('/client/diaspora/beneficiaries' as any)} style={styles.reorder}>
            <ShoppingBag color="#FFF" size={18} />
            <Text style={styles.reorderText}>{t('diaspora.beneficiariesManage.reorderButton', 'Commander à nouveau')}</Text>
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
  screen: { flex: 1, backgroundColor: '#F8FAFE' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E8ECF2',
  },
  backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center' },
  title: { color: BLUE, fontSize: 19, fontWeight: '900', flex: 1 },
  addBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginTop: 14, height: 50,
    backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: '#E8ECF2',
  },
  searchInput: { flex: 1, color: BLUE, fontSize: 14.5, fontWeight: '500' },
  content: { padding: 20, gap: 12, paddingBottom: 30 },

  emptyBox: { backgroundColor: '#FFF', borderRadius: 20, padding: 10, borderWidth: 1, borderColor: '#EEF2FA', alignItems: 'center' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF', borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: '#E8ECF2',
    shadowColor: '#1A2744', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BLUE, fontSize: 15, fontWeight: '900' },
  copy: { flex: 1, gap: 2 },
  name: { color: BLUE, fontSize: 15.5, fontWeight: '800' },
  meta: { color: '#64748B', fontSize: 12 },
  favBadge: { backgroundColor: '#FEF9C3', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  favBadgeText: { color: '#92400E', fontSize: 10.5, fontWeight: '900' },
  actionBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center' },
  actionDanger: { backgroundColor: '#FFF0F0' },

  addCard: {
    height: 60, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#CBD5E1',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  addText: { color: BLUE, fontSize: 14.5, fontWeight: '800' },

  reorder: {
    height: 58, borderRadius: 18, backgroundColor: RED,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: RED, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
    marginTop: 4,
  },
  reorderText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
