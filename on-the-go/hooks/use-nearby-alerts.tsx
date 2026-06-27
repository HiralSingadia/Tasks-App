import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { usePathname } from 'expo-router';

import {
  ensureNearbyAlertNotificationChannel,
  ensureNearbyAlertNotificationPermission,
  isNearbyBackgroundAlertsEnabled,
  nearbyAlertLocationTaskName,
  runNearbyAlertCheck,
  setNearbyBackgroundAlertsEnabled,
} from '@/services/nearby-alert-service';
import { useTasks } from '@/hooks/use-tasks';

type NearbyAlertsContextValue = {
  alertStatus: string;
  backgroundAlertsEnabled: boolean;
  isUpdatingAlerts: boolean;
  toggleBackgroundAlerts: () => Promise<void>;
};

const NearbyAlertsContext = createContext<NearbyAlertsContextValue | null>(null);
const foregroundDistanceIntervalMeters = 250;
const foregroundTimeIntervalMs = 2 * 60 * 1000;
const backgroundDistanceIntervalMeters = 250;
const backgroundDeferredIntervalMs = 10 * 60 * 1000;

async function hasForegroundLocationPermission() {
  const permission = await Location.getForegroundPermissionsAsync();

  return permission.status === 'granted';
}

export function NearbyAlertsProvider({ children }: PropsWithChildren) {
  const { activeTasks } = useTasks();
  const pathname = usePathname();
  const [alertStatus, setAlertStatus] = useState('');
  const [backgroundAlertsEnabled, setBackgroundAlertsEnabled] = useState(false);
  const [isUpdatingAlerts, setIsUpdatingAlerts] = useState(false);
  const activeTaskKey = useMemo(
    () => activeTasks.map((task) => `${task.id}:${task.title}:${task.place}`).join('|'),
    [activeTasks]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadAlertState() {
      const isEnabled = await isNearbyBackgroundAlertsEnabled();

      if (isMounted) {
        setBackgroundAlertsEnabled(isEnabled);
      }
    }

    void ensureNearbyAlertNotificationChannel();
    void loadAlertState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    async function startForegroundAlerts() {
      if (activeTasks.length === 0 || !(await hasForegroundLocationPermission())) {
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: foregroundDistanceIntervalMeters,
          timeInterval: foregroundTimeIntervalMs,
        },
        (location) => {
          void runNearbyAlertCheck(
            activeTasks,
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            {
              canNotify: pathname !== '/nearby',
              source: 'foreground',
            }
          ).then((result) => {
            if (isMounted) {
              setAlertStatus(result.reason);
            }
          });
        }
      );
    }

    void startForegroundAlerts();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [activeTaskKey, activeTasks, pathname]);

  const toggleBackgroundAlerts = async () => {
    setIsUpdatingAlerts(true);

    try {
      if (backgroundAlertsEnabled) {
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(
          nearbyAlertLocationTaskName
        );

        if (hasStarted) {
          await Location.stopLocationUpdatesAsync(nearbyAlertLocationTaskName);
        }

        await setNearbyBackgroundAlertsEnabled(false);
        setBackgroundAlertsEnabled(false);
        setAlertStatus('Nearby alerts are off.');
        return;
      }

      const foregroundPermission = await Location.requestForegroundPermissionsAsync();

      if (foregroundPermission.status !== 'granted') {
        setAlertStatus('Location permission is needed for nearby alerts.');
        return;
      }

      if (Constants.appOwnership === 'expo') {
        setAlertStatus('Background alerts need a development build. Foreground alerts still work while the app is open.');
        return;
      }

      const backgroundPermission = await Location.requestBackgroundPermissionsAsync();

      if (backgroundPermission.status !== 'granted') {
        setAlertStatus('Background location permission is needed for alerts outside the app.');
        return;
      }

      const canNotify = await ensureNearbyAlertNotificationPermission();

      if (!canNotify) {
        setAlertStatus('Notification permission is needed for nearby alerts.');
        return;
      }

      await Location.startLocationUpdatesAsync(nearbyAlertLocationTaskName, {
        accuracy: Location.Accuracy.Balanced,
        activityType: Location.ActivityType.Other,
        deferredUpdatesDistance: backgroundDistanceIntervalMeters,
        deferredUpdatesInterval: backgroundDeferredIntervalMs,
        distanceInterval: backgroundDistanceIntervalMeters,
        foregroundService: {
          notificationBody: 'Watching for nearby stores that match your active tasks.',
          notificationTitle: 'On the Go nearby alerts',
        },
        pausesUpdatesAutomatically: true,
        showsBackgroundLocationIndicator: false,
      });
      await setNearbyBackgroundAlertsEnabled(true);
      setBackgroundAlertsEnabled(true);
      setAlertStatus('Nearby alerts are on.');
    } catch (error) {
      setAlertStatus(error instanceof Error ? error.message : 'Unable to update nearby alerts.');
    } finally {
      setIsUpdatingAlerts(false);
    }
  };

  const value = {
    alertStatus,
    backgroundAlertsEnabled,
    isUpdatingAlerts,
    toggleBackgroundAlerts,
  };

  return <NearbyAlertsContext.Provider value={value}>{children}</NearbyAlertsContext.Provider>;
}

export function useNearbyAlerts() {
  const context = useContext(NearbyAlertsContext);

  if (!context) {
    throw new Error('useNearbyAlerts must be used within NearbyAlertsProvider');
  }

  return context;
}
