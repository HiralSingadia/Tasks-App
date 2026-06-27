import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NearbyOpportunityCard } from '@/components/nearby-opportunity-card';
import { useNearbyAlerts } from '@/hooks/use-nearby-alerts';
import { useNearbyStores } from '@/hooks/use-nearby-stores';
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
  const {
    alertStatus,
    backgroundAlertsEnabled,
    isUpdatingAlerts,
    toggleBackgroundAlerts,
  } = useNearbyAlerts();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} style={styles.screen}>
        <NearbyOpportunityCard
          activeTasks={activeTasks}
          alertStatus={alertStatus}
          backgroundAlertsEnabled={backgroundAlertsEnabled}
          isLoadingStores={isLoading}
          isUpdatingAlerts={isUpdatingAlerts}
          nearbyStores={nearbyStores}
          onFindNearbyStores={() => loadNearbyStores(activeTasks)}
          selectedStore={selectedStore}
          selectedStoreId={selectedStoreId}
          status={status}
          onSelectStore={setSelectedStoreId}
          onToggleBackgroundAlerts={toggleBackgroundAlerts}
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
