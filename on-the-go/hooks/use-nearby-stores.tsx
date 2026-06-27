import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import * as Location from 'expo-location';

import {
  getNearbyStoresForTasks,
  getNearbyStoresSummary,
} from '@/services/nearby-store-service';
import type { NearbyStore } from '@/types/nearby-store';
import type { Task } from '@/types/task';

type NearbyStoresContextValue = {
  isLoading: boolean;
  loadNearbyStores: (activeTasks?: Task[]) => Promise<void>;
  nearbyStores: NearbyStore[];
  selectedStore: NearbyStore | null;
  selectedStoreId: string | null;
  setSelectedStoreId: (storeId: string) => void;
  status: string;
};

const NearbyStoresContext = createContext<NearbyStoresContextValue | null>(null);

export function NearbyStoresProvider({ children }: PropsWithChildren) {
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedStore = useMemo(
    () => nearbyStores.find((store) => store.id === selectedStoreId) ?? nearbyStores[0] ?? null,
    [nearbyStores, selectedStoreId]
  );

  const loadNearbyStores = async (activeTasks: Task[] = []) => {
    setIsLoading(true);
    setStatus('Checking your location...');

    try {
      const locationPermission = await Location.requestForegroundPermissionsAsync();

      if (locationPermission.status !== 'granted') {
        setStatus('Location permission was denied.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const stores = await getNearbyStoresForTasks({
        activeTasks,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (stores.length === 0) {
        setNearbyStores([]);
        setSelectedStoreId(null);
        setStatus(getNearbyStoresSummary(activeTasks, stores));
        return;
      }

      setNearbyStores(stores);
      setSelectedStoreId(stores[0].id);
      setStatus(getNearbyStoresSummary(activeTasks, stores));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to find nearby stores.');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isLoading,
    loadNearbyStores,
    nearbyStores,
    selectedStore,
    selectedStoreId,
    setSelectedStoreId,
    status,
  };

  return <NearbyStoresContext.Provider value={value}>{children}</NearbyStoresContext.Provider>;
}

export function useNearbyStores() {
  const context = useContext(NearbyStoresContext);

  if (!context) {
    throw new Error('useNearbyStores must be used within NearbyStoresProvider');
  }

  return context;
}
