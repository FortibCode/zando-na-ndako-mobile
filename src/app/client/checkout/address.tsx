import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { alert } from '@/contexts/alert-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  FadeIn,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  MapPin,
  Home,
  Briefcase,
  Building2,
  Plus,
  Navigation,
  ChevronRight,
  Pencil,
  Trash2,
  Star,
  Phone,
  User as UserIcon,
  StickyNote,
} from 'lucide-react-native';
import { useClient } from '@/contexts/client-context';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from '@/contexts/language-context';
import type { DeliveryAddress } from '@/services/api';
import AddressFormModal from '@/components/address/address-form-modal';
import { EmptyState } from '@/components/lottie-animations';

function labelIcon(label: string) {
  switch (label) {
    case 'Bureau':
      return Briefcase;
    case 'Autre':
      return Building2;
    default:
      return Home;
  }
}

export default function AddressScreen() {
  const {
    addresses,
    addressesLoading,
    refreshAddresses,
    removeAddress,
    makeDefaultAddress,
    selectedAddress,
    setSelectedAddress,
  } = useClient();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [geolocating, setGeolocating] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Charger les adresses au montage
  useEffect(() => {
    refreshAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = () => {
    setEditingAddress(null);
    setPendingCoords(null);
    setModalVisible(true);
  };

  const handleEdit = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setPendingCoords(null);
    setModalVisible(true);
  };

  const handleDelete = useCallback(
    (address: DeliveryAddress) => {
      alert(
        t('address.deleteTitle', 'Supprimer cette adresse ?'),
        `« ${address.label} » ${t('address.deleteMsg', 'sera définitivement supprimée.')}`,
        [
          { text: t('common.cancel', 'Annuler'), style: 'cancel' },
          {
            text: t('common.delete', 'Supprimer'),
            style: 'destructive',
            onPress: async () => {
              try {
                await removeAddress(address.id);
              } catch (e: any) {
                alert('Erreur', e.message || t('address.deleteError', 'Impossible de supprimer cette adresse.'));
              }
            },
          },
        ]
      );
    },
    [removeAddress, t]
  );

  const handleSetDefault = useCallback(
    async (address: DeliveryAddress) => {
      if (address.est_defaut) return;
      try {
        await makeDefaultAddress(address.id);
        setSelectedAddress(address);
      } catch (e: any) {
        alert('Erreur', e.message || t('address.defaultError', "Impossible de définir l'adresse par défaut."));
      }
    },
    [makeDefaultAddress, setSelectedAddress, t]
  );

  const handleUseCurrentLocation = useCallback(() => {
    setGeolocating(true);
    // Utilise le service de géolocalisation RN
    const Geolocation = require('@react-native-community/geolocation').default;
    Geolocation.getCurrentPosition(
      (position: any) => {
        setGeolocating(false);
        const { latitude, longitude } = position.coords;
        setPendingCoords({ latitude, longitude });
        setEditingAddress(null);
        setModalVisible(true);
        alert(
          t('address.positionDetected', 'Position détectée'),
          `(${latitude.toFixed(4)}, ${longitude.toFixed(4)}) — ${t('address.positionCaptured', 'Votre position a été capturée. Vous pouvez maintenant compléter votre adresse manuellement.')}`
        );
      },
      (error: any) => {
        setGeolocating(false);
        alert(
          t('address.positionUnavailable', 'Position indisponible'),
          t('address.positionUnavailableDesc', 'Impossible de récupérer votre position. Renseignez votre adresse manuellement.'),
          [{ text: 'OK', onPress: () => setModalVisible(true) }]
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  const handleSelect = (address: DeliveryAddress) => {
    setSelectedAddress(address);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primarySoft }]}>
          <ArrowLeft color={colors.primary} size={24} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{t('address.title', 'Adresse de livraison')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {addresses.length > 0
              ? `${addresses.length} ${t('address.savedCount', 'adresse(s) enregistrée(s)')}`
              : t('address.none', 'Aucune adresse enregistrée')}
          </Text>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current location */}
        <Animated.View entering={FadeInUp.duration(400).springify()}>
          <Pressable onPress={handleUseCurrentLocation} style={[styles.current, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {geolocating ? (
              <ActivityIndicator color={colors.success} size="small" />
            ) : (
              <Navigation color={colors.success} size={22} />
            )}
            <Text style={[styles.currentText, { color: colors.primary }]}>
              {geolocating ? t('address.locating', 'Localisation en cours…') : t('checkout.currentLocation', 'Utiliser ma position actuelle')}
            </Text>
            <ChevronRight color={colors.textTertiary} size={20} />
          </Pressable>
        </Animated.View>

        {/* Loading */}
        {addressesLoading && addresses.length === 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.loading}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('address.loading', 'Chargement de vos adresses…')}</Text>
          </Animated.View>
        )}

        {/* Empty state */}
        {!addressesLoading && addresses.length === 0 && (
          <Animated.View entering={FadeInUp.duration(400).springify()}>
            <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <EmptyState
                title={t('address.emptyTitle', 'Aucune adresse')}
                message={t('address.emptyDesc', 'Ajoutez votre première adresse de livraison pour commencer vos commandes.')}
                size={120}
              />
            </View>
          </Animated.View>
        )}

        {/* Addresses list */}
        {addresses.map((addr, index) => {
          const Icon = labelIcon(addr.label);
          const isSelected = selectedAddress?.id === addr.id;
          return (
            <Animated.View
              key={addr.id}
              entering={FadeInLeft.duration(350).delay(100 + index * 80).springify()}
            >
              <View style={[styles.address, { backgroundColor: colors.surface, borderColor: colors.border }, isSelected && { borderColor: colors.primary, borderWidth: 2 }]}>
                <Pressable onPress={() => handleSelect(addr)} style={styles.addressMain}>
                  <View style={[styles.iconWrap, { backgroundColor: isSelected ? colors.primary : colors.primarySoft }]}>
                    <Icon color={isSelected ? '#FFF' : colors.primary} size={24} />
                  </View>
                  <View style={styles.copy}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.name, { color: colors.text }]}>{addr.label}</Text>
                      {addr.est_defaut && (
                        <View style={[styles.defaultBadge, { backgroundColor: colors.goldSoft }]}>
                          <Star color={colors.gold} size={10} fill={colors.gold} />
                          <Text style={[styles.defaultBadgeText, { color: colors.gold }]}>{t('address.default', 'Défaut')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.addressText, { color: colors.textSecondary }]} numberOfLines={2}>
                      {addr.adresse}
                      {addr.quartier ? `, ${addr.quartier}` : ''}
                      {addr.ville ? `, ${addr.ville}` : ''}
                    </Text>
                    {addr.nom_complet && (
                      <View style={styles.metaRow}>
                        <UserIcon color={colors.textTertiary} size={11} />
                        <Text style={[styles.metaText, { color: colors.textTertiary }]}>{addr.nom_complet}</Text>
                        {addr.telephone ? (
                          <>
                            <Text style={styles.metaSep}>·</Text>
                            <Phone color={colors.textTertiary} size={11} />
                            <Text style={[styles.metaText, { color: colors.textTertiary }]}>{addr.telephone}</Text>
                          </>
                        ) : null}
                      </View>
                    )}
                    {addr.instructions ? (
                      <View style={styles.instructionsRow}>
                        <StickyNote color={colors.textTertiary} size={11} />
                        <Text style={[styles.instructions, { color: colors.textTertiary }]} numberOfLines={1}>
                          {addr.instructions}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={[styles.radio, { borderColor: colors.borderStrong }, isSelected && { borderColor: colors.primary }]}>
                    {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                  </View>
                </Pressable>

                {/* Actions */}
                <View style={styles.actions}>
                  {!addr.est_defaut && (
                    <Pressable
                      onPress={() => handleSetDefault(addr)}
                      style={[styles.actionBtn, { backgroundColor: colors.primarySoft }]}
                      accessibilityLabel={t('address.setDefault', 'Définir par défaut')}
                    >
                      <Star color={colors.gold} size={16} />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => handleEdit(addr)}
                    style={[styles.actionBtn, { backgroundColor: colors.primarySoft }]}
                    accessibilityLabel={t('address.edit', 'Modifier')}
                  >
                    <Pencil color={colors.primary} size={16} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(addr)}
                    style={[styles.actionBtn, styles.actionDanger, { backgroundColor: colors.error + '14' }]}
                    accessibilityLabel={t('address.delete', 'Supprimer')}
                  >
                    <Trash2 color={colors.error} size={16} />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          );
        })}

        {/* Add new address card */}
        <Animated.View entering={FadeInUp.duration(400).delay(300).springify()}>
          <Pressable onPress={handleAdd} style={[styles.addCard, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
            <View style={[styles.addIcon, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
              <Plus color="#FFF" size={24} />
            </View>
            <Text style={[styles.addText, { color: colors.primary }]}>{t('address.addNew', 'Ajouter une nouvelle adresse')}</Text>
            <ChevronRight color={colors.primary} size={20} />
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      <Animated.View entering={FadeInUp.duration(400).delay(400).springify()} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => {
            if (!selectedAddress) {
              alert(
                t('address.selectionRequired', 'Sélection requise'),
                t('address.selectionRequiredDesc', 'Veuillez sélectionner ou ajouter une adresse de livraison pour continuer.')
              );
              return;
            }
            router.push('/client/checkout/slot' as any);
          }}
          style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        >
          <MapPin color="#FFF" size={18} />
          <Text style={styles.buttonText}>
            {selectedAddress ? t('address.continueBtn', 'Continuer') : t('address.chooseAddress', 'Choisir une adresse')}
          </Text>
        </Pressable>
      </Animated.View>

      {/* Modal */}
      <AddressFormModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setPendingCoords(null);
        }}
        address={editingAddress}
        initialCoords={pendingCoords}
      />
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
  content: { padding: 20, gap: 14, paddingBottom: 110 },

  // Current location
  current: {
    height: 64,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    shadowColor: '#1A2744',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
  },
  currentText: { fontSize: 16, fontWeight: '600', flex: 1 },

  // Loading
  loading: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14 },

  // Empty
  emptyBox: {
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
  },

  // Address card
  address: {
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: '#1A2744',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  addressMain: {
    minHeight: 110,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 17, fontWeight: '800' },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: 9.5, fontWeight: '800' },
  addressText: { fontSize: 14, lineHeight: 21, marginTop: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metaText: { fontSize: 11.5, fontWeight: '600' },
  metaSep: { color: '#CBD5E1', fontSize: 11.5, marginHorizontal: 2 },
  instructionsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  instructions: { fontSize: 11.5, fontStyle: 'italic', flexShrink: 1 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 14, height: 14, borderRadius: 7 },

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDanger: {},

  // Add card
  addCard: {
    height: 72,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
  },
  addIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addText: { fontSize: 15.5, fontWeight: '800', flex: 1 },

  // Footer
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    paddingBottom: 26,
    borderTopWidth: 1,
  },
  button: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});
