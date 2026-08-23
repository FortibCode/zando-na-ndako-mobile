import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { ArrowLeft, Clock, Truck, User, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useDiaspora } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';
import { useClient, computeSlotDates } from '@/contexts/client-context';

const SLOTS = ['08h - 10h', '10h - 12h', '12h - 14h', '14h - 16h', '16h - 18h', '18h - 20h'];
const FALLBACK_DELIVERY_FEE = 2000;

export default function DiasporaSlotScreen() {
  const { selectedBeneficiary } = useDiaspora();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { setSelectedSlot: setGlobalSlot, resolveZoneForQuartier } = useClient();
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');
  const [selectedSlot, setSelectedSlot] = useState('10h - 12h');

  const zone = selectedBeneficiary ? resolveZoneForQuartier(selectedBeneficiary.quartier || selectedBeneficiary.ville) : null;
  const deliveryFee = zone ? Number(zone.frais_livraison_base) || FALLBACK_DELIVERY_FEE : FALLBACK_DELIVERY_FEE;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}><ArrowLeft color={colors.primary} size={27} /></Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('diaspora.slot.title', 'Choisissez un créneau')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Bénéficiaire */}
        <Animated.View entering={FadeInDown.duration(350).delay(60).springify()} style={[styles.beneficiaryCard, { backgroundColor: colors.primarySoft, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <View style={[styles.beneficiaryIcon, { backgroundColor: colors.primary }]}>
            <User color={colors.textInverse} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.beneficiaryLabel, { color: colors.text }]}>{selectedBeneficiary?.nom || t('diaspora.slot.defaultBeneficiary', 'Bénéficiaire')}</Text>
            <Text style={[styles.beneficiaryText, { color: colors.textSecondary }]}>{selectedBeneficiary?.ville || 'Brazzaville'}</Text>
          </View>
        </Animated.View>

        {/* Days */}
        <Animated.View entering={FadeInDown.duration(350).delay(100).springify()} style={styles.days}>
          <Pressable onPress={() => setSelectedDay('today')} style={[styles.day, { backgroundColor: colors.surface, borderColor: colors.border }, selectedDay === 'today' && { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.dayText, { color: colors.text }, selectedDay === 'today' && { fontWeight: '800' }]}>{t('diaspora.slot.today', "Aujourd'hui")}</Text>
          </Pressable>
          <Pressable onPress={() => setSelectedDay('tomorrow')} style={[styles.day, { backgroundColor: colors.surface, borderColor: colors.border }, selectedDay === 'tomorrow' && { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.dayText, { color: colors.text }, selectedDay === 'tomorrow' && { fontWeight: '800' }]}>{t('diaspora.slot.tomorrow', 'Demain')}</Text>
          </Pressable>
        </Animated.View>

        {SLOTS.map((slot, index) => {
          const isSelected = selectedSlot === slot;
          return (
            <Animated.View key={slot} entering={FadeInLeft.duration(350).delay(150 + index * 60).springify()}>
              <Pressable
                onPress={() => setSelectedSlot(slot)}
                style={[
                  styles.slot,
                  { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
                  isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Clock color={isSelected ? colors.textInverse : colors.text} size={20} />
                <Text style={[styles.slotText, { color: colors.text }, isSelected && { color: colors.textInverse, fontWeight: '800' }]}>{slot}</Text>
                {isSelected && (
                  <View style={styles.slotCheck}><Check color={colors.textInverse} size={15} strokeWidth={3} /></View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}

        <Animated.View entering={FadeInUp.duration(400).delay(500).springify()} style={[styles.deliveryInfo, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
          <View style={styles.infoRow}>
            <Truck color={colors.textSecondary} size={20} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {t('diaspora.slot.deliveryPrefix', 'Livraison')} {selectedDay === 'today' ? t('diaspora.slot.todayInline', "aujourd'hui") : t('diaspora.slot.tomorrowInline', 'demain')} {t('diaspora.slot.deliveryInWord', 'en')}{' '}
              <Text style={[styles.infoHighlight, { color: colors.primary }]}>{selectedSlot}</Text>
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Truck color={colors.textSecondary} size={20} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {t('diaspora.slot.deliveryFeeLabel', 'Frais de livraison :')} <Text style={[styles.infoHighlight, { color: colors.primary }]}>{deliveryFee.toLocaleString('fr-FR')} FCFA</Text>
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(400).delay(550).springify()}>
          <Pressable
            onPress={() => {
              const { debut, fin } = computeSlotDates(selectedDay, selectedSlot);
              setGlobalSlot({ day: selectedDay, label: selectedSlot, debut, fin });
              router.push('/client/diaspora/checkout/payment' as any);
            }}
            style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
          >
            <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('diaspora.slot.continueButton', 'Continuer')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 15, padding: 20,
    borderBottomWidth: 1,
  },
  title: { fontSize: 25, fontWeight: '800' },
  content: { padding: 20, paddingTop: 10, gap: 12 },

  beneficiaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, padding: 14,
    borderWidth: 1.5,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  beneficiaryIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  beneficiaryLabel: { fontSize: 15, fontWeight: '900' },
  beneficiaryText: { fontSize: 13, marginTop: 3 },

  days: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  day: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1.5 },
  dayText: { fontSize: 17, fontWeight: '600' },
  slot: {
    height: 64, borderRadius: 16, flexDirection: 'row',
    alignItems: 'center', gap: 14, paddingHorizontal: 18, borderWidth: 1.5,
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  slotText: { fontSize: 18, fontWeight: '600', flex: 1 },
  slotCheck: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  deliveryInfo: {
    borderRadius: 18, padding: 18, gap: 14, marginTop: 4,
    borderWidth: 1, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { fontSize: 16 },
  infoHighlight: { fontWeight: '800' },
  button: {
    height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    marginTop: 8, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  buttonText: { fontSize: 18, fontWeight: '800' },
});
