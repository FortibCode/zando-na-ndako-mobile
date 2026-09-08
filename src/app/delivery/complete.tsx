import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { CheckCircle2, Star } from 'lucide-react-native';
import { Card, DeliveryScreen, PrimaryButton, SupportActions, styles } from '@/components/delivery-ui';
import { useDelivery } from '@/contexts/delivery-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { ApiError, fetchNotationsCommande, noterCommande, type ApiNotation } from '@/services/api';

// ─── Notation du client par le livreur : une seule fois par commande livrée, jamais de cible à
// préciser (le backend sait que le livreur ne peut noter que le client de la commande).
function RateClientCard({ commandeId }: { commandeId: string }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [notation, setNotation] = useState<ApiNotation | null | undefined>(undefined);
  const [note, setNote] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await fetchNotationsCommande(commandeId);
        if (!active) return;
        setNotation(list.find((n) => n.type_notateur === 'livreur' && n.type_cible === 'client') || null);
      } catch {
        if (active) setNotation(null);
      }
    })();
    return () => { active = false; };
  }, [commandeId]);

  const handleSubmit = async () => {
    if (note === 0 || submitting) return;
    setSubmitting(true);
    try {
      const created = await noterCommande(commandeId, { note, commentaire: comment.trim() || undefined });
      setNotation(created);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        try {
          const list = await fetchNotationsCommande(commandeId);
          setNotation(list.find((n) => n.type_notateur === 'livreur' && n.type_cible === 'client') || null);
        } catch { /* garde le formulaire tel quel */ }
      } else {
        alert(t('common.error', 'Erreur'), err instanceof Error ? err.message : t('rateClient.sendError', "Impossible d'envoyer votre avis."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (notation === undefined) return null;

  return (
    <Card index={2} style={{ marginTop: 18 }}>
      <Text style={[styles.sectionTitle, { fontSize: 17, color: colors.text }]}>{t('rateClient.title', 'Noter le client')}</Text>
      {notation ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <CheckCircle2 color={colors.fresh} size={20} />
          <Text style={[styles.muted, { color: colors.text, fontSize: 15 }]}>{t('rateClient.alreadyDone', 'Vous avez déjà noté ce client')}</Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 14 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Pressable key={s} onPress={() => setNote(s)} hitSlop={8}>
                <Star color={colors.gold} size={32} fill={s <= note ? colors.gold : 'transparent'} />
              </Pressable>
            ))}
          </View>
          <TextInput
            multiline
            value={comment}
            onChangeText={setComment}
            placeholder={t('rateClient.commentPlaceholder', 'Client agréable, sans problème particulier...')}
            placeholderTextColor={colors.textTertiary}
            style={{
              height: 80, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16,
              padding: 14, marginTop: 14, textAlignVertical: 'top', fontSize: 14, color: colors.text,
            }}
          />
          <View style={{ marginTop: 14, opacity: note === 0 || submitting ? 0.5 : 1 }}>
            <PrimaryButton onPress={handleSubmit}>
              {submitting ? <ActivityIndicator color="#FFF" size="small" /> : t('rateClient.send', 'Envoyer')}
            </PrimaryButton>
          </View>
        </>
      )}
    </Card>
  );
}

export default function Complete() {
  const { currentMission, clearCurrentMission } = useDelivery();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const numeroCommande = currentMission?.numero_commande ?? '—';
  const clientNom = currentMission?.beneficiaire_nom ?? currentMission?.client_nom ?? t('deliveryComplete.defaultClientName', 'Client');
  const distanceTotale = currentMission?.distance_km != null ? `${currentMission.distance_km} km` : '—';
  // Le gain du livreur est le tarif de livraison réel de la course, pas le montant total payé par
  // le client (qui couvre aussi les produits, reversés au vendeur).
  const gain = currentMission?.montant_livraison ?? 0;
  const gainLabel = t('deliveryComplete.gain', 'Gain');
  const commandeId = currentMission?.commande_id || currentMission?.id;

  const rows: [string, string][] = [
    [t('deliveryComplete.orderNumber', 'N° Commande'), numeroCommande],
    [t('deliveryComplete.client', 'Client'), clientNom],
    [t('deliveryComplete.distanceTraveled', 'Distance parcourue'), distanceTotale],
    [gainLabel, `${gain.toLocaleString('fr-FR')} FCFA`],
  ];

  const handleBackToDashboard = useCallback(() => {
    clearCurrentMission();
    router.replace('/delivery' as any);
  }, [clearCurrentMission]);

  return (
    <DeliveryScreen>
      <Animated.View entering={ZoomIn.duration(450).springify()} style={{ alignItems: 'center', paddingTop: 34 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.freshSoft, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: colors.fresh, alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 color="#FFF" size={36} strokeWidth={2.4} />
          </View>
        </View>
        <Text style={[styles.headerTitle, { fontSize: 24, textAlign: 'center', marginTop: 22, color: colors.text }]}>
          {t('deliveryComplete.title', 'Livraison confirmée')}
        </Text>
        <Text style={[styles.muted, { marginTop: 8, color: colors.textSecondary, textAlign: 'center' }]}>{t('deliveryComplete.subtitle', "Merci pour votre travail aujourd'hui")}</Text>
      </Animated.View>

      <Card index={1} style={{ marginTop: 26 }}>
        {rows.map(([label, value]) => (
          <View
            key={label}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 11,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={[styles.muted, { color: colors.textSecondary }]}>{label}</Text>
            <Text
              style={[
                styles.sectionTitle,
                { fontSize: 16, color: label === gainLabel ? colors.fresh : colors.text },
              ]}
            >
              {value}
            </Text>
          </View>
        ))}
      </Card>

      {commandeId && <RateClientCard commandeId={commandeId} />}

      <Animated.View entering={FadeInUp.duration(350).delay(240).springify()} style={{ marginTop: 18 }}>
        <PrimaryButton onPress={handleBackToDashboard}>
          {t('deliveryComplete.backToDashboard', 'Retour au tableau de bord')}
        </PrimaryButton>
      </Animated.View>

      <SupportActions />
    </DeliveryScreen>
  );
}
