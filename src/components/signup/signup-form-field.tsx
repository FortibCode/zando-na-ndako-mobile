import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { SignupPickerModal } from './signup-picker-modal';
import { BrandColors } from '@/constants/brand';
import { Palette } from '@/design/tokens';

type SignupFormFieldProps = TextInputProps & {
  label: string;
  required?: boolean;
  optional?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function SignupFormField({ label, required, optional, icon, style, ...inputProps }: SignupFormFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
        {optional && <Text style={styles.optional}> (optionnel)</Text>}
      </Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        {Boolean(icon) && (
          <Ionicons
            color={focused ? BrandColors.blueBright : BrandColors.textMuted}
            name={icon}
            size={18}
          />
        )}
        <TextInput
          placeholderTextColor="#94A3B8"
          style={[styles.input, style]}
          onBlur={() => setFocused(false)}
          onFocus={() => setFocused(true)}
          {...inputProps}
        />
      </View>
    </View>
  );
}

export function SignupSelectField({
  label,
  value,
  required,
  onPress,
}: {
  label: string;
  value: string;
  required?: boolean;
  onPress?: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <Pressable onPress={onPress} style={styles.selectInput}>
        <Text style={[styles.selectText, !value && styles.placeholder]}>{value || 'Sélectionner'}</Text>
        <Ionicons color={BrandColors.blue} name="chevron-down" size={18} />
      </Pressable>
    </View>
  );
}

export function SignupRadioGroup({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.radioRow}>
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(option.id)}
              style={[styles.radioCard, selected && styles.radioCardSelected]}
            >
              <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export type PickerOption = { id: string; label: string };

export const PAYS_OPTIONS: PickerOption[] = [
  { id: 'france', label: 'France' },
  { id: 'congo', label: 'Congo-Brazzaville' },
  { id: 'rdc', label: 'République Démocratique du Congo' },
  { id: 'afrique_du_sud', label: 'Afrique du Sud' },
  { id: 'allemagne', label: 'Allemagne' },
  { id: 'angleterre', label: 'Angleterre' },
  { id: 'arabie_saoudite', label: 'Arabie Saoudite' },
  { id: 'argentine', label: 'Argentine' },
  { id: 'australie', label: 'Australie' },
  { id: 'autriche', label: 'Autriche' },
  { id: 'belgique', label: 'Belgique' },
  { id: 'bresil', label: 'Brésil' },
  { id: 'bulgarie', label: 'Bulgarie' },
  { id: 'cameroun', label: 'Cameroun' },
  { id: 'canada', label: 'Canada' },
  { id: 'chine', label: 'Chine' },
  { id: 'colombie', label: 'Colombie' },
  { id: 'coree_du_sud', label: 'Corée du Sud' },
  { id: 'cote_ivoire', label: "Côte d'Ivoire" },
  { id: 'danemark', label: 'Danemark' },
  { id: 'egypte', label: 'Égypte' },
  { id: 'emirats_arabes_unis', label: 'Émirats Arabes Unis' },
  { id: 'espagne', label: 'Espagne' },
  { id: 'etats_unis', label: 'États-Unis' },
  { id: 'finlande', label: 'Finlande' },
  { id: 'gabon', label: 'Gabon' },
  { id: 'grece', label: 'Grèce' },
  { id: 'guinee', label: 'Guinée' },
  { id: 'hongrie', label: 'Hongrie' },
  { id: 'inde', label: 'Inde' },
  { id: 'indonesie', label: 'Indonésie' },
  { id: 'iran', label: 'Iran' },
  { id: 'irlande', label: 'Irlande' },
  { id: 'israel', label: 'Israël' },
  { id: 'italie', label: 'Italie' },
  { id: 'japon', label: 'Japon' },
  { id: 'jordanie', label: 'Jordanie' },
  { id: 'kenya', label: 'Kenya' },
  { id: 'liban', label: 'Liban' },
  { id: 'luxembourg', label: 'Luxembourg' },
  { id: 'madagascar', label: 'Madagascar' },
  { id: 'mali', label: 'Mali' },
  { id: 'maroc', label: 'Maroc' },
  { id: 'mauritanie', label: 'Mauritanie' },
  { id: 'mexique', label: 'Mexique' },
  { id: 'monaco', label: 'Monaco' },
  { id: 'niger', label: 'Niger' },
  { id: 'nigeria', label: 'Nigeria' },
  { id: 'norvege', label: 'Norvège' },
  { id: 'pays_bas', label: 'Pays-Bas' },
  { id: 'perou', label: 'Pérou' },
  { id: 'philippines', label: 'Philippines' },
  { id: 'pologne', label: 'Pologne' },
  { id: 'portugal', label: 'Portugal' },
  { id: 'qatar', label: 'Qatar' },
  { id: 'republique_centrafricaine', label: 'République Centrafricaine' },
  { id: 'roumanie', label: 'Roumanie' },
  { id: 'royaume_uni', label: 'Royaume-Uni' },
  { id: 'russie', label: 'Russie' },
  { id: 'rwanda', label: 'Rwanda' },
  { id: 'senegal', label: 'Sénégal' },
  { id: 'serbie', label: 'Serbie' },
  { id: 'singapour', label: 'Singapour' },
  { id: 'suede', label: 'Suède' },
  { id: 'suisse', label: 'Suisse' },
  { id: 'tchad', label: 'Tchad' },
  { id: 'togo', label: 'Togo' },
  { id: 'tunisie', label: 'Tunisie' },
  { id: 'turquie', label: 'Turquie' },
  { id: 'ukraine', label: 'Ukraine' },
  { id: 'vietnam', label: 'Vietnam' },
];

export const DEVISE_OPTIONS: PickerOption[] = [
  { id: 'euro', label: 'Euro (€)' },
  { id: 'franc_cfa', label: 'Franc CFA (FCFA)' },
  { id: 'dollar', label: 'Dollar ($)' },
];

export const LANGUE_OPTIONS: PickerOption[] = [
  { id: 'francais', label: 'Français' },
  { id: 'lingala', label: 'Lingala' },
  { id: 'kituba', label: 'Kituba' },
];

export function SignupPickerField({
  label,
  options,
  value,
  required,
  onSelect,
  showSearch,
  pickerTitle,
}: {
  label: string;
  options: PickerOption[];
  value: string;
  required?: boolean;
  onSelect: (option: PickerOption) => void;
  showSearch?: boolean;
  pickerTitle?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => o.label === value || o.id === value);
  const displayValue = selectedOption?.label || value || '';

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <Pressable onPress={() => setOpen(true)} style={styles.selectInput}>
        <Text style={[styles.selectText, !displayValue && styles.placeholder]}>
          {displayValue || 'Sélectionner une option'}
        </Text>
        <Ionicons color={BrandColors.blue} name="chevron-down" size={18} />
      </Pressable>
      <SignupPickerModal
        visible={open}
        title={pickerTitle || label}
        options={options}
        selectedId={selectedOption?.id}
        onSelect={onSelect}
        onClose={() => setOpen(false)}
        showSearch={showSearch ?? options.length > 15}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 16, width: '100%' },
  label: { color: BrandColors.textDark, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  required: { color: BrandColors.red, fontWeight: '800' },
  optional: { color: BrandColors.textMuted, fontWeight: '500' },
inputWrap: {
    minHeight: 52,
    borderWidth: 1.2,
    borderColor: Palette.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.canvasAlt,
  },
  inputWrapFocused: {
    borderColor: BrandColors.blueBright,
    backgroundColor: BrandColors.white,
    shadowColor: BrandColors.blueBright,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    flex: 1,
    color: BrandColors.textDark,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 12,
    marginLeft: 6,
  },
  selectInput: {
    minHeight: 52,
    borderWidth: 1.2,
    borderColor: Palette.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.canvasAlt,
  },
  selectText: { color: BrandColors.textDark, fontSize: 15, fontWeight: '500' },
  placeholder: { color: '#94A3B8' },
  radioRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  radioCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.2,
    borderColor: Palette.border,
    borderRadius: 14,
    backgroundColor: Palette.canvasAlt,
  },
  radioCardSelected: {
    borderColor: BrandColors.blueBright,
    backgroundColor: '#EFF6FF',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: BrandColors.blueBright },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: BrandColors.blueBright },
  radioLabel: { color: BrandColors.textDark, fontSize: 14, fontWeight: '600' },
  radioLabelSelected: { color: BrandColors.blueBright, fontWeight: '800' },
});
