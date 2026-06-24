import { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

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
    () => activeTasks.filter((task) => taskMatchesPlace(task, selectedStore.place)),
    [activeTasks, selectedStore.place]
  );

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
        onFindNearbyStores={() => loadNearbyStores(activeTasks)}
        suggestedTasks={suggestedTasks}
        selectedStore={selectedStore}
        selectedStoreId={selectedStoreId}
        status={status}
        onNotify={notifyOpportunity}
        onSelectStore={setSelectedStoreId}
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
