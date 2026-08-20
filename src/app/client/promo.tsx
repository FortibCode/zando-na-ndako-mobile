import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Percent } from 'lucide-react-native';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import { fetchProduitsPromotions, resolveMediaUrl, type ApiProduit } from '@/services/api';

function discountLabel(promo: NonNullable<ApiProduit['promotions']>[number]): string {
  const valeur = typeof promo.valeur_reduction === 'string' ? parseFloat(promo.valeur_reduction) : promo.valeur_reduction;
  return promo.type_reduction === 'pourcentage' ? `-${valeur}%` : `-${valeur.toLocaleString('fr-FR')} FCFA`;
}

export default function PromoScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [produits, setProduits] = useState<ApiProduit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduitsPromotions()
      .then(setProduits)
      .catch(() => setProduits([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primaryLight }]}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <View>
          <Text style={[styles.title, { color: colors.primary }]}>{t('promo.title', 'Promotions')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('promo.subtitle', 'Offres en cours chez nos vendeurs')}</Text>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : produits.length === 0 ? (
        <View style={styles.centerState}>
          <Percent color={colors.textTertiary} size={40} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('promo.emptyTitle', 'Aucune promotion en cours')}</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            {t('promo.emptyDesc', 'Revenez bientôt : les réductions mises en place par nos vendeurs s\'affichent ici automatiquement.')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {produits.map((produit, i) => {
            const promo = produit.promotions?.[0];
            const prix = typeof produit.prix_unitaire === 'string' ? parseFloat(produit.prix_unitaire) : produit.prix_unitaire;
            return (
              <Animated.View key={produit.id} entering={FadeInUp.duration(350).delay(i * 70).springify()}>
                <Pressable
                  onPress={() => router.push(`/client/product/${produit.id}` as any)}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                >
                  <Image
                    source={{ uri: resolveMediaUrl(produit.photo_produit) }}
                    style={[styles.cardImage, { backgroundColor: colors.background }]}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>{produit.nom_produit}</Text>
                    <Text style={[styles.cardVendeur, { color: colors.textSecondary }]} numberOfLines={1}>
                      {produit.vendeur?.nom_commerce || t('promo.defaultVendor', 'Vendeur Zando')}
                    </Text>
                    <Text style={[styles.cardPrice, { color: colors.primary }]}>{prix.toLocaleString('fr-FR')} FCFA</Text>
                  </View>
                  {promo ? (
                    <View style={[styles.discountTag, { backgroundColor: colors.success + '18' }]}>
                      <Text style={[styles.discountText, { color: colors.success }]}>{discountLabel(promo)}</Text>
                    </View>
                  ) : null}
                </Pressable>
              </Animated.View>
            );
          })}
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
    gap: 14,
    padding: 20,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { fontSize: 12.5, marginTop: 2 },

  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '900', marginTop: 6 },
  emptyDesc: { fontSize: 13.5, textAlign: 'center', lineHeight: 20 },

  content: { padding: 20, gap: 10, paddingBottom: 30 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardImage: { width: 64, height: 64, borderRadius: 12 },
  cardName: { fontSize: 14.5, fontWeight: '800' },
  cardVendeur: { fontSize: 12, marginTop: 2 },
  cardPrice: { fontSize: 14, fontWeight: '900', marginTop: 4 },
  discountTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  discountText: { fontSize: 12.5, fontWeight: '900' },
});
