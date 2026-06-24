import { Pressable, StyleSheet } from 'react-native';

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

const pinPositions = [
  { left: '18%', top: '56%' },
  { left: '48%', top: '28%' },
  { left: '72%', top: '62%' },
  { left: '32%', top: '76%' },
  { left: '62%', top: '18%' },
  { left: '12%', top: '24%' },
] as const;
const snapshotRadiusMiles = 0.5;

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

export function NearbyMapSnapshot({
  activeTasks,
  isLoading,
  nearbyStores,
  onOpenNearby,
}: NearbyMapSnapshotProps) {
  const activePlaces = Array.from(
    new Set(activeTasks.flatMap((task) => task.places ?? [task.place]))
  );
  const nearestCategoryStores = activePlaces
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
    .slice(0, pinPositions.length);
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

  return (
    <Pressable
      accessibilityHint="Opens nearby stores"
      accessibilityRole="button"
      onPress={onOpenNearby}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <ThemedView style={styles.header}>
        <ThemedView style={styles.titleGroup}>
          <ThemedText style={styles.title}>{isLoading ? 'Checking nearby...' : title}</ThemedText>
          <ThemedText numberOfLines={1} style={styles.subtitle}>
            {isLoading ? 'Getting your location and matching stores' : subtitle}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.locationBadge}>
          <IconSymbol name="location.fill" size={18} color="#2F6B4F" />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.map}>
        <ThemedView style={[styles.road, styles.roadOne]} />
        <ThemedView style={[styles.road, styles.roadTwo]} />
        <ThemedView style={[styles.road, styles.roadThree]} />
        <ThemedView style={styles.currentLocation} />

        {nearestCategoryStores.length > 0
          ? nearestCategoryStores.map((store, index) => (
              <ThemedView
                key={store.id}
                style={[
                  styles.pin,
                  pinPositions[index],
                  { backgroundColor: categoryColors[store.place] ?? '#536579' },
                ]}>
                <ThemedText style={styles.pinText}>{store.taskCount}</ThemedText>
              </ThemedView>
            ))
          : (
              <ThemedView style={styles.emptyPin}>
                <IconSymbol name="location.fill" size={18} color="#60706A" />
              </ThemedView>
            )}
      </ThemedView>

      {nearestCategoryStores.length > 0 ? (
        <ThemedView style={styles.storeLegend}>
          {nearestCategoryStores.map((store) => (
            <ThemedView
              key={store.id}
              style={[
                styles.storeLegendBubble,
                {
                  backgroundColor: categorySoftColors[store.place] ?? '#F0F4F8',
                  borderColor: categoryColors[store.place] ?? '#536579',
                },
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
                  {store.name} · {store.distanceMiles.toFixed(1)} mi
                </ThemedText>
                <ThemedText
                  style={[
                    styles.storeLegendCount,
                    { color: categoryColors[store.place] ?? '#536579' },
                  ]}>
                  {store.taskCount} {store.taskCount === 1 ? 'item' : 'items'}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      ) : null}
    </Pressable>
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
    height: 118,
    overflow: 'hidden',
  },
  road: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8E6D2',
    borderWidth: 1,
    height: 18,
    opacity: 0.9,
    position: 'absolute',
    width: 190,
  },
  roadOne: {
    left: -20,
    top: 28,
    transform: [{ rotate: '-18deg' }],
  },
  roadTwo: {
    right: -30,
    top: 70,
    transform: [{ rotate: '21deg' }],
  },
  roadThree: {
    left: 70,
    top: 48,
    transform: [{ rotate: '88deg' }],
  },
  currentLocation: {
    backgroundColor: '#17231C',
    borderColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 3,
    height: 16,
    left: '48%',
    position: 'absolute',
    top: '50%',
    width: 16,
  },
  pin: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 3,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    width: 32,
  },
  pinText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  emptyPin: {
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
