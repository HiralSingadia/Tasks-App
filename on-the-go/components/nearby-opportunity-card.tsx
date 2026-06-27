import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { taskMatchesPlace } from '@/constants/task-matching';
import type { NearbyStore } from '@/types/nearby-store';
import type { Task } from '@/types/task';

type NearbyOpportunityCardProps = {
  activeTasks: Task[];
  alertStatus: string;
  backgroundAlertsEnabled: boolean;
  isLoadingStores: boolean;
  isUpdatingAlerts: boolean;
  nearbyStores: NearbyStore[];
  onFindNearbyStores: () => void;
  suggestedTasks: Task[];
  selectedStore: NearbyStore | null;
  selectedStoreId: string | null;
  status: string;
  onNotify: () => void;
  onSelectStore: (storeId: string) => void;
  onToggleBackgroundAlerts: () => void;
};

const CATEGORY_SYMBOLS: Record<string, IconSymbolName> = {
  'Cafe or convenience store': 'cup.and.saucer.fill',
  'Gas station': 'fuelpump.fill',
  'Grocery store': 'cart.fill',
  'Pet store': 'pawprint.fill',
  Pharmacy: 'cross.case.fill',
  'UPS Store': 'shippingbox.fill',
};

const CATEGORY_ACCENTS = {
  'Cafe or convenience store': {
    border: '#F4D7A4',
    soft: '#FFF4DD',
    strong: '#A35D00',
  },
  'Gas station': {
    border: '#BFD7FF',
    soft: '#EAF2FF',
    strong: '#2765B5',
  },
  'Grocery store': {
    border: '#BFE5C8',
    soft: '#EAF8ED',
    strong: '#2F7D4F',
  },
  'Pet store': {
    border: '#E7C8F4',
    soft: '#F8ECFD',
    strong: '#8A4AA8',
  },
  Pharmacy: {
    border: '#F2C2CB',
    soft: '#FDECEF',
    strong: '#B5425A',
  },
  'UPS Store': {
    border: '#E5D0AA',
    soft: '#F8F0E1',
    strong: '#7A5524',
  },
} as const;

const fallbackAccent = {
  border: '#D7DEE7',
  soft: '#F0F4F8',
  strong: '#536579',
};

const getCategorySymbol = (place: string) => CATEGORY_SYMBOLS[place] ?? 'mappin.circle.fill';
const getCategoryAccent = (place: string) =>
  CATEGORY_ACCENTS[place as keyof typeof CATEGORY_ACCENTS] ?? fallbackAccent;

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
  alertStatus,
  backgroundAlertsEnabled,
  isLoadingStores,
  isUpdatingAlerts,
  nearbyStores,
  onFindNearbyStores,
  suggestedTasks,
  selectedStore,
  selectedStoreId,
  status,
  onNotify,
  onSelectStore,
  onToggleBackgroundAlerts,
}: NearbyOpportunityCardProps) {
  const hasStores = nearbyStores.length > 0;
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
      <ThemedView style={styles.cardHeader}>
        <ThemedView
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.arrowBadge}>
          <IconSymbol name="location.fill" size={18} color="#2F6B4F" />
        </ThemedView>
        <ThemedText type="subtitle" style={styles.alertTitle}>
          Nearby matches
        </ThemedText>
      </ThemedView>
      {!selectedStore ? (
        <ThemedText style={styles.emptyText}>
          Find stores that match your active errands.
        </ThemedText>
      ) : null}
      {status ? <ThemedText style={styles.statusText}>{status}</ThemedText> : null}
      {alertStatus ? <ThemedText style={styles.alertStatusText}>{alertStatus}</ThemedText> : null}

      {hasStores ? (
        <ThemedView style={styles.storeGroups}>
          {Object.entries(groupedStores).map(([place, stores]) => {
            const matchingTaskCount = activeTasks.filter((task) =>
              taskMatchesPlace(task, place)
            ).length;
            const accent = getCategoryAccent(place);

            return (
              <ThemedView
                key={place}
                style={[styles.storeGroup, { borderColor: accent.border }]}>
                <ThemedView style={styles.groupHeader}>
                  <ThemedView
                    style={[
                      styles.groupIconBadge,
                      { backgroundColor: accent.soft, borderColor: accent.border },
                    ]}>
                    <IconSymbol name={getCategorySymbol(place)} size={24} color={accent.strong} />
                  </ThemedView>
                  <ThemedView style={styles.groupTitleBlock}>
                    <ThemedText style={[styles.groupTitle, { color: accent.strong }]}>
                      {getCategoryLabel(place)}
                    </ThemedText>
                  </ThemedView>
                  <ThemedView style={[styles.groupCountBadge, { backgroundColor: accent.soft }]}>
                    <ThemedText style={[styles.groupCount, { color: accent.strong }]}>
                      {matchingTaskCount} {matchingTaskCount === 1 ? 'task' : 'tasks'}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>

                {stores.map((store) => {
                  const isSelected = selectedStoreId === store.id;

                  return (
                    <Pressable
                      key={store.id}
                      style={[
                        styles.storeRow,
                        { backgroundColor: accent.soft, borderColor: accent.border },
                        isSelected && [
                          styles.selectedStoreRow,
                          { backgroundColor: accent.strong, borderColor: accent.strong },
                        ],
                      ]}
                      onPress={() => onSelectStore(store.id)}>
                      <ThemedView style={styles.storeHeader}>
                        <ThemedText
                          style={[
                            styles.storeName,
                            { color: accent.strong },
                            isSelected && styles.selectedStoreText,
                          ]}>
                          {store.name}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.storeTime,
                            { color: accent.strong },
                            isSelected && styles.selectedStoreText,
                          ]}>
                          {store.distanceMiles.toFixed(1)} mi | {store.driveMinutes}m drive |{' '}
                          {store.walkMinutes}m walk
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </ThemedView>
            );
          })}
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
        <Pressable
          style={[
            styles.secondaryButton,
            backgroundAlertsEnabled && styles.alertsOnButton,
            isUpdatingAlerts && styles.disabledButton,
          ]}
          onPress={onToggleBackgroundAlerts}
          disabled={isUpdatingAlerts}>
          <ThemedText
            style={[
              styles.secondaryButtonText,
              backgroundAlertsEnabled && styles.alertsOnButtonText,
            ]}>
            {isUpdatingAlerts
              ? 'Updating...'
              : backgroundAlertsEnabled
                ? 'Alerts on'
                : 'Enable alerts'}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE4DB',
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    padding: 14,
    shadowColor: '#17231C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCE4DB',
  },
  alertTitle: {
    color: '#17231C',
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 25,
  },
  cardHeader: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  arrowBadge: {
    alignItems: 'center',
    backgroundColor: '#E7F1E7',
    borderColor: '#CFE0CF',
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  emptyText: {
    color: '#60706A',
    fontWeight: '700',
    lineHeight: 21,
  },
  statusText: {
    color: '#60706A',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginTop: 6,
  },
  alertStatusText: {
    color: '#60706A',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  storeGroups: {
    backgroundColor: 'transparent',
    marginTop: 12,
    gap: 12,
  },
  storeGroup: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
  },
  groupHeader: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 10,
  },
  groupIconBadge: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  groupTitleBlock: {
    backgroundColor: 'transparent',
    flex: 1,
    minWidth: 0,
  },
  groupTitle: {
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 24,
  },
  groupCountBadge: {
    alignItems: 'center',
    borderRadius: 16,
    minWidth: 70,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  groupCount: {
    fontSize: 14,
    fontWeight: '900',
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
    flexWrap: 'wrap',
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
  alertsOnButton: {
    backgroundColor: '#1F4D2B',
    borderColor: '#1F4D2B',
  },
  alertsOnButtonText: {
    color: '#FFFFFF',
  },
});
