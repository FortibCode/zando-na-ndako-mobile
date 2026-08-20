import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { ArrowLeft, Clock, Truck, User } from 'lucide-react-native';
import { BLUE, RED } from '@/components/client-ui';
import { useDiaspora } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';
import { useClient, computeSlotDates } from '@/contexts/client-context';

const SLOTS = ['08h - 10h', '10h - 12h', '12h - 14h', '14h - 16h', '16h - 18h', '18h - 20h'];
const FALLBACK_DELIVERY_FEE = 2000;

export default function DiasporaSlotScreen() {
  const { selectedBeneficiary } = useDiaspora();
  const { t } = useLanguage();
  const { setSelectedSlot: setGlobalSlot, resolveZoneForQuartier } = useClient();
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');
  const [selectedSlot, setSelectedSlot] = useState('10h - 12h');

  const zone = selectedBeneficiary ? resolveZoneForQuartier(selectedBeneficiary.quartier || selectedBeneficiary.ville) : null;
  const deliveryFee = zone ? Number(zone.frais_livraison_base) || FALLBACK_DELIVERY_FEE : FALLBACK_DELIVERY_FEE;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.header}>
        <Pressable onPress={() => router.back()}><ArrowLeft color={BLUE} size={27} /></Pressable>
        <Text style={styles.title}>{t('diaspora.slot.title', 'Choisissez un créneau')}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Bénéficiaire */}
        <Animated.View entering={FadeInDown.duration(350).delay(60).springify()} style={styles.beneficiaryCard}>
          <View style={styles.beneficiaryIcon}>
            <User color="#FFF" size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.beneficiaryLabel}>{selectedBeneficiary?.nom || t('diaspora.slot.defaultBeneficiary', 'Bénéficiaire')}</Text>
            <Text style={styles.beneficiaryText}>{selectedBeneficiary?.ville || 'Brazzaville'}</Text>
          </View>
        </Animated.View>

        {/* Days */}
        <Animated.View entering={FadeInDown.duration(350).delay(100).springify()} style={styles.days}>
          <Pressable onPress={() => setSelectedDay('today')} style={[styles.day, selectedDay === 'today' && styles.dayActive]}>
            <Text style={[styles.dayText, selectedDay === 'today' && styles.dayTextActive]}>{t('diaspora.slot.today', "Aujourd'hui")}</Text>
          </Pressable>
          <Pressable onPress={() => setSelectedDay('tomorrow')} style={[styles.day, selectedDay === 'tomorrow' && styles.dayActive]}>
            <Text style={[styles.dayText, selectedDay === 'tomorrow' && styles.dayTextActive]}>{t('diaspora.slot.tomorrow', 'Demain')}</Text>
          </Pressable>
        </Animated.View>

        {SLOTS.map((slot, index) => {
          const isSelected = selectedSlot === slot;
          return (
            <Animated.View key={slot} entering={FadeInLeft.duration(350).delay(150 + index * 60).springify()}>
              <Pressable onPress={() => setSelectedSlot(slot)} style={[styles.slot, isSelected && styles.slotSelected]}>
                <Clock color={isSelected ? '#FFF' : BLUE} size={20} />
                <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>{slot}</Text>
                {isSelected && (
                  <View style={styles.slotCheck}><Text style={styles.slotCheckText}>✓</Text></View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}

        <Animated.View entering={FadeInUp.duration(400).delay(500).springify()} style={styles.deliveryInfo}>
          <View style={styles.infoRow}>
            <Truck color="#607095" size={20} />
            <Text style={styles.infoText}>
              {t('diaspora.slot.deliveryPrefix', 'Livraison')} {selectedDay === 'today' ? t('diaspora.slot.todayInline', "aujourd'hui") : t('diaspora.slot.tomorrowInline', 'demain')} {t('diaspora.slot.deliveryInWord', 'en')}{' '}
              <Text style={styles.infoHighlight}>{selectedSlot}</Text>
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Truck color="#607095" size={20} />
            <Text style={styles.infoText}>
              {t('diaspora.slot.deliveryFeeLabel', 'Frais de livraison :')} <Text style={styles.infoHighlight}>{deliveryFee.toLocaleString('fr-FR')} FCFA</Text>
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
            style={styles.button}
          >
            <Text style={styles.buttonText}>{t('diaspora.slot.continueButton', 'Continuer')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFE' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 15, padding: 20,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E8ECF2',
  },
  title: { color: BLUE, fontSize: 25, fontWeight: '800' },
  content: { padding: 20, paddingTop: 10, gap: 12 },

  beneficiaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F0F6FF', borderRadius: 18, padding: 14,
    borderWidth: 1.5, borderColor: '#D0E1FF',
    shadowColor: '#1A2744', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  beneficiaryIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  beneficiaryLabel: { color: BLUE, fontSize: 15, fontWeight: '900' },
  beneficiaryText: { color: '#475569', fontSize: 13, marginTop: 3 },

  days: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  day: { flex: 1, padding: 18, backgroundColor: '#FFF', borderRadius: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#E8ECF2' },
  dayActive: { borderColor: BLUE, borderWidth: 2, backgroundColor: '#F0F6FF' },
  dayText: { color: BLUE, fontSize: 17, fontWeight: '600' },
  dayTextActive: { fontWeight: '800' },
  slot: {
    height: 64, backgroundColor: '#FFF', borderRadius: 16, flexDirection: 'row',
    alignItems: 'center', gap: 14, paddingHorizontal: 18, borderWidth: 1.5, borderColor: '#E8ECF2',
    shadowColor: '#1A2744', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  slotSelected: { backgroundColor: BLUE, borderColor: BLUE },
  slotText: { color: BLUE, fontSize: 18, fontWeight: '600', flex: 1 },
  slotTextSelected: { color: '#FFF', fontWeight: '800' },
  slotCheck: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  slotCheckText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  deliveryInfo: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 18, gap: 14, marginTop: 4,
    borderWidth: 1, borderColor: '#F0F3F8', shadowColor: '#1A2744', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoText: { color: '#607095', fontSize: 16 },
  infoHighlight: { color: BLUE, fontWeight: '800' },
  button: {
    height: 60, borderRadius: 18, backgroundColor: RED, alignItems: 'center', justifyContent: 'center',
    marginTop: 8, shadowColor: RED, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});
