import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/contexts/theme-context';
import { MapPin, Navigation } from 'lucide-react-native';

export type LatLng = { latitude: number; longitude: number };

export function LiveRouteMap({
  driverPosition,
  destination,
  destinationLabel,
  originLabel,
  height = 220,
}: {
  driverPosition: LatLng | null;
  destination: LatLng | null | undefined;
  destinationLabel?: string;
  originLabel?: string;
  height?: number;
}) {
  const { colors } = useTheme();

  if (!destination) return null;

  const lat = driverPosition?.latitude ?? destination.latitude;
  const lng = driverPosition?.longitude ?? destination.longitude;

  const bboxDelta = 0.015;
  const bbox = `${lng - bboxDelta},${lat - bboxDelta},${lng + bboxDelta},${lat + bboxDelta}`;
  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;

  return (
    <View style={[styles.wrap, { height, borderColor: colors.border, backgroundColor: colors.backgroundAlt }]}>
      {React.createElement('iframe', {
        title: 'Map',
        src: iframeSrc,
        style: { width: '100%', height: '100%', border: 'none' },
      })}
      <View style={[styles.badgeContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.badgeItem}>
          <MapPin size={14} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.text }]}>{destinationLabel || 'Destination'}</Text>
        </View>
        {driverPosition && (
          <View style={styles.badgeItem}>
            <Navigation size={14} color={colors.success} />
            <Text style={[styles.badgeText, { color: colors.text }]}>{originLabel || 'Livreur'}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginTop: 14,
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
