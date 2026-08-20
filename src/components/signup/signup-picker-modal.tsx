import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type PickerOption = { id: string; label: string };

type SignupPickerModalProps = {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selectedId?: string;
  onSelect: (option: PickerOption) => void;
  onClose: () => void;
  showSearch?: boolean;
};

export function SignupPickerModal({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
  showSearch = true,
}: SignupPickerModalProps) {
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q),
    );
  }, [options, search]);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          {showSearch && (
            <View style={styles.searchWrap}>
              <Ionicons color="#9CA3AF" name="search" size={18} />
              <TextInput
                placeholder="Rechercher..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons color="#9CA3AF" name="close-circle" size={18} />
                </Pressable>
              )}
            </View>
          )}

          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
            }
            renderItem={({ item }) => {
              const selected = item.id === selectedId;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                >
                  <Text
                    style={[styles.optionText, selected && styles.optionTextSelected]}
                  >
                    {item.label}
                  </Text>
                  {selected && (
                    <Ionicons color="#0D347C" name="checkmark-circle" size={22} />
                  )}
                </Pressable>
              );
            }}
          />

          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Data helpers for DatePicker ───────────────────────────────────────────

const DAYS = Array.from({ length: 31 }, (_, i) => {
  const v = (i + 1).toString().padStart(2, '0');
  return { id: v, label: v };
});

const MONTHS = [
  { id: '01', label: 'Janvier' },
  { id: '02', label: 'Février' },
  { id: '03', label: 'Mars' },
  { id: '04', label: 'Avril' },
  { id: '05', label: 'Mai' },
  { id: '06', label: 'Juin' },
  { id: '07', label: 'Juillet' },
  { id: '08', label: 'Août' },
  { id: '09', label: 'Septembre' },
  { id: '10', label: 'Octobre' },
  { id: '11', label: 'Novembre' },
  { id: '12', label: 'Décembre' },
];

const YEARS = Array.from({ length: 100 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  const v = year.toString();
  return { id: v, label: v };
});

// ── DatePickerModal ────────────────────────────────────────────────────────

export function DatePickerModal({
  visible,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: string;
  onSelect: (dateString: string) => void;
  onClose: () => void;
}) {
  const parseDate = (v: string) => {
    const parts = v.split(' / ');
    return {
      day: parts[0]?.trim() || new Date().getDate().toString().padStart(2, '0'),
      month: parts[1]?.trim() || (new Date().getMonth() + 1).toString().padStart(2, '0'),
      year: parts[2]?.trim() || new Date().getFullYear().toString(),
    };
  };

  const parsed = parseDate(value);
  const [day, setDay] = useState(parsed.day);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  const handleConfirm = () => {
    onSelect(`${day} / ${month} / ${year}`);
    onClose();
  };

  const renderScrollColumn = (
    items: { id: string; label: string }[],
    selectedId: string,
    onSelectItem: (id: string) => void,
  ) => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 56 }}
      style={styles.dateScroll}
    >
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelectItem(item.id)}
            style={[styles.dateOption, selected && styles.dateOptionSelected]}
          >
            <Text style={[styles.dateOptionText, selected && styles.dateOptionTextSelected]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.datePickerSheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Date de naissance</Text>
          <View style={styles.datePickerRow}>
            <View style={styles.dateCol}>
              <Text style={styles.dateColLabel}>Jour</Text>
              {renderScrollColumn(DAYS, day, setDay)}
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateColLabel}>Mois</Text>
              {renderScrollColumn(MONTHS, month, setMonth)}
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateColLabel}>Année</Text>
              {renderScrollColumn(YEARS, year, setYear)}
            </View>
          </View>
          <Pressable onPress={handleConfirm} style={styles.dateConfirmButton}>
            <Text style={styles.dateConfirmText}>Confirmer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#0D347C',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  searchWrap: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4DBE8',
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#0D347C',
    fontSize: 14,
    paddingVertical: 8,
  },
  list: { maxHeight: 400 },
  listContent: { gap: 2 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  optionRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#0D347C',
    fontWeight: '700',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  datePickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  dateCol: {
    alignItems: 'center',
    flex: 1,
  },
  dateColLabel: {
    color: '#0D347C',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  dateScroll: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4DBE8',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  dateOption: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateOptionText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  dateOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  dateOptionTextSelected: {
    color: '#0D347C',
    fontWeight: '800',
  },
  dateConfirmButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#E30613',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  dateConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

