import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Award,
  Check,
  ChevronLeft,
  Crown,
  Package,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { alert } from '@/contexts/alert-context';
import {
  ApiVendeurAbonnementInfo,
  fetchVendeurAbonnement,
  souscrireVendeurAbonnement,
} from '@/services/api';

interface PlanConfig {
  id: 'starter' | 'pro' | 'vip';
  title: string;
  badgeLabel: string;
  priceFormatted: string;
  priceValue: number;
  period: string;
  icon: any;
  color: string;
  bgLight: string;
  features: string[];
}

export default function VendorSubscriptionScreen() {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<ApiVendeurAbonnementInfo | null>(null);

  // Modal de souscription
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'momo_mtn' | 'momo_airtel' | 'solde_vendeur'>('momo_mtn');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const PLANS: PlanConfig[] = [
    {
      id: 'starter',
      title: 'Starter',
      badgeLabel: 'Gratuit',
      priceFormatted: '0 FCFA',
      priceValue: 0,
      period: 'Gratuit à vie',
      icon: Package,
      color: '#6B7280',
      bgLight: isDark ? '#37415133' : '#F3F4F6',
      features: [
        'Jusqu’à 10 produits au catalogue',
        'Référencement standard',
        'Gestion des commandes basique',
        'Support standard par ticket',
      ],
    },
    {
      id: 'pro',
      title: 'Boutique PRO',
      badgeLabel: 'PRO Verified',
      priceFormatted: '10 000 FCFA',
      priceValue: 10000,
      period: 'par mois',
      icon: ShieldCheck,
      color: '#2563EB',
      bgLight: isDark ? '#1E3A8A33' : '#EFF6FF',
      features: [
        'Produits ILLIMITÉS au catalogue',
        'Badge "PRO Verified" officiel',
        'Position prioritaire dans la recherche',
        'Tableau de bord statistique avancé',
        'Support prioritaire 6j/7',
      ],
    },
    {
      id: 'vip',
      title: 'VIP Gold',
      badgeLabel: 'VIP Gold',
      priceFormatted: '25 000 FCFA',
      priceValue: 25000,
      period: 'par mois',
      icon: Crown,
      color: '#D97706',
      bgLight: isDark ? '#78350F33' : '#FEF3C7',
      features: [
        'Produits ILLIMITÉS au catalogue',
        'Badge "VIP Gold" prestige',
        'Priorité MAXIMALE en tête des recherches',
        'Mise en avant sur la page d’accueil',
        'Campagnes promo dédiées Zando',
        'Support VIP dédié 7j/7',
      ],
    },
  ];

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const data = await fetchVendeurAbonnement();
      setSubscription(data);
    } catch (err: any) {
      alert('Erreur', err?.message || "Impossible de charger l'abonnement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const handleOpenSubscribe = (plan: PlanConfig) => {
    if (subscription?.formule_actuelle === plan.id && subscription?.est_actif) {
      alert('Abonnement actif', `Vous êtes déjà abonné à la formule ${plan.title}.`);
      return;
    }
    setSelectedPlan(plan);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedPlan) return;

    if (selectedPlan.priceValue > 0 && paymentMethod !== 'solde_vendeur') {
      if (!phone.trim() || phone.trim().length < 8) {
        alert('Numéro invalide', 'Veuillez saisir un numéro Mobile Money valide (ex: 06 123 45 67).');
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await souscrireVendeurAbonnement({
        formule: selectedPlan.id,
        moyen_paiement: paymentMethod,
        telephone: phone.trim(),
      });

      setSelectedPlan(null);
      setSubscription(res);

      alert(
        'Souscription Réussie !',
        `Votre abonnement ${selectedPlan.title} a été activé avec succès. Merci d'utiliser Zando na Ndako !`
      );
    } catch (err: any) {
      alert('Échec de la souscription', err?.message || 'Une erreur est survenue lors de la transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentPlan = PLANS.find((p) => p.id === subscription?.formule_actuelle) || PLANS[0];
  const isUnlimited = subscription ? subscription.limite_produits > 1000 : false;
  const productUsagePercent = subscription && !isUnlimited
    ? Math.min(100, Math.round((subscription.nombre_produits_actuel / subscription.limite_produits) * 100))
    : 100;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={colors.text} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mon Forfait Boutique</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement de vos informations d'abonnement...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Current Status Card */}
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={[
              styles.statusCard,
              {
                backgroundColor: colors.surface,
                borderColor: currentPlan.color,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={styles.statusCardHeader}>
              <View style={styles.statusBadgeRow}>
                <View style={[styles.badgePill, { backgroundColor: currentPlan.color }]}>
                  <currentPlan.icon color="#FFF" size={14} />
                  <Text style={styles.badgeText}>{currentPlan.badgeLabel}</Text>
                </View>
                <View
                  style={[
                    styles.statePill,
                    {
                      backgroundColor: subscription?.est_actif ? '#10B98122' : '#EF444422',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stateText,
                      { color: subscription?.est_actif ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {subscription?.est_actif ? 'Actif' : 'Expiré'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.storeNameText, { color: colors.text }]}>
                {subscription?.boutique?.nom_boutique || 'Ma Boutique'}
              </Text>
            </View>

            {/* Expiration date if present */}
            {subscription?.date_expiration && (
              <View style={styles.expiryRow}>
                <Text style={[styles.expiryLabel, { color: colors.textSecondary }]}>
                  Date d'échéance :
                </Text>
                <Text style={[styles.expiryValue, { color: colors.text }]}>
                  {new Date(subscription.date_expiration).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            )}

            {/* Product quota usage */}
            <View style={styles.quotaContainer}>
              <View style={styles.quotaHeader}>
                <Text style={[styles.quotaTitle, { color: colors.textSecondary }]}>
                  Limite de produits
                </Text>
                <Text style={[styles.quotaValue, { color: colors.text }]}>
                  {subscription?.nombre_produits_actuel || 0} /{' '}
                  {isUnlimited ? 'Illimité' : subscription?.limite_produits}
                </Text>
              </View>

              {!isUnlimited && (
                <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${productUsagePercent}%`,
                        backgroundColor: productUsagePercent >= 90 ? '#EF4444' : colors.primary,
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          </Animated.View>

          {/* Section Title */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Choisissez la formule adaptée à votre croissance
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Boostez vos ventes avec nos badges certifiés et une meilleure visibilité dans la recherche.
          </Text>

          {/* Plans Comparison */}
          {PLANS.map((plan, index) => {
            const PlanIcon = plan.icon;
            const isCurrent = subscription?.formule_actuelle === plan.id && subscription?.est_actif;

            return (
              <Animated.View
                key={plan.id}
                entering={FadeInUp.duration(400).delay(100 + index * 100).springify()}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isCurrent ? plan.color : colors.border,
                    shadowColor: colors.shadow,
                  },
                ]}
              >
                {/* Header of plan */}
                <View style={styles.planCardHeader}>
                  <View style={[styles.planIconWrap, { backgroundColor: plan.bgLight }]}>
                    <PlanIcon color={plan.color} size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.planTitleRow}>
                      <Text style={[styles.planTitle, { color: colors.text }]}>{plan.title}</Text>
                      {plan.badgeLabel !== 'Gratuit' && (
                        <View style={[styles.miniBadge, { backgroundColor: plan.color }]}>
                          <Text style={styles.miniBadgeText}>{plan.badgeLabel}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceFormatted, { color: plan.color }]}>
                        {plan.priceFormatted}
                      </Text>
                      <Text style={[styles.pricePeriod, { color: colors.textTertiary }]}>
                        {' '}
                        / {plan.period}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Features list */}
                <View style={[styles.featuresList, { borderTopColor: colors.border }]}>
                  {plan.features.map((feat, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Check color={plan.color} size={16} />
                      <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                        {feat}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Action button */}
                <Pressable
                  onPress={() => handleOpenSubscribe(plan)}
                  disabled={isCurrent}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: isCurrent
                        ? colors.border
                        : plan.id === 'starter'
                        ? colors.border
                        : plan.color,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.actionBtnText,
                      { color: isCurrent ? colors.textSecondary : '#FFF' },
                    ]}
                  >
                    {isCurrent ? 'Forfait Actuel' : plan.id === 'starter' ? 'Gratuit' : 'Souscrire'}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>
      )}

      {/* Modal de Souscription */}
      <Modal visible={!!selectedPlan} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {selectedPlan && (
                  <selectedPlan.icon color={selectedPlan.color} size={22} />
                )}
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Activer {selectedPlan?.title}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedPlan(null)} style={styles.closeBtn}>
                <X color={colors.textSecondary} size={22} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {/* Summary */}
              <View style={[styles.summaryBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Montant de l'abonnement mensuel :
                </Text>
                <Text style={[styles.summaryAmount, { color: selectedPlan?.color }]}>
                  {selectedPlan?.priceFormatted}
                </Text>
              </View>

              {/* Payment Method Selector */}
              {selectedPlan && selectedPlan.priceValue > 0 && (
                <>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Moyen de paiement :
                  </Text>

                  <View style={styles.methodsContainer}>
                    <Pressable
                      onPress={() => setPaymentMethod('momo_mtn')}
                      style={[
                        styles.methodCard,
                        {
                          borderColor: paymentMethod === 'momo_mtn' ? colors.primary : colors.border,
                          backgroundColor: paymentMethod === 'momo_mtn' ? colors.primarySoft : colors.surface,
                        },
                      ]}
                    >
                      <Smartphone color={paymentMethod === 'momo_mtn' ? colors.primary : colors.textSecondary} size={20} />
                      <Text style={[styles.methodText, { color: colors.text }]}>MTN MoMo</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setPaymentMethod('momo_airtel')}
                      style={[
                        styles.methodCard,
                        {
                          borderColor: paymentMethod === 'momo_airtel' ? colors.primary : colors.border,
                          backgroundColor: paymentMethod === 'momo_airtel' ? colors.primarySoft : colors.surface,
                        },
                      ]}
                    >
                      <Smartphone color={paymentMethod === 'momo_airtel' ? colors.primary : colors.textSecondary} size={20} />
                      <Text style={[styles.methodText, { color: colors.text }]}>Airtel Money</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setPaymentMethod('solde_vendeur')}
                      style={[
                        styles.methodCard,
                        {
                          borderColor: paymentMethod === 'solde_vendeur' ? colors.primary : colors.border,
                          backgroundColor: paymentMethod === 'solde_vendeur' ? colors.primarySoft : colors.surface,
                        },
                      ]}
                    >
                      <Wallet color={paymentMethod === 'solde_vendeur' ? colors.primary : colors.textSecondary} size={20} />
                      <Text style={[styles.methodText, { color: colors.text }]}>Solde Vendeur</Text>
                    </Pressable>
                  </View>

                  {/* Phone input for MoMo */}
                  {paymentMethod !== 'solde_vendeur' && (
                    <View style={{ marginTop: 16 }}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>
                        Numéro Mobile Money (Brazzaville / Pointe-Noire) :
                      </Text>
                      <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Ex: 06 123 45 67"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="phone-pad"
                        style={[
                          styles.phoneInput,
                          {
                            color: colors.text,
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                          },
                        ]}
                      />
                    </View>
                  )}
                </>
              )}

              {/* Confirm Button */}
              <Pressable
                onPress={handleConfirmSubscription}
                disabled={submitting}
                style={[
                  styles.confirmBtn,
                  { backgroundColor: selectedPlan?.color || colors.primary },
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    {selectedPlan?.priceValue === 0
                      ? 'Confirmer le plan gratuit'
                      : 'Payer et Activer mon abonnement'}
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 18,
    marginBottom: 24,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statusCardHeader: {
    marginBottom: 12,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '900',
  },
  statePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  stateText: {
    fontSize: 12,
    fontWeight: '800',
  },
  storeNameText: {
    fontSize: 20,
    fontWeight: '900',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#00000015',
  },
  expiryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  expiryValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  quotaContainer: {
    marginTop: 12,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  quotaTitle: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  quotaValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 18,
    marginBottom: 16,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  planIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  miniBadgeText: {
    color: '#FFF',
    fontSize: 10.5,
    fontWeight: '900',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  priceFormatted: {
    fontSize: 16,
    fontWeight: '900',
  },
  pricePeriod: {
    fontSize: 12,
  },
  featuresList: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 10,
    marginBottom: 18,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
  },
  actionBtn: {
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 6,
  },
  summaryBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  methodsContainer: {
    gap: 10,
    marginBottom: 10,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  methodText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  phoneInput: {
    height: 50,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '700',
  },
  confirmBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
