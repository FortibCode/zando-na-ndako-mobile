import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { useVendor } from '@/contexts/vendor-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';

export default function PrepareOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getOrder, setOrderStatus, setPrepStep } = useVendor();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const STEP_TITLES = [
    t('vendorPrepare.step1', 'Vérifiez les produits à préparer'),
    t('vendorPrepare.step2', 'Emballez les produits soigneusement'),
    t('vendorPrepare.step3', 'Préparez la commande pour le livreur'),
  ];
  const order = getOrder(id || '');
  const [step, setStep] = useState(order?.prepStep || 1);

  if (!order) return null;

  const isLast = step >= 3;

  const handleNext = () => {
    if (isLast) {
      setOrderStatus(order.id, 'prete');
      router.replace(`/vendor/orders/${order.id}/ready` as any);
      return;
    }
    const next = step + 1;
    setStep(next);
    setPrepStep(order.id, next);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInDown.duration(350).springify()} style={[styles.title, { color: colors.text }]}>
          {t('vendorPrepare.title', 'Préparation de la commande')}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(350).delay(60).springify()} style={[styles.orderId, { color: colors.textSecondary }]}>
          {t('vendorPrepare.orderPrefix', 'Commande #')}{order.id}
        </Animated.Text>

        <Animated.View entering={FadeInUp.duration(400).delay(120).springify()} style={styles.progressRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.progressBar, { backgroundColor: colors.border }, s <= step && { backgroundColor: colors.success }]} />
          ))}
        </Animated.View>
        <Animated.Text entering={FadeInUp.duration(400).delay(160).springify()} style={[styles.stepLabel, { color: colors.success }]}>
          {t('vendorPrepare.stepLabelPrefix', 'Étape')} {step} {t('vendorPrepare.stepLabelOf', 'sur 3')}
        </Animated.Text>

        <Animated.Text entering={FadeInUp.duration(400).delay(200).springify()} style={[styles.sectionTitle, { color: colors.text }]}>
          {STEP_TITLES[step - 1]}
        </Animated.Text>

        {order.produits.map((p, i) => (
          <Animated.View
            key={p.nom}
            entering={FadeInUp.duration(350).delay(240 + i * 70).springify()}
            style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
          >
            <Image accessibilityLabel={p.nom} contentFit="cover" source={{ uri: p.image }} style={[styles.itemImage, { backgroundColor: colors.backgroundAlt }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemName, { color: colors.text }]}>{p.nom}</Text>
              <Text style={[styles.itemQty, { color: colors.textSecondary }]}>{t('vendorPrepare.quantityLabel', 'Quantité :')} {p.quantite}</Text>
            </View>
            <View style={[styles.checkBadge, { backgroundColor: colors.success }]}>
              <Check color={colors.white} size={16} strokeWidth={3} />
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(400).delay(400).springify()} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable onPress={handleNext} style={[styles.nextBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
          <Text style={styles.nextBtnText}>{isLast ? t('vendorPrepare.finishBtn', 'Terminer la préparation') : t('vendorPrepare.nextBtn', 'Étape suivante')}</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingTop: 28, gap: 14, paddingBottom: 30, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  orderId: { fontSize: 13.5, fontWeight: '700' },

  progressRow: { flexDirection: 'row', gap: 8, width: '100%', marginTop: 10 },
  progressBar: { flex: 1, height: 6, borderRadius: 3 },
  stepLabel: { fontSize: 13, fontWeight: '800' },

  sectionTitle: { fontSize: 17, fontWeight: '900', alignSelf: 'flex-start', marginTop: 8 },

  itemCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 14,
    borderWidth: 1,
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  itemImage: { width: 56, height: 56, borderRadius: 12 },
  itemName: { fontSize: 15, fontWeight: '800' },
  itemQty: { fontSize: 12.5, marginTop: 3 },
  checkBadge: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  footer: { padding: 20, paddingBottom: 26, borderTopWidth: 1 },
  nextBtn: {
    height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  nextBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
