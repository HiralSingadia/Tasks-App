import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { normalizeTaskPlaces } from '@/constants/task-matching';
import { tasksStorageKey } from '@/hooks/use-tasks';
import {
  getActivePlaces,
  getDistanceMiles,
  getNearestStorePerActiveCategory,
  getNearbyStoresForTasks,
  nearbySearchRadiusMiles,
} from '@/services/nearby-store-service';
import type { NearbyStore } from '@/types/nearby-store';
import type { Task } from '@/types/task';

export const nearbyAlertLocationTaskName = 'on-the-go.nearby-alert-location';

const alertStateStorageKey = 'on-the-go.nearby-alert-state.v1';
const alertCacheStorageKey = 'on-the-go.nearby-alert-cache.v1';
const alertEnabledStorageKey = 'on-the-go.nearby-alerts.enabled.v1';
const alertCacheTtlMs = 20 * 60 * 1000;
const alertCooldownMs = 3 * 60 * 60 * 1000;
const minLookupMoveMiles = 0.25;
const locationBucketPrecision = 3;

type StoredLocation = {
  latitude: number;
  longitude: number;
};

type AlertState = {
  lastLookupAt?: number;
  lastLookupLocation?: StoredLocation;
  lastNotifiedByCategory?: Record<string, { at: number; storeId: string }>;
};

type AlertCache = {
  activeCategoryKey: string;
  fetchedAt: number;
  locationBucket: string;
  stores: NearbyStore[];
};

type NearbyAlertCheckOptions = {
  canNotify?: boolean;
  source: 'background' | 'foreground';
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isTaskArray(value: unknown): value is Task[] {
  return (
    Array.isArray(value) &&
    value.every(
      (task) =>
        task &&
        typeof task === 'object' &&
        typeof (task as Task).id === 'string' &&
        typeof (task as Task).title === 'string' &&
        typeof (task as Task).place === 'string' &&
        typeof (task as Task).completed === 'boolean'
    )
  );
}

async function getStoredActiveTasks() {
  const storedTasks = await AsyncStorage.getItem(tasksStorageKey);

  if (!storedTasks) {
    return [];
  }

  const parsedTasks: unknown = JSON.parse(storedTasks);

  if (!isTaskArray(parsedTasks)) {
    return [];
  }

  return parsedTasks.filter((task) => !task.completed).map(normalizeTaskPlaces);
}

async function getStoredJson<T>(key: string, fallback: T) {
  const storedValue = await AsyncStorage.getItem(key);

  if (!storedValue) {
    return fallback;
  }

  try {
    return JSON.parse(storedValue) as T;
  } catch {
    return fallback;
  }
}

function getActiveCategoryKey(activeTasks: Task[]) {
  return getActivePlaces(activeTasks).sort().join('|');
}

function getLocationBucket(location: StoredLocation) {
  return `${location.latitude.toFixed(locationBucketPrecision)},${location.longitude.toFixed(
    locationBucketPrecision
  )}`;
}

function shouldRunLookup(alertState: AlertState, location: StoredLocation, now: number) {
  if (!alertState.lastLookupAt || !alertState.lastLookupLocation) {
    return true;
  }

  const movedMiles = getDistanceMiles(
    alertState.lastLookupLocation.latitude,
    alertState.lastLookupLocation.longitude,
    location.latitude,
    location.longitude
  );
  const cacheExpired = now - alertState.lastLookupAt > alertCacheTtlMs;

  return cacheExpired || movedMiles >= minLookupMoveMiles;
}

async function getCachedStores({
  activeCategoryKey,
  location,
  now,
}: {
  activeCategoryKey: string;
  location: StoredLocation;
  now: number;
}) {
  const cache = await getStoredJson<AlertCache | null>(alertCacheStorageKey, null);

  if (!cache) {
    return null;
  }

  const cacheMatches =
    cache.activeCategoryKey === activeCategoryKey &&
    cache.locationBucket === getLocationBucket(location) &&
    now - cache.fetchedAt <= alertCacheTtlMs;

  return cacheMatches ? cache.stores : null;
}

async function setCachedStores({
  activeCategoryKey,
  location,
  now,
  stores,
}: {
  activeCategoryKey: string;
  location: StoredLocation;
  now: number;
  stores: NearbyStore[];
}) {
  const cache: AlertCache = {
    activeCategoryKey,
    fetchedAt: now,
    locationBucket: getLocationBucket(location),
    stores,
  };

  await AsyncStorage.setItem(alertCacheStorageKey, JSON.stringify(cache));
}

export async function ensureNearbyAlertNotificationPermission() {
  const existingPermission = await Notifications.getPermissionsAsync();

  if (existingPermission.status === 'granted') {
    return true;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();

  return requestedPermission.status === 'granted';
}

export async function ensureNearbyAlertNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('nearby-alerts', {
    name: 'Nearby alerts',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function getNotificationCandidates({
  alertState,
  nearestStores,
  now,
}: {
  alertState: AlertState;
  nearestStores: NearbyStore[];
  now: number;
}) {
  const lastNotifiedByCategory = alertState.lastNotifiedByCategory ?? {};

  return nearestStores.filter((store) => {
    const lastNotification = lastNotifiedByCategory[store.place];

    if (!lastNotification) {
      return true;
    }

    const isSameStore = lastNotification.storeId === store.id;
    const isCoolingDown = now - lastNotification.at < alertCooldownMs;

    return !(isSameStore && isCoolingDown);
  });
}

function getNotificationCopy(stores: NearbyStore[]) {
  if (stores.length === 1) {
    const store = stores[0];

    return {
      body: `${store.name} is ${store.distanceMiles.toFixed(1)} mi away.`,
      title: `${store.place} nearby`,
    };
  }

  const categories = stores.map((store) => store.place.replace(' store', '')).join(', ');
  const nearestStore = stores[0];

  return {
    body: `${stores.length} categories nearby. Nearest: ${nearestStore.name}, ${nearestStore.distanceMiles.toFixed(
      1
    )} mi.`,
    title: `Nearby: ${categories}`,
  };
}

async function sendNearbyAlert(stores: NearbyStore[]) {
  const canNotify = await ensureNearbyAlertNotificationPermission();

  if (!canNotify) {
    return false;
  }

  await ensureNearbyAlertNotificationChannel();

  const notificationCopy = getNotificationCopy(stores);

  await Notifications.scheduleNotificationAsync({
    content: {
      body: notificationCopy.body,
      data: { source: 'nearby-alerts' },
      title: notificationCopy.title,
    },
    trigger: null,
  });

  return true;
}

async function saveNotificationHistory(
  alertState: AlertState,
  notifiedStores: NearbyStore[],
  now: number
) {
  const lastNotifiedByCategory = {
    ...(alertState.lastNotifiedByCategory ?? {}),
  };

  notifiedStores.forEach((store) => {
    lastNotifiedByCategory[store.place] = {
      at: now,
      storeId: store.id,
    };
  });

  await AsyncStorage.setItem(
    alertStateStorageKey,
    JSON.stringify({
      ...alertState,
      lastNotifiedByCategory,
    })
  );
}

export async function runNearbyAlertCheck(
  activeTasks: Task[],
  location: StoredLocation,
  options: NearbyAlertCheckOptions
) {
  if (activeTasks.length === 0) {
    return { notified: false, reason: 'No active tasks.' };
  }

  const activeCategoryKey = getActiveCategoryKey(activeTasks);

  if (!activeCategoryKey) {
    return { notified: false, reason: 'No active categories.' };
  }

  const now = Date.now();
  const alertState = await getStoredJson<AlertState>(alertStateStorageKey, {});
  let stores = await getCachedStores({ activeCategoryKey, location, now });

  if (!stores && shouldRunLookup(alertState, location, now)) {
    stores = await getNearbyStoresForTasks({
      activeTasks,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    await setCachedStores({ activeCategoryKey, location, now, stores });
    await AsyncStorage.setItem(
      alertStateStorageKey,
      JSON.stringify({
        ...alertState,
        lastLookupAt: now,
        lastLookupLocation: location,
      })
    );
  }

  if (!stores?.length) {
    return { notified: false, reason: 'No stores nearby.' };
  }

  const nearestStores = getNearestStorePerActiveCategory(stores, activeTasks).filter(
    (store) => store.distanceMiles <= nearbySearchRadiusMiles
  );

  if (nearestStores.length === 0) {
    return { notified: false, reason: 'No nearest category stores nearby.' };
  }

  const notificationCandidates = getNotificationCandidates({
    alertState,
    nearestStores,
    now,
  });

  if (notificationCandidates.length === 0) {
    return { notified: false, reason: 'Notification cooldown active.' };
  }

  if (options.canNotify === false) {
    return { notified: false, reason: `Notification skipped in ${options.source}.` };
  }

  const didNotify = await sendNearbyAlert(notificationCandidates);

  if (didNotify) {
    await saveNotificationHistory(alertState, notificationCandidates, now);
  }

  return {
    notified: didNotify,
    reason: didNotify ? 'Notification sent.' : 'Notification permission denied.',
  };
}

export async function isNearbyBackgroundAlertsEnabled() {
  return (await AsyncStorage.getItem(alertEnabledStorageKey)) === 'true';
}

export async function setNearbyBackgroundAlertsEnabled(enabled: boolean) {
  await AsyncStorage.setItem(alertEnabledStorageKey, enabled ? 'true' : 'false');
}

TaskManager.defineTask(nearbyAlertLocationTaskName, async ({ data, error }) => {
  if (error) {
    console.warn('Nearby alert background task failed.', error);
    return;
  }

  const isEnabled = await isNearbyBackgroundAlertsEnabled();

  if (!isEnabled) {
    return;
  }

  const locationData = data as { locations?: Location.LocationObject[] };
  const location = locationData.locations?.[0];

  if (!location) {
    return;
  }

  try {
    const activeTasks = await getStoredActiveTasks();

    await runNearbyAlertCheck(
      activeTasks,
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      { source: 'background' }
    );
  } catch (backgroundError) {
    console.warn('Unable to run nearby background alert check.', backgroundError);
  }
});
