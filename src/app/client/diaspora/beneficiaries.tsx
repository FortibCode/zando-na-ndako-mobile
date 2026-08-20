import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, FadeInLeft, ZoomIn,
  useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { ArrowLeft, Plus, UserPlus, Phone, MapPin, Check, Search, Trash2, Pencil } from 'lucide-react-native';
import { BLUE, RED } from '@/components/client-ui';
import { useDiaspora, type Beneficiary } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';
import BeneficiaryFormModal from '@/components/beneficiary-form-modal';
import { EmptyState } from '@/components/lottie-animations';

const AVATAR_COLORS = ['#FDE68A', '#BFDBFE', '#FBCFE8', '#C7F9E5', '#FED7AA'];

function BeneficiaryCard({ beneficiary, index, selected, onSelect, onEdit, onDelete }: {
  beneficiary: Beneficiary; index: number; selected: boolean; onSelect: () => void;
  onEdit: () => void; onDelete: () => void;
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
        style={[styles.card, selected && styles.cardSelected]}
      >
        <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.name}>{beneficiary.nom}</Text>
          <View style={styles.metaRow}>
            <Phone color="#94A3B8" size={12} />
            <Text style={styles.metaText}>{beneficiary.telephone}</Text>
          </View>
          <View style={styles.metaRow}>
            <MapPin color="#94A3B8" size={12} />
            <Text style={styles.metaText}>{beneficiary.ville}</Text>
          </View>
        </View>
        <Pressable onPress={onEdit} style={styles.actionBtn} accessibilityLabel="Modifier">
          <Pencil color={BLUE} size={15} />
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.actionBtn, styles.actionDanger]} accessibilityLabel="Supprimer">
          <Trash2 color={RED} size={15} />
        </Pressable>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <Check color="#FFF" size={14} strokeWidth={3} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ChooseBeneficiaryScreen() {
  const { beneficiaries, selectedBeneficiary, setSelectedBeneficiary, removeBeneficiary } = useDiaspora();
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
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />

      <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={BLUE} size={22} />
        </Pressable>
        <Text style={styles.title}>{t('diaspora.beneficiaries.title', 'Choisir un bénéficiaire')}</Text>
        <Pressable onPress={() => setModalVisible(true)} style={styles.addBtn}>
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
            <BeneficiaryCard
              key={b.id}
              beneficiary={b}
              index={index}
              selected={localSelected?.id === b.id}
              onSelect={() => setLocalSelected(b)}
              onEdit={() => { setEditing(b); setModalVisible(true); }}
              onDelete={() => handleDelete(b)}
            />
          ))
        )}

        <Animated.View entering={FadeInUp.duration(400).delay(300).springify()}>
          <Pressable onPress={() => { setEditing(null); setModalVisible(true); }} style={styles.addCard}>
            <View style={styles.addIcon}>
              <UserPlus color="#FFF" size={20} />
            </View>
            <Text style={styles.addText}>{t('diaspora.beneficiaries.addButton', 'Ajouter un bénéficiaire')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).delay(400).springify()} style={styles.footer}>
        <Pressable
          onPress={() => {
            if (!localSelected) return;
            setSelectedBeneficiary(localSelected);
            router.push('/client/(tabs)' as any);
          }}
          style={[styles.button, !localSelected && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>{t('diaspora.beneficiaries.continueButton', 'Continuer')}</Text>
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
  content: { padding: 20, gap: 12, paddingBottom: 20 },

  emptyBox: {
    backgroundColor: '#FFF', borderRadius: 20, padding: 10,
    borderWidth: 1, borderColor: '#EEF2FA', alignItems: 'center',
  },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFF', borderRadius: 18, padding: 14,
    borderWidth: 1.5, borderColor: '#E8ECF2',
    shadowColor: '#1A2744', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardSelected: { borderColor: RED, borderWidth: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: BLUE, fontSize: 17, fontWeight: '900' },
  copy: { flex: 1, gap: 3 },
  name: { color: BLUE, fontSize: 16, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: '#64748B', fontSize: 12.5 },
  radio: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: '#C8D0DE',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { backgroundColor: RED, borderColor: RED },
  actionBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center' },
  actionDanger: { backgroundColor: '#FFF0F0' },

  addCard: {
    height: 60, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#CBD5E1',
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16,
  },
  addIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  addText: { color: BLUE, fontSize: 14.5, fontWeight: '800' },

  footer: { padding: 20, paddingBottom: 26, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEF2FA' },
  button: { height: 60, borderRadius: 18, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', shadowColor: RED, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  buttonDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});
