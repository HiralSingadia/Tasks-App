import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { taskMatchesPlace } from '@/constants/task-matching';
import type { NearbyStore } from '@/types/nearby-store';
import type { Task } from '@/types/task';

type NearbyOpportunityCardProps = {
  activeTasks: Task[];
  isLoadingStores: boolean;
  nearbyStores: NearbyStore[];
  onFindNearbyStores: () => void;
  suggestedTasks: Task[];
  selectedStore: NearbyStore | null;
  selectedStoreId: string | null;
  status: string;
  onNotify: () => void;
  onSelectStore: (storeId: string) => void;
};

function getCategoryLabel(place: string) {
  if (place === 'Grocery store') {
    return 'Groceries';
  }

  if (place === 'Pharmacy') {
    return 'Pharmacy';
  }

  if (place === 'UPS Store') {
    return 'UPS';
  }

  if (place === 'Pet store') {
    return 'Pet';
  }

  if (place === 'Gas station') {
    return 'Gas';
  }

  if (place === 'Cafe or convenience store') {
    return 'Cafe';
  }

  return place;
}

export function NearbyOpportunityCard({
  activeTasks,
  isLoadingStores,
  nearbyStores,
  onFindNearbyStores,
  suggestedTasks,
  selectedStore,
  selectedStoreId,
  status,
  onNotify,
  onSelectStore,
}: NearbyOpportunityCardProps) {
  const hasStores = nearbyStores.length > 0;
  const taskText =
    suggestedTasks.length > 0
      ? suggestedTasks.map((task) => task.title.toLowerCase()).join(', ')
      : 'an errand';
  const groupedStores = nearbyStores.reduce<Record<string, NearbyStore[]>>((groups, store) => {
    const hasMatchingTasks = activeTasks.some((task) => taskMatchesPlace(task, store.place));

    if (!hasMatchingTasks) {
      return groups;
    }

    const currentGroup = groups[store.place] ?? [];

    return {
      ...groups,
      [store.place]: [...currentGroup, store],
    };
  }, {});

  return (
    <ThemedView style={[styles.alertCard, !hasStores && styles.emptyCard]}>
      <ThemedText type="subtitle" style={styles.alertTitle}>
        Nearby opportunity
      </ThemedText>
      {selectedStore ? (
        <ThemedText style={styles.alertText}>
          {selectedStore.name} is {selectedStore.distanceMiles.toFixed(1)} miles away:{' '}
          {selectedStore.driveMinutes} min by drive or {selectedStore.walkMinutes} min by walk. You
          can finish {taskText} there.
        </ThemedText>
      ) : (
        <ThemedText style={styles.emptyText}>
          Find stores that match your active errands.
        </ThemedText>
      )}
      {status ? <ThemedText style={styles.statusText}>{status}</ThemedText> : null}

      {hasStores ? (
        <ThemedView style={styles.storeGroups}>
          {Object.entries(groupedStores).map(([place, stores]) => (
            <ThemedView key={place} style={styles.storeGroup}>
              <ThemedText style={styles.groupTitle}>{getCategoryLabel(place)}</ThemedText>
              <ThemedText style={styles.groupItems}>
                {activeTasks.filter((task) => taskMatchesPlace(task, place)).length} items:{' '}
                {activeTasks
                  .filter((task) => taskMatchesPlace(task, place))
                  .map((task) => task.title)
                  .join(', ')}
              </ThemedText>

              {stores.map((store) => {
                const isSelected = selectedStoreId === store.id;

                return (
                  <Pressable
                    key={store.id}
                    style={[styles.storeRow, isSelected && styles.selectedStoreRow]}
                    onPress={() => onSelectStore(store.id)}>
                    <ThemedView style={styles.storeHeader}>
                      <ThemedText
                        style={[styles.storeName, isSelected && styles.selectedStoreText]}>
                        {store.name}
                      </ThemedText>
                      <ThemedText
                        style={[styles.storeTime, isSelected && styles.selectedStoreText]}>
                        {store.distanceMiles.toFixed(1)} mi | {store.driveMinutes}m drive |{' '}
                        {store.walkMinutes}m walk
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </ThemedView>
          ))}
        </ThemedView>
      ) : null}

      <ThemedView style={styles.actionRow}>
        <Pressable
          style={[styles.notifyButton, isLoadingStores && styles.disabledButton]}
          onPress={onFindNearbyStores}
          disabled={isLoadingStores}>
          <ThemedText style={styles.notifyButtonText}>
            {isLoadingStores ? 'Finding...' : 'Find nearby stores'}
          </ThemedText>
        </Pressable>
        {selectedStore ? (
          <Pressable style={styles.secondaryButton} onPress={onNotify}>
            <ThemedText style={styles.secondaryButtonText}>Notify</ThemedText>
          </Pressable>
        ) : null}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    backgroundColor: '#DFF5E1',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7D8AE',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E3E8DE',
  },
  alertTitle: {
    color: '#1F4D2B',
    marginBottom: 6,
  },
  emptyText: {
    color: '#5C6670',
    lineHeight: 21,
  },
  alertText: {
    color: '#315C3A',
    lineHeight: 21,
  },
  statusText: {
    color: '#315C3A',
    fontSize: 13,
    marginTop: 8,
    opacity: 0.85,
  },
  storeGroups: {
    backgroundColor: 'transparent',
    marginTop: 12,
    gap: 10,
  },
  storeGroup: {
    backgroundColor: 'transparent',
    gap: 6,
  },
  groupTitle: {
    color: '#1F4D2B',
    fontSize: 13,
    fontWeight: '800',
  },
  groupItems: {
    color: '#315C3A',
    fontSize: 13,
    marginBottom: 2,
  },
  storeRow: {
    backgroundColor: '#F2FAF3',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7D8AE',
    padding: 10,
  },
  selectedStoreRow: {
    backgroundColor: '#1F4D2B',
    borderColor: '#1F4D2B',
  },
  storeHeader: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  storeName: {
    color: '#315C3A',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  storeTime: {
    color: '#315C3A',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedStoreText: {
    color: '#FFFFFF',
  },
  actionRow: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  notifyButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1F4D2B',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  disabledButton: {
    opacity: 0.7,
  },
  notifyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1F4D2B',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  secondaryButtonText: {
    color: '#1F4D2B',
    fontWeight: '700',
  },
});
