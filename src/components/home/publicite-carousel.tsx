import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/brand';
import { ApiBannierePublicitaire, trackBanniereClic } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH - 32;

interface PubliciteCarouselProps {
  bannieres: ApiBannierePublicitaire[];
}

export function PubliciteCarousel({ bannieres }: PubliciteCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<ApiBannierePublicitaire>>(null);

  useEffect(() => {
    if (bannieres.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % bannieres.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [bannieres.length]);

  if (!bannieres || bannieres.length === 0) {
    return null;
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / CAROUSEL_ITEM_WIDTH);
    if (index >= 0 && index < bannieres.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const handleBannerPress = (banner: ApiBannierePublicitaire) => {
    trackBanniereClic(banner.id);

    const targetId = banner.cible_id || banner.vendeur_id;

    if (banner.type_cible === 'boutique' && targetId) {
      router.push(`/client/boutique/${targetId}` as any);
    } else if (banner.type_cible === 'produit' && banner.cible_id) {
      router.push(`/client/produit/${banner.cible_id}` as any);
    } else if (banner.vendeur_id) {
      router.push(`/client/boutique/${banner.vendeur_id}` as any);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={bannieres}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={CAROUSEL_ITEM_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, index) => ({
          length: CAROUSEL_ITEM_WIDTH + 12,
          offset: (CAROUSEL_ITEM_WIDTH + 12) * index,
          index,
        })}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleBannerPress(item)}
            style={({ pressed }) => [styles.cardContainer, pressed && styles.cardPressed]}
          >
            <Image
              source={{ uri: item.image_url }}
              style={styles.bannerImage}
              contentFit="cover"
              transition={300}
            />

            {/* Dark Gradient Overlay */}
            <View style={styles.overlay} />

            {/* Top Badges */}
            <View style={styles.topBadgeRow}>
              <View style={styles.sponsorBadge}>
                <Ionicons name="sparkles" size={12} color="#FFF" />
                <Text style={styles.sponsorBadgeText}>OFFRE SPÉCIALE</Text>
              </View>

              {item.vendeur && (
                <View style={styles.vendeurBadge}>
                  <Text style={styles.vendeurBadgeText} numberOfLines={1}>
                    {item.vendeur.nom_commerce}
                  </Text>
                </View>
              )}
            </View>

            {/* Bottom Content */}
            <View style={styles.bottomContent}>
              <Text style={styles.title} numberOfLines={1}>
                {item.titre}
              </Text>
              {item.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              <View style={styles.actionRow}>
                <Text style={styles.actionText}>Voir l'offre</Text>
                <Ionicons name="arrow-forward-circle" size={18} color="#FFF" />
              </View>
            </View>
          </Pressable>
        )}
      />

      {/* Pagination Dots */}
      {bannieres.length > 1 && (
        <View style={styles.paginationRow}>
          {bannieres.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  cardContainer: {
    width: CAROUSEL_ITEM_WIDTH,
    height: 160,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: BrandColors.blue,
    position: 'relative',
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(13, 52, 124, 0.45)', // Overlay bleu navy subtil
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E30613',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sponsorBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vendeurBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: 140,
  },
  vendeurBadgeText: {
    color: BrandColors.blue,
    fontSize: 11,
    fontWeight: '700',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: BrandColors.orange,
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#CBD5E1',
  },
});
