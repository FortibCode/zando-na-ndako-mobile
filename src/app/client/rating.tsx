import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, {
  FadeInDown, FadeInUp, ZoomIn,
  useAnimatedStyle, useSharedValue, withSpring, withSequence,
} from 'react-native-reanimated';
import { ArrowLeft, CheckCircle2, Star, Send } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import {
  ApiError, fetchClientCommandeDetail, fetchNotationsCommande, noterCommande,
  type ApiCommande, type ApiNotation,
} from '@/services/api';

const STAR_COLOR = '#F5A623';

function StarButton({ star, filled, disabled, onPress }: { star: number; filled: boolean; disabled?: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        disabled={disabled}
        onPress={() => {
          scale.value = withSequence(
            withSpring(1.3, { damping: 8, stiffness: 200 }),
            withSpring(1, { damping: 12, stiffness: 200 }),
          );
          onPress();
        }}
        hitSlop={8}
      >
        <Star color={STAR_COLOR} size={40} fill={filled ? STAR_COLOR : 'transparent'} />
      </Pressable>
    </Animated.View>
  );
}

function StarRating({ value, disabled, onChange }: { value: number; disabled?: boolean; onChange: (v: number) => void }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarButton key={star} star={star} filled={star <= value} disabled={disabled} onPress={() => onChange(star)} />
      ))}
    </View>
  );
}

function RatingCard({ title, name, value, disabled, doneLabel, onChange }: {
  title: string; name: string; value: number; disabled?: boolean; doneLabel?: string; onChange: (v: number) => void;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeInUp.duration(400).springify()}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.cardTitleRow}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        {disabled && doneLabel ? (
          <View style={[styles.doneBadge, { backgroundColor: colors.freshSoft }]}>
            <CheckCircle2 color={colors.success} size={13} />
            <Text style={[styles.doneBadgeText, { color: colors.success }]}>{doneLabel}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.name, { color: colors.textSecondary }]}>{name}</Text>
      <StarRating value={value} disabled={disabled} onChange={onChange} />
    </Animated.View>
  );
}

export default function RatingScreen() {
  const { commandeId, driverName: driverNameParam, sellerName: sellerNameParam } = useLocalSearchParams<{
    commandeId?: string; driverName?: string; sellerName?: string;
  }>();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [commande, setCommande] = useState<ApiCommande | null>(null);
  const [notations, setNotations] = useState<ApiNotation[]>([]);
  const [loading, setLoading] = useState(!!commandeId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [driver, setDriver] = useState(0);
  const [seller, setSeller] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadContext = useCallback(async () => {
    if (!commandeId) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    try {
      const [c, n] = await Promise.all([
        fetchClientCommandeDetail(commandeId),
        fetchNotationsCommande(commandeId),
      ]);
      setCommande(c);
      setNotations(n);
    } catch (err: any) {
      setLoadError(err?.message || t('rating.loadError', "Impossible de charger cette commande."));
    } finally {
      setLoading(false);
    }
  }, [commandeId, t]);

  useEffect(() => { loadContext(); }, [loadContext]);

  const vendeurNotation = notations.find((n) => n.type_cible === 'vendeur');
  const livreurNotation = notations.find((n) => n.type_cible === 'livreur');
  const hasVendeur = !!commande?.vendeur;
  const hasLivreur = !!commande?.livreur;
  const canRateSeller = hasVendeur && !vendeurNotation;
  const canRateDriver = hasLivreur && !livreurNotation;
  const isDelivered = commande?.statut_commande === 'livree';

  const driverName = commande?.livreur?.user?.nom_complet || driverNameParam || t('rating.defaultDriver', 'Votre livreur');
  const sellerName = commande?.vendeur?.nom_commerce || commande?.vendeur?.user?.nom_complet || sellerNameParam || t('rating.defaultSeller', 'Le vendeur');

  const isValid = (canRateSeller && seller > 0) || (canRateDriver && driver > 0);

  const handleSubmit = async () => {
    if (!commandeId || !isValid) return;
    setSubmitting(true);

    const targets: { cible: 'vendeur' | 'livreur'; note: number }[] = [];
    if (canRateSeller && seller > 0) targets.push({ cible: 'vendeur', note: seller });
    if (canRateDriver && driver > 0) targets.push({ cible: 'livreur', note: driver });

    let anySuccess = false;
    let lastErrorMessage: string | null = null;

    for (const target of targets) {
      try {
        await noterCommande(commandeId, {
          note: target.note,
          commentaire: comment.trim() || undefined,
          cible: target.cible,
        });
        anySuccess = true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          // Déjà noté entre-temps (ex: double soumission) : pas une vraie erreur pour l'utilisateur.
          anySuccess = true;
        } else {
          lastErrorMessage = err instanceof Error ? err.message : t('rating.sendError', "Impossible d'envoyer votre avis.");
        }
      }
    }

    try {
      const refreshed = await fetchNotationsCommande(commandeId);
      setNotations(refreshed);
    } catch { /* l'état local reste tel quel si le rafraîchissement échoue */ }

    setSubmitting(false);
    setSeller(0);
    setDriver(0);
    setComment('');

    if (lastErrorMessage) {
      alert(t('common.error', 'Erreur'), lastErrorMessage);
    } else if (anySuccess) {
      alert(
        t('rating.successTitle', 'Merci !'),
        t('rating.successDesc', 'Votre avis a bien été envoyé.'),
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>{t('rating.title', 'Noter votre expérience')}</Text>
      </Animated.View>

      {!commandeId ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInUp.duration(400).springify()} style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>{t('rating.noContextTitle', 'Choisissez une commande')}</Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
              {t('rating.noContextDesc', 'Rendez-vous dans « Mes commandes » et ouvrez une commande livrée pour la noter.')}
            </Text>
            <Pressable
              onPress={() => router.push('/client/(tabs)/orders' as any)}
              style={[styles.button, { backgroundColor: colors.primary, marginTop: 20 }]}
            >
              <Text style={styles.buttonText}>{t('rating.goToOrders', 'Voir mes commandes')}</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      ) : loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common.loading', 'Chargement…')}</Text>
        </View>
      ) : loadError ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInUp.duration(400).springify()} style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.error }]}>{t('common.error', 'Erreur')}</Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>{loadError}</Text>
            <Pressable onPress={loadContext} style={[styles.button, { backgroundColor: colors.primary, marginTop: 20 }]}>
              <Text style={styles.buttonText}>{t('common.retry', 'Réessayer')}</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      ) : commande && !isDelivered ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInUp.duration(400).springify()} style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>{t('rating.notYetDeliveredTitle', 'Pas encore livrée')}</Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
              {t('rating.notYetDeliveredDesc', "Cette commande n'est pas encore livrée. Vous pourrez la noter une fois la livraison terminée.")}
            </Text>
          </Animated.View>
        </ScrollView>
      ) : commande && !canRateSeller && !canRateDriver ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View entering={ZoomIn.duration(400).springify()} style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center' }]}>
            <CheckCircle2 color={colors.success} size={40} />
            <Text style={[styles.infoTitle, { color: colors.text, marginTop: 12, textAlign: 'center' }]}>{t('rating.allRatedTitle', 'Merci pour votre avis !')}</Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary, textAlign: 'center' }]}>
              {t('rating.allRatedDesc', 'Vous avez déjà noté cette commande.')}
            </Text>
          </Animated.View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.Text
            entering={FadeInDown.duration(400).delay(100).springify()}
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            {t('rating.subtitle', "Comment s'est passée votre commande ?")}
          </Animated.Text>

          {hasVendeur && (
            <RatingCard
              title={t('rating.rateSeller', 'Notez le vendeur')}
              name={sellerName}
              value={vendeurNotation ? vendeurNotation.note : seller}
              disabled={!canRateSeller}
              doneLabel={t('rating.alreadyRated', 'Déjà noté')}
              onChange={setSeller}
            />
          )}

          {hasLivreur && (
            <RatingCard
              title={t('rating.rateDriver', 'Notez votre livreur')}
              name={driverName}
              value={livreurNotation ? livreurNotation.note : driver}
              disabled={!canRateDriver}
              doneLabel={t('rating.alreadyRated', 'Déjà noté')}
              onChange={setDriver}
            />
          )}

          <Animated.View
            entering={FadeInUp.duration(400).delay(200).springify()}
            style={[styles.commentWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[styles.commentTitle, { color: colors.text }]}>
              {t('rating.commentLabel', 'Votre commentaire')} <Text style={[styles.optional, { color: colors.textSecondary }]}>{t('rating.optional', '(optionnel)')}</Text>
            </Text>
            <TextInput
              multiline
              value={comment}
              onChangeText={setComment}
              placeholder={t('rating.commentPlaceholder', 'Très bon service, livreur professionnel...')}
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, { color: colors.text }]}
            />
          </Animated.View>

          <Animated.View
            entering={FadeInUp.duration(400).delay(300).springify()}
            style={{ opacity: isValid && !submitting ? 1 : 0.5 }}
          >
            <Pressable
              disabled={!isValid || submitting}
              onPress={handleSubmit}
              style={[styles.button, { backgroundColor: colors.primary }, (!isValid || submitting) && styles.disabled]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Send color="#FFF" size={20} />
                  <Text style={styles.buttonText}>{t('rating.send', 'Envoyer')}</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        </ScrollView>
      )}
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
    paddingTop: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '900' },
  content: { padding: 20, paddingTop: 12 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  subtitle: {
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 24,
  },
  infoCard: {
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#1A2744',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoTitle: { fontSize: 19, fontWeight: '800' },
  infoDesc: { fontSize: 15, marginTop: 10, lineHeight: 21 },
  card: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1A2744',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 19, fontWeight: '800' },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  doneBadgeText: { fontSize: 11.5, fontWeight: '800' },
  name: { fontSize: 17, marginTop: 10 },
  stars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 8,
  },
  commentWrap: {
    borderRadius: 18,
    padding: 18,
    minHeight: 145,
    borderWidth: 1,
    shadowColor: '#1A2744',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  commentTitle: { fontSize: 18, fontWeight: '800' },
  optional: { fontWeight: '400' },
  input: {
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 13,
  },
  button: {
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    shadowColor: '#FF4500',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#FFF', fontSize: 19, fontWeight: '800' },
});
