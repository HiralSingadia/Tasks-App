import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { taskMatchesPlace } from '@/constants/task-matching';
import type { NearbyStore } from '@/types/nearby-store';
import type { Task } from '@/types/task';

type NearbyMapSnapshotProps = {
  activeTasks: Task[];
  isLoading: boolean;
  nearbyStores: NearbyStore[];
  onOpenNearby: () => void;
};

const snapshotRadiusMiles = 0.5;
const fallbackMapRegion = {
  latitude: 37.78825,
  latitudeDelta: 0.003,
  longitude: -122.4324,
  longitudeDelta: 0.003,
};
const focusedMapDelta = 0.0012;

const categoryColors: Record<string, string> = {
  'Cafe or convenience store': '#A35D00',
  'Gas station': '#2765B5',
  'Grocery store': '#2F7D4F',
  'Pet store': '#8A4AA8',
  Pharmacy: '#B5425A',
  'UPS Store': '#7A5524',
};
const categorySoftColors: Record<string, string> = {
  'Cafe or convenience store': '#FFF4DD',
  'Gas station': '#EAF2FF',
  'Grocery store': '#EAF8ED',
  'Pet store': '#F8ECFD',
  Pharmacy: '#FDECEF',
  'UPS Store': '#F8F0E1',
};
const categorySymbols: Record<string, IconSymbolName> = {
  'Cafe or convenience store': 'cup.and.saucer.fill',
  'Gas station': 'fuelpump.fill',
  'Grocery store': 'cart.fill',
  'Pet store': 'pawprint.fill',
  Pharmacy: 'cross.case.fill',
  'UPS Store': 'shippingbox.fill',
};

function getTaskCountForStore(store: NearbyStore, activeTasks: Task[]) {
  return activeTasks.filter((task) => taskMatchesPlace(task, store.place)).length;
}

function getFocusedMapRegion(store?: { latitude?: number; longitude?: number }): Region {
  if (
    store?.latitude === undefined ||
    store.longitude === undefined ||
    !Number.isFinite(store.latitude) ||
    !Number.isFinite(store.longitude)
  ) {
    return fallbackMapRegion;
  }

  return {
    latitude: store.latitude,
    latitudeDelta: focusedMapDelta,
    longitude: store.longitude,
    longitudeDelta: focusedMapDelta,
  };
}

function getMapRegionFromSignature(mappedStoreSignature: string): Region {
  if (mappedStoreSignature === 'empty-map') {
    return fallbackMapRegion;
  }

  const firstStoreSignature = mappedStoreSignature.split('|')[0];
  const [, latitude, longitude] = firstStoreSignature.split(':');

  return getFocusedMapRegion({
    latitude: Number(latitude),
    longitude: Number(longitude),
  });
}

export function NearbyMapSnapshot({
  activeTasks,
  isLoading,
  nearbyStores,
  onOpenNearby,
}: NearbyMapSnapshotProps) {
  const mapRef = useRef<MapView>(null);
  const currentMapRegion = useRef<Region>(fallbackMapRegion);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const activePlaces = useMemo(
    () => Array.from(new Set(activeTasks.flatMap((task) => task.places ?? [task.place]))),
    [activeTasks]
  );
  const nearestCategoryStores = useMemo(
    () =>
      activePlaces
        .map((place) => {
          const nearestStore = nearbyStores.find(
            (store) => store.place === place && store.distanceMiles <= snapshotRadiusMiles
          );

          if (!nearestStore) {
            return null;
          }

          return {
            ...nearestStore,
            taskCount: getTaskCountForStore(nearestStore, activeTasks),
          };
        })
        .filter((store): store is NearbyStore & { taskCount: number } => Boolean(store?.taskCount))
        .sort((firstStore, secondStore) => {
          const taskCountDifference = secondStore.taskCount - firstStore.taskCount;

          if (taskCountDifference !== 0) {
            return taskCountDifference;
          }

          return firstStore.distanceMiles - secondStore.distanceMiles;
        })
        .slice(0, 6),
    [activePlaces, activeTasks, nearbyStores]
  );
  const uniqueTaskCount = activeTasks.length;
  const closestStore = nearestCategoryStores[0];
  const title = closestStore
    ? `${nearestCategoryStores.length} nearest ${
        nearestCategoryStores.length === 1 ? 'stop' : 'stops'
      }`
    : 'Find nearby matches';
  const subtitle = closestStore
    ? `${uniqueTaskCount} ${uniqueTaskCount === 1 ? 'item' : 'items'} within ${snapshotRadiusMiles.toFixed(
        1
      )} mi`
    : `No matching stores within ${snapshotRadiusMiles.toFixed(1)} mi`;
  const selectedLegendStoreId = selectedStoreId ?? closestStore?.id;
  const mappedNearestStores = nearestCategoryStores.filter(
    (store): store is NearbyStore & { latitude: number; longitude: number; taskCount: number } =>
      store.latitude !== undefined && store.longitude !== undefined
  );
  const mappedStoreSignature =
    mappedNearestStores
      .map((store) => `${store.id}:${store.latitude}:${store.longitude}`)
      .join('|') || 'empty-map';
  const defaultMapRegion = useMemo(
    () => getMapRegionFromSignature(mappedStoreSignature),
    [mappedStoreSignature]
  );
  const focusStoreOnMap = (store: NearbyStore) => {
    if (store.latitude === undefined || store.longitude === undefined) {
      return;
    }

    setSelectedStoreId(store.id);
    const nextLatitudeDelta = Math.min(currentMapRegion.current.latitudeDelta, focusedMapDelta);
    const nextLongitudeDelta = Math.min(currentMapRegion.current.longitudeDelta, focusedMapDelta);
    const nextRegion = {
      latitude: store.latitude,
      latitudeDelta: nextLatitudeDelta,
      longitude: store.longitude,
      longitudeDelta: nextLongitudeDelta,
    };

    currentMapRegion.current = nextRegion;
    mapRef.current?.animateToRegion(nextRegion, 250);
  };

  useEffect(() => {
    setSelectedStoreId(null);
    currentMapRegion.current = defaultMapRegion;
  }, [defaultMapRegion]);

  return (
    <ThemedView style={styles.card}>
      <Pressable
        accessibilityHint="Opens nearby stores"
        accessibilityRole="button"
        onPress={onOpenNearby}
        style={({ pressed }) => [styles.header, pressed && styles.cardPressed]}>
        <ThemedView style={styles.titleGroup}>
          <ThemedText style={styles.title}>{isLoading ? 'Checking nearby...' : title}</ThemedText>
          <ThemedText numberOfLines={1} style={styles.subtitle}>
            {isLoading ? 'Getting your location and matching stores' : subtitle}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.locationBadge}>
          <IconSymbol name="location.fill" size={18} color="#2F6B4F" />
        </ThemedView>
      </Pressable>

      <ThemedView style={styles.map}>
        <MapView
          key={mappedStoreSignature}
          ref={mapRef}
          initialRegion={defaultMapRegion}
          onRegionChangeComplete={(region) => {
            currentMapRegion.current = region;
          }}
          provider={PROVIDER_GOOGLE}
          scrollEnabled
          style={styles.nativeMap}
          zoomEnabled>
          {mappedNearestStores.map((store, index) => {
            const isSelectedMarker = selectedLegendStoreId === store.id;
            const markerColor = categoryColors[store.place] ?? '#536579';

            return (
              <Marker
                coordinate={{ latitude: store.latitude, longitude: store.longitude }}
                description={`${store.taskCount} ${
                  store.taskCount === 1 ? 'item' : 'items'
                } nearby`}
                key={`${store.place}-${store.id}-${index}`}
                onPress={() => setSelectedStoreId(store.id)}
                pinColor={markerColor}
                title={store.name}
                zIndex={isSelectedMarker ? 2 : 1}
              />
            );
          })}
        </MapView>
        {nearestCategoryStores.length === 0 ? (
          <ThemedView style={styles.emptyMapOverlay}>
            <IconSymbol name="location.fill" size={18} color="#60706A" />
          </ThemedView>
        ) : null}
      </ThemedView>

      {nearestCategoryStores.length > 0 ? (
        <ThemedView style={styles.storeLegend}>
          {nearestCategoryStores.map((store) => {
            const isSelectedStore = selectedLegendStoreId === store.id;

            return (
              <Pressable
                accessibilityHint="Centers the map on this store"
                accessibilityLabel={`${store.name}, ${store.distanceMiles.toFixed(1)} miles away`}
                accessibilityRole="button"
                onPress={() => focusStoreOnMap(store)}
                key={store.id}
                style={({ pressed }) => [
                  styles.storeLegendBubble,
                  {
                    backgroundColor: categorySoftColors[store.place] ?? '#F0F4F8',
                    borderColor: categoryColors[store.place] ?? '#536579',
                  },
                  isSelectedStore && styles.selectedStoreLegendBubble,
                  pressed && styles.storeLegendBubblePressed,
                ]}>
                <ThemedView
                  style={[
                    styles.storeLegendIcon,
                    { backgroundColor: categoryColors[store.place] ?? '#536579' },
                  ]}>
                  <IconSymbol
                    name={categorySymbols[store.place] ?? 'mappin.circle.fill'}
                    size={18}
                    color="#FFFFFF"
                  />
                </ThemedView>
                <ThemedView style={styles.storeLegendTextGroup}>
                  <ThemedText numberOfLines={1} style={styles.storeLegendMeta}>
                    {store.name}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.storeLegendCount,
                      { color: categoryColors[store.place] ?? '#536579' },
                    ]}>
                    {store.taskCount} {store.taskCount === 1 ? 'item' : 'items'} |{' '}
                    {store.distanceMiles.toFixed(1)} mi
                  </ThemedText>
                </ThemedView>
              </Pressable>
            );
          })}
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE4DB',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 10,
    shadowColor: '#17231C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.78,
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 10,
  },
  titleGroup: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  title: {
    color: '#17231C',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
  },
  subtitle: {
    color: '#60706A',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  locationBadge: {
    alignItems: 'center',
    backgroundColor: '#E7F1E7',
    borderColor: '#CFE0CF',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  map: {
    backgroundColor: '#ECF4EA',
    borderColor: '#D8E6D2',
    borderRadius: 14,
    borderWidth: 1,
    height: 180,
    overflow: 'hidden',
  },
  nativeMap: {
    height: '100%',
    width: '100%',
  },
  emptyMapOverlay: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D7DEE7',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    left: '45%',
    position: 'absolute',
    top: '38%',
    width: 36,
  },
  storeLegend: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  storeLegendBubble: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    flexBasis: '48%',
    flexGrow: 1,
    gap: 6,
    maxWidth: '100%',
    minWidth: 0,
    paddingHorizontal: 7,
    paddingVertical: 9,
  },
  selectedStoreLegendBubble: {
    borderWidth: 2,
  },
  storeLegendBubblePressed: {
    opacity: 0.78,
  },
  storeLegendIcon: {
    alignItems: 'center',
    borderRadius: 15,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  storeLegendTextGroup: {
    backgroundColor: 'transparent',
    flex: 1,
    minWidth: 0,
  },
  storeLegendCount: {
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
  },
  storeLegendMeta: {
    color: '#17231C',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
});
