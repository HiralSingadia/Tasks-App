import { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { NearbyOpportunityCard } from '@/components/nearby-opportunity-card';
import { TaskSummary } from '@/components/task-summary';
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
    () => activeTasks.filter((task) => task.place === selectedStore.place),
    [activeTasks, selectedStore.place]
  );
  const activeTaskPlaces = useMemo(() => activeTasks.map((task) => task.place), [activeTasks]);

  const notifyOpportunity = () => {
    sendOpportunityNotification({
      distanceMinutes: selectedStore.driveMinutes,
      storeName: selectedStore.name,
      suggestedTasks,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.screen}>
      <NearbyOpportunityCard
        activeTasks={activeTasks}
        isLoadingStores={isLoading}
        nearbyStores={nearbyStores}
        onFindNearbyStores={() => loadNearbyStores(activeTaskPlaces)}
        suggestedTasks={suggestedTasks}
        selectedStore={selectedStore}
        selectedStoreId={selectedStoreId}
        status={status}
        onNotify={notifyOpportunity}
        onSelectStore={setSelectedStoreId}
      />

      <TaskSummary
        activeTaskCount={activeTasks.length}
        nearbyTaskCount={suggestedTasks.length}
        nearbyStoreName={selectedStore.name}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 12,
    flexGrow: 1,
  },
});
