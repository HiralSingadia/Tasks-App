import { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NearbyOpportunityCard } from '@/components/nearby-opportunity-card';
import { taskMatchesPlace } from '@/constants/task-matching';
import { useNearbyStores } from '@/hooks/use-nearby-stores';
import { useOpportunityNotifications } from '@/hooks/use-opportunity-notifications';
import { useTasks } from '@/hooks/use-tasks';

export default function NearbyScreen() {
  const { activeTasks } = useTasks();
  const {
    isLoading,
    loadNearbyStores,
    nearbyStores,
    selectedStore,
    selectedStoreId,
    setSelectedStoreId,
    status,
  } = useNearbyStores();
  const { sendOpportunityNotification } = useOpportunityNotifications();

  const suggestedTasks = useMemo(
    () =>
      selectedStore
        ? activeTasks.filter((task) => taskMatchesPlace(task, selectedStore.place))
        : [],
    [activeTasks, selectedStore]
  );

  const notifyOpportunity = () => {
    if (!selectedStore) {
      return;
    }

    sendOpportunityNotification({
      distanceMinutes: selectedStore.driveMinutes,
      storeName: selectedStore.name,
      suggestedTasks,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} style={styles.screen}>
        <NearbyOpportunityCard
          activeTasks={activeTasks}
          isLoadingStores={isLoading}
          nearbyStores={nearbyStores}
          onFindNearbyStores={() => loadNearbyStores(activeTasks)}
          onShowMoreNearbyStores={() => loadNearbyStores(activeTasks, { searchFurther: true })}
          suggestedTasks={suggestedTasks}
          selectedStore={selectedStore}
          selectedStoreId={selectedStoreId}
          status={status}
          onNotify={notifyOpportunity}
          onSelectStore={setSelectedStoreId}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7F2',
  },
  screen: {
    backgroundColor: '#F5F7F2',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 28,
    gap: 12,
    flexGrow: 1,
  },
});
