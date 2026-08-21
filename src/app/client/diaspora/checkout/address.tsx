import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, UserCircle2, MapPin, Phone, Truck } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useDiaspora, buildDeliveryAddress } from '@/contexts/diaspora-context';
import { useLanguage } from '@/contexts/language-context';

export default function DiasporaAddressScreen() {
  const { selectedBeneficiary, deliveryInstructions, setDeliveryInstructions } = useDiaspora();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const ville = selectedBeneficiary?.ville || 'Brazzaville';
  const streetAddress = buildDeliveryAddress(selectedBeneficiary);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={22} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('diaspora.address.title', 'Adresse de livraison')}</Text>
        <Pressable
          onPress={() => router.push('/client/diaspora/beneficiaries-manage' as any)}
          style={[styles.profileBtn, { backgroundColor: colors.primarySoft }]}
        >
          <UserCircle2 color={colors.primary} size={24} />
        </Pressable>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Livreur */}
        <Animated.View entering={FadeInUp.duration(400).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('diaspora.address.deliverySection', 'Livraison')}</Text>
          <View style={[styles.driverCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <View style={[styles.driverAvatar, { backgroundColor: colors.primarySoft }]}>
              <Truck color={colors.primary} size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.driverName, { color: colors.text }]}>{t('diaspora.address.driverName', 'Livreur assigné automatiquement')}</Text>
              <Text style={[styles.driverCity, { color: colors.textTertiary }]}>{t('diaspora.address.driverCityPrefix', 'Selon la disponibilité à')} {ville}{t('diaspora.address.driverCitySuffix', ', dès confirmation de la commande')}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Adresse */}
        <Animated.View entering={FadeInUp.duration(400).delay(80).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('diaspora.address.addressSection', 'Adresse de livraison')}</Text>
          <View style={[styles.addressCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <Text style={[styles.addressText, { color: colors.text }]}>{streetAddress}</Text>
            <View style={[styles.addressIcon, { backgroundColor: colors.primarySoft }]}>
              <MapPin color={colors.primary} size={20} />
            </View>
          </View>
        </Animated.View>

        {/* Instructions */}
        <Animated.View entering={FadeInUp.duration(400).delay(160).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('diaspora.address.instructionsSection', 'Instructions (optionnel)')}</Text>
          <View style={[styles.instructionsCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <TextInput
              value={deliveryInstructions}
              onChangeText={setDeliveryInstructions}
              placeholder={t('diaspora.address.instructionsPlaceholder', 'Ex : Laissez devant la porte s\'il vous plaît.')}
              placeholderTextColor={colors.textTertiary}
              multiline
              style={[styles.instructionsInput, { color: colors.text }]}
            />
          </View>
        </Animated.View>

        {/* Contact bénéficiaire */}
        <Animated.View entering={FadeInUp.duration(400).delay(240).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('diaspora.address.contactSection', 'Contact du bénéficiaire')}</Text>
          <Pressable
            onPress={() => selectedBeneficiary && Linking.openURL(`tel:${selectedBeneficiary.telephone.replace(/\s/g, '')}`)}
            style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
          >
            <Text style={[styles.contactPhone, { color: colors.text }]}>{selectedBeneficiary?.telephone || '+242 06 123 45 67'}</Text>
            <View style={[styles.contactIcon, { backgroundColor: colors.freshSoft }]}>
              <Phone color={colors.success} size={20} />
            </View>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).delay(320).springify()} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => {
            if (!selectedBeneficiary) {
              router.push('/client/diaspora/beneficiaries' as any);
              return;
            }
            router.push('/client/diaspora/checkout/slot' as any);
          }}
          style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: colors.textInverse }]}>{t('diaspora.address.continueButton', 'Continuer')}</Text>
        </Pressable>
      </Animated.View>
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
  title: { fontSize: 18, fontWeight: '900', flex: 1 },
  profileBtn: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 6, paddingBottom: 20 },

  sectionLabel: { fontSize: 14.5, fontWeight: '800', marginBottom: 10, marginTop: 8 },

  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, padding: 14,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  driverAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: 15.5, fontWeight: '800' },
  driverCity: { fontSize: 12, marginTop: 1 },

  addressCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, padding: 16,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  addressText: { fontSize: 14.5, lineHeight: 21, flex: 1 },
  addressIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  instructionsCard: {
    borderRadius: 18, padding: 16, minHeight: 90,
    borderWidth: 1,
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  instructionsInput: { fontSize: 14.5, minHeight: 58, textAlignVertical: 'top' },

  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, padding: 16,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  contactPhone: { fontSize: 16, fontWeight: '800', flex: 1 },
  contactIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  footer: { padding: 20, paddingBottom: 26, borderTopWidth: 1 },
  button: { height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  buttonText: { fontSize: 18, fontWeight: '800' },
});
