import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideOutRight,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Building2,
  Home,
  MapPin,
  Phone,
  User,
  Star,
  Check,
  Navigation,
  AlertTriangle,
} from 'lucide-react-native';
import type { DeliveryAddress, DeliveryAddressInput } from '@/services/api';
import { useClient } from '@/contexts/client-context';
import { useTheme } from '@/contexts/theme-context';

const LABEL_OPTIONS = [
  { id: 'Maison', icon: Home },
  { id: 'Bureau', icon: Building2 },
  { id: 'Autre', icon: MapPin },
] as const;

type Props = {
  visible: boolean;
  onClose: () => void;
  address?: DeliveryAddress | null;
  initialCoords?: { latitude: number; longitude: number } | null;
};

const EMPTY_FORM: DeliveryAddressInput = {
  label: 'Maison',
  nom_complet: '',
  telephone: '',
  ville: 'Brazzaville',
  quartier: '',
  adresse: '',
  instructions: '',
  est_defaut: false,
};

export default function AddressFormModal({ visible, onClose, address, initialCoords }: Props) {
  const { addAddress, editAddress } = useClient();
  const { colors, isDark } = useTheme();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser le formulaire à partir de l'adresse (édition) ou vide (création)
  const [form, setForm] = useState<DeliveryAddressInput>(EMPTY_FORM);

  const isEditing = Boolean(address);

  const updateField = useCallback(
    (key: keyof DeliveryAddressInput, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleOpen = useCallback(() => {
    setError(null);
    if (address) {
      setForm({
        label: address.label || 'Maison',
        nom_complet: address.nom_complet || '',
        telephone: address.telephone || '',
        ville: address.ville || 'Brazzaville',
        quartier: address.quartier || '',
        adresse: address.adresse || '',
        instructions: address.instructions || '',
        est_defaut: address.est_defaut,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [address]);

  const isFormValid = form.adresse.trim().length >= 5;

  const handleSave = async () => {
    if (!isFormValid) {
      setError("Veuillez renseigner une adresse complète (minimum 5 caractères).");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: DeliveryAddressInput = {
        label: form.label,
        nom_complet: form.nom_complet?.trim() || undefined,
        telephone: form.telephone?.trim() || undefined,
        ville: form.ville?.trim() || 'Brazzaville',
        quartier: form.quartier?.trim() || undefined,
        adresse: form.adresse.trim(),
        instructions: form.instructions?.trim() || undefined,
        est_defaut: form.est_defaut,
        coordonnees_gps: initialCoords
          ? { lat: initialCoords.latitude, lng: initialCoords.longitude }
          : undefined,
      };

      if (isEditing && address) {
        await editAddress(address.id, payload);
      } else {
        await addAddress(payload);
      }
      onClose();
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.root}>
        {/* Backdrop */}
        <Animated.View entering={FadeIn.duration(200)} style={StyleSheet.absoluteFill}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityLabel="Fermer"
          />
          <View style={styles.backdrop} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          entering={SlideInRight.duration(300).springify()}
          exiting={SlideOutRight.duration(250)}
          style={[styles.sheet, { backgroundColor: colors.surface }]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Pressable onPress={onClose} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
                <ArrowLeft color={colors.primary} size={22} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                  {isEditing ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
                </Text>
                <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                  Renseignez les informations de livraison
                </Text>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Libellé */}
              <View style={styles.block}>
                <Text style={[styles.label, { color: colors.text }]}>Type d'adresse</Text>
                <View style={styles.labelRow}>
                  {LABEL_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = form.label === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => updateField('label', option.id)}
                        style={[styles.labelChip, { borderColor: colors.border, backgroundColor: colors.backgroundAlt }, selected && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
                      >
                        <View style={[styles.labelChipIcon, { backgroundColor: colors.primarySoft }, selected && { backgroundColor: colors.primary }]}>
                          <Icon color={selected ? '#FFF' : colors.primary} size={18} />
                        </View>
                        <Text style={[styles.labelChipText, { color: colors.textSecondary }, selected && { color: colors.primary, fontWeight: '900' }]}>
                          {option.id}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Destinataire */}
              <View style={styles.block}>
                <Text style={[styles.label, { color: colors.text }]}>Destinataire</Text>
                <View style={[styles.fieldWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <User color={colors.textTertiary} size={18} />
                  <TextInput
                    value={form.nom_complet}
                    onChangeText={(t) => updateField('nom_complet', t)}
                    placeholder="Nom complet (ex: Marie Kabila)"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="words"
                    style={[styles.field, { color: colors.text }]}
                  />
                </View>
                <View style={[styles.fieldWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Phone color={colors.textTertiary} size={18} />
                  <TextInput
                    value={form.telephone}
                    onChangeText={(t) => updateField('telephone', t)}
                    placeholder="Téléphone (ex: 06 123 45 67)"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                    style={[styles.field, { color: colors.text }]}
                  />
                </View>
              </View>

              {/* Localisation */}
              <View style={styles.block}>
                <Text style={[styles.label, { color: colors.text }]}>Localisation</Text>
                <View style={[styles.fieldWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <MapPin color={colors.textTertiary} size={18} />
                  <TextInput
                    value={form.ville}
                    onChangeText={(t) => updateField('ville', t)}
                    placeholder="Ville"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="words"
                    style={[styles.field, { color: colors.text }]}
                  />
                </View>
                <View style={[styles.fieldWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <Navigation color={colors.textTertiary} size={18} />
                  <TextInput
                    value={form.quartier}
                    onChangeText={(t) => updateField('quartier', t)}
                    placeholder="Quartier (ex: Moungalie)"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="words"
                    style={[styles.field, { color: colors.text }]}
                  />
                </View>
                <View style={[styles.fieldWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <MapPin color={colors.textTertiary} size={18} />
                  <TextInput
                    value={form.adresse}
                    onChangeText={(t) => updateField('adresse', t)}
                    placeholder="Adresse complète (n°, rue, avenue…)"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    style={[styles.field, styles.addressField, { color: colors.text }]}
                  />
                </View>
              </View>

              {/* Instructions */}
              <View style={styles.block}>
                <Text style={[styles.label, { color: colors.text }]}>Instructions de livraison (optionnel)</Text>
                <View style={[styles.fieldWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                  <TextInput
                    value={form.instructions}
                    onChangeText={(t) => updateField('instructions', t)}
                    placeholder="Ex: Laissez devant la porte, appelez à l'arrivée…"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    style={[styles.field, styles.addressField, { color: colors.text }]}
                  />
                </View>
              </View>

              {/* Défaut */}
              <Pressable
                onPress={() => updateField('est_defaut', !form.est_defaut)}
                style={[styles.defaultRow, { backgroundColor: colors.backgroundAlt, borderColor: colors.border }]}
              >
                <View style={[styles.defaultCheck, { borderColor: colors.borderStrong, backgroundColor: colors.surface }, form.est_defaut && { backgroundColor: colors.success, borderColor: colors.success }]}>
                  {form.est_defaut && <Check color="#FFF" size={14} strokeWidth={3} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.defaultTitle, { color: colors.text }]}>Adresse par défaut</Text>
                  <Text style={[styles.defaultSub, { color: colors.textSecondary }]}>
                    Sera utilisée automatiquement pour vos prochaines commandes.
                  </Text>
                </View>
              </Pressable>

              {error && (
                <Animated.View entering={FadeInUp.duration(250)} style={[styles.errorBox, styles.errorBoxRow, { backgroundColor: colors.error + '14', borderColor: colors.error + '44' }]}>
                  <AlertTriangle color={colors.error} size={15} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </Animated.View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <Pressable
                onPress={handleSave}
                disabled={saving || !isFormValid}
                style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }, (saving || !isFormValid) && { backgroundColor: colors.textTertiary, shadowOpacity: 0 }]}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Check color="#FFF" size={18} strokeWidth={3} />
                    <Text style={styles.buttonText}>
                      {isEditing ? 'Enregistrer les modifications' : 'Ajouter cette adresse'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(6, 24, 59, 0.55)' },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#06183B',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 19, fontWeight: '900' },
  headerSub: { fontSize: 12.5, marginTop: 2 },
  content: { padding: 20, paddingBottom: 24, gap: 8 },
  block: { marginBottom: 6 },
  label: { fontSize: 13.5, fontWeight: '800', marginBottom: 10 },

  // Label chips
  labelRow: { flexDirection: 'row', gap: 10 },
  labelChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  labelChipIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelChipText: { fontSize: 13, fontWeight: '700' },

  // Fields
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  field: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 12 },
  addressField: { minHeight: 70, textAlignVertical: 'top' },

  // Default
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  defaultCheck: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultTitle: { fontSize: 14, fontWeight: '800' },
  defaultSub: { fontSize: 12, marginTop: 2 },

  // Error
  errorBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  errorBoxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  errorText: { fontSize: 13, fontWeight: '700', flexShrink: 1 },

  // Footer
  footer: {
    padding: 18,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
  button: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
