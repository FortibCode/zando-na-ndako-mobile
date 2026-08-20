import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, UserCircle2, MapPin, Phone, Truck } from 'lucide-react-native';
import { BLUE, RED } from '@/components/client-ui';
import { useDiaspora, buildDeliveryAddress } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';

export default function DiasporaAddressScreen() {
  const { selectedBeneficiary, deliveryInstructions, setDeliveryInstructions } = useDiaspora();
  const { t } = useLanguage();

  const ville = selectedBeneficiary?.ville || 'Brazzaville';
  const streetAddress = buildDeliveryAddress(selectedBeneficiary);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />

      <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={BLUE} size={22} />
        </Pressable>
        <Text style={styles.title}>{t('diaspora.address.title', 'Adresse de livraison')}</Text>
        <Pressable
          onPress={() => router.push('/client/diaspora/beneficiaries-manage' as any)}
          style={styles.profileBtn}
        >
          <UserCircle2 color={BLUE} size={24} />
        </Pressable>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Livreur */}
        <Animated.View entering={FadeInUp.duration(400).springify()}>
          <Text style={styles.sectionLabel}>{t('diaspora.address.deliverySection', 'Livraison')}</Text>
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Truck color={BLUE} size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{t('diaspora.address.driverName', 'Livreur assigné automatiquement')}</Text>
              <Text style={styles.driverCity}>{t('diaspora.address.driverCityPrefix', 'Selon la disponibilité à')} {ville}{t('diaspora.address.driverCitySuffix', ', dès confirmation de la commande')}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Adresse */}
        <Animated.View entering={FadeInUp.duration(400).delay(80).springify()}>
          <Text style={styles.sectionLabel}>{t('diaspora.address.addressSection', 'Adresse de livraison')}</Text>
          <View style={styles.addressCard}>
            <Text style={styles.addressText}>{streetAddress}</Text>
            <View style={styles.addressIcon}>
              <MapPin color={BLUE} size={20} />
            </View>
          </View>
        </Animated.View>

        {/* Instructions */}
        <Animated.View entering={FadeInUp.duration(400).delay(160).springify()}>
          <Text style={styles.sectionLabel}>{t('diaspora.address.instructionsSection', 'Instructions (optionnel)')}</Text>
          <View style={styles.instructionsCard}>
            <TextInput
              value={deliveryInstructions}
              onChangeText={setDeliveryInstructions}
              placeholder={t('diaspora.address.instructionsPlaceholder', 'Ex : Laissez devant la porte s\'il vous plaît.')}
              placeholderTextColor="#94A3B8"
              multiline
              style={styles.instructionsInput}
            />
          </View>
        </Animated.View>

        {/* Contact bénéficiaire */}
        <Animated.View entering={FadeInUp.duration(400).delay(240).springify()}>
          <Text style={styles.sectionLabel}>{t('diaspora.address.contactSection', 'Contact du bénéficiaire')}</Text>
          <Pressable
            onPress={() => selectedBeneficiary && Linking.openURL(`tel:${selectedBeneficiary.telephone.replace(/\s/g, '')}`)}
            style={styles.contactCard}
          >
            <Text style={styles.contactPhone}>{selectedBeneficiary?.telephone || '+242 06 123 45 67'}</Text>
            <View style={styles.contactIcon}>
              <Phone color={BLUE} size={20} />
            </View>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).delay(320).springify()} style={styles.footer}>
        <Pressable
          onPress={() => {
            if (!selectedBeneficiary) {
              router.push('/client/diaspora/beneficiaries' as any);
              return;
            }
            router.push('/client/diaspora/checkout/slot' as any);
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{t('diaspora.address.continueButton', 'Continuer')}</Text>
        </Pressable>
      </Animated.View>
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
  title: { color: BLUE, fontSize: 18, fontWeight: '900', flex: 1 },
  profileBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 6, paddingBottom: 20 },

  sectionLabel: { color: BLUE, fontSize: 14.5, fontWeight: '800', marginBottom: 10, marginTop: 8 },

  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF', borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: '#EEF2FA',
    shadowColor: '#1A2744', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  driverAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center' },
  driverName: { color: BLUE, fontSize: 15.5, fontWeight: '800' },
  driverCity: { color: '#94A3B8', fontSize: 12, marginTop: 1 },

  addressCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#EEF2FA',
    shadowColor: '#1A2744', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  addressText: { color: '#334155', fontSize: 14.5, lineHeight: 21, flex: 1 },
  addressIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EEF4FF', alignItems: 'center', justifyContent: 'center' },

  instructionsCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 16, minHeight: 90,
    borderWidth: 1, borderColor: '#EEF2FA',
    shadowColor: '#1A2744', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  instructionsInput: { color: BLUE, fontSize: 14.5, minHeight: 58, textAlignVertical: 'top' },

  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#EEF2FA',
    shadowColor: '#1A2744', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  contactPhone: { color: BLUE, fontSize: 16, fontWeight: '800', flex: 1 },
  contactIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },

  footer: { padding: 20, paddingBottom: 26, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEF2FA' },
  button: { height: 60, borderRadius: 18, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', shadowColor: RED, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});
