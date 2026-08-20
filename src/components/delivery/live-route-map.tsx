import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';
import { useTheme } from '@/contexts/theme-context';

export type LatLng = { latitude: number; longitude: number };

// Tuiles OpenStreetMap : aucune clé API requise (contrairement à PROVIDER_GOOGLE, qui exige une
// clé Google Maps sur Android — pas encore configurée pour ce projet). `mapType="none"` masque le
// fond de carte natif (Apple Maps sur iOS) pour ne laisser apparaître que la couche OSM.
const OSM_TILE_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

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
  const mapRef = useRef<MapView | null>(null);

  const points: LatLng[] = [driverPosition, destination].filter((p): p is LatLng => !!p);

  useEffect(() => {
    if (points.length < 2 || !mapRef.current) return;
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
      animated: true,
    });
  }, [points.length, driverPosition?.latitude, driverPosition?.longitude, destination?.latitude, destination?.longitude]);

  if (!destination) return null;

  const initialRegion = {
    latitude: (driverPosition ?? destination).latitude,
    longitude: (driverPosition ?? destination).longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={[styles.wrap, { height, borderColor: colors.border }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        mapType="none"
        initialRegion={initialRegion}
      >
        <UrlTile urlTemplate={OSM_TILE_TEMPLATE} maximumZ={19} flipY={false} />
        {driverPosition ? (
          <Marker coordinate={driverPosition} title={originLabel} pinColor={colors.primary} />
        ) : null}
        <Marker coordinate={destination} title={destinationLabel} />
        {points.length === 2 ? (
          <Polyline coordinates={points} strokeColor={colors.primary} strokeWidth={4} lineDashPattern={[8, 6]} />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginTop: 14,
  },
});
