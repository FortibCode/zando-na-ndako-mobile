import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown, FadeInUp, FadeInLeft,
} from 'react-native-reanimated';
import { ArrowLeft, Clock, Truck, MapPin, Pencil, StickyNote, Check } from 'lucide-react-native';
import { useClient, computeSlotDates } from '@/contexts/client-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { FALLBACK_DELIVERY_FEE } from '@/services/api';

const SLOTS = ['08h - 10h', '10h - 12h', '12h - 14h', '14h - 16h', '16h - 18h', '18h - 20h'];

export default function SlotScreen() {
  const { selectedAddress, setSelectedSlot: setGlobalSlot, resolveZoneForAddress } = useClient();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');
  const [selectedSlot, setSelectedSlot] = useState('10h - 12h');
  const deliveryFee = Number(resolveZoneForAddress(selectedAddress)?.frais_livraison_base) || FALLBACK_DELIVERY_FEE;

  const addressLabel = selectedAddress
    ? `${selectedAddress.label}${selectedAddress.quartier ? ' · ' + selectedAddress.quartier : ''}`
    : t('slot.noAddress', 'Aucune adresse sélectionnée');

  const addressText = selectedAddress
    ? `${selectedAddress.adresse}${selectedAddress.ville ? ', ' + selectedAddress.ville : ''}`
    : t('slot.selectAddressPrompt', 'Veuillez sélectionner une adresse de livraison.');

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <Pressable onPress={() => router.back()}><ArrowLeft color={colors.primary} size={27} /></Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('slot.title', 'Choisissez un créneau')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Adresse sélectionnée */}
        <Animated.View
          entering={FadeInDown.duration(350).delay(60).springify()}
          style={[styles.addressCard, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '40' }]}
        >
          <View style={[styles.addressIcon, { backgroundColor: colors.primary }]}>
            <MapPin color="#FFF" size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.addressLabel, { color: colors.primary }]}>{addressLabel}</Text>
            <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={2}>{addressText}</Text>
            {selectedAddress?.instructions ? (
              <View style={styles.instructionsRow}>
                <StickyNote color={colors.textTertiary} size={11} />
                <Text style={[styles.addressInstructions, { color: colors.textTertiary }]} numberOfLines={1}>
                  {selectedAddress.instructions}
                </Text>
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={() => router.push('/client/checkout/address' as any)}
            style={[styles.editBtn, { backgroundColor: colors.surface }]}
            accessibilityLabel={t('address.edit', 'Modifier')}
          >
            <Pencil color={colors.primary} size={16} />
          </Pressable>
        </Animated.View>

        {/* Days */}
        <Animated.View
          entering={FadeInDown.duration(350).delay(100).springify()}
          style={styles.days}
        >
          <Pressable
            onPress={() => setSelectedDay('today')}
            style={[styles.day, { backgroundColor: colors.surface, borderColor: colors.border }, selectedDay === 'today' && { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primarySoft }]}
          >
            <Text style={[styles.dayText, { color: colors.primary }, selectedDay === 'today' && styles.dayTextActive]}>
              {t('common.today', "Aujourd'hui")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedDay('tomorrow')}
            style={[styles.day, { backgroundColor: colors.surface, borderColor: colors.border }, selectedDay === 'tomorrow' && { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primarySoft }]}
          >
            <Text style={[styles.dayText, { color: colors.primary }, selectedDay === 'tomorrow' && styles.dayTextActive]}>
              {t('common.tomorrow', 'Demain')}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Time Slots */}
        {SLOTS.map((slot, index) => {
          const isSelected = selectedSlot === slot;
          return (
            <Animated.View
              key={slot}
              entering={FadeInLeft.duration(350).delay(150 + index * 60).springify()}
            >
              <Pressable
                onPress={() => setSelectedSlot(slot)}
                style={[styles.slot, { backgroundColor: colors.surface, borderColor: colors.border }, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Clock color={isSelected ? '#FFF' : colors.primary} size={20} />
                <Text style={[styles.slotText, { color: colors.primary }, isSelected && styles.slotTextSelected]}>
                  {slot}
                </Text>
                {isSelected && (
                  <View style={styles.slotCheck}>
                    <Check color="#FFF" size={15} strokeWidth={3} />
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Delivery Info */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(500).springify()}
          style={[styles.deliveryInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.infoRow}>
            <Truck color={colors.textSecondary} size={20} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {selectedDay === 'today' ? t('slot.deliveryToday', "Livraison aujourd'hui en") : t('slot.deliveryTomorrow', 'Livraison demain en')}{' '}
              <Text style={[styles.infoHighlight, { color: colors.primary }]}>{selectedSlot}</Text>
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Truck color={colors.textSecondary} size={20} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {t('slot.deliveryFeeLabel', 'Frais de livraison :')} <Text style={[styles.infoHighlight, { color: colors.primary }]}>{deliveryFee.toLocaleString('fr-FR')} FCFA</Text>
            </Text>
          </View>
        </Animated.View>

        {/* Continue */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(550).springify()}
        >
          <Pressable
            onPress={() => {
              if (!selectedAddress) {
                router.push('/client/checkout/address' as any);
                return;
              }
              const { debut, fin } = computeSlotDates(selectedDay, selectedSlot);
              setGlobalSlot({ day: selectedDay, label: selectedSlot, debut, fin });
              router.push('/client/checkout/payment' as any);
            }}
            style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }, !selectedAddress && { backgroundColor: colors.textTertiary, shadowOpacity: 0 }]}
          >
            <Text style={styles.buttonText}>
              {selectedAddress ? t('address.continueBtn', 'Continuer') : t('address.chooseAddress', 'Choisir une adresse')}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    padding: 20,
    borderBottomWidth: 1,
  },
  title: { fontSize: 25, fontWeight: '800' },
  content: { padding: 20, paddingTop: 10, gap: 12 },

  // Adresse sélectionnée
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    shadowColor: '#1A2744',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  addressIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressLabel: { fontSize: 15, fontWeight: '900' },
  addressText: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  instructionsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  addressInstructions: { fontSize: 11.5, fontStyle: 'italic', flexShrink: 1 },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  days: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  day: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  dayText: { fontSize: 17, fontWeight: '600' },
  dayTextActive: { fontWeight: '800' },
  slot: {
    height: 64,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    shadowColor: '#1A2744',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  slotText: { fontSize: 18, fontWeight: '600', flex: 1 },
  slotTextSelected: { color: '#FFF', fontWeight: '800' },
  slotCheck: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  deliveryInfo: {
    borderRadius: 18,
    padding: 18,
    gap: 14,
    marginTop: 4,
    borderWidth: 1,
    shadowColor: '#1A2744',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: { fontSize: 16 },
  infoHighlight: { fontWeight: '800' },
  button: {
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});
