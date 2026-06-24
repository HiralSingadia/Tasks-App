import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';
import * as Location from 'expo-location';

import { taskMatchesPlace } from '@/constants/task-matching';
import type { NearbyStore } from '@/types/nearby-store';
import type { Task } from '@/types/task';

type GooglePlace = {
  id?: string;
  displayName?: {
    text?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
  types?: string[];
};

type NearbyStoresContextValue = {
  isLoading: boolean;
  loadNearbyStores: (activeTasks?: Task[]) => Promise<void>;
  nearbyStores: NearbyStore[];
  selectedStore: NearbyStore;
  selectedStoreId: string;
  setSelectedStoreId: (storeId: string) => void;
  status: string;
};

const NearbyStoresContext = createContext<NearbyStoresContextValue | null>(null);
const nearbySearchRadiusMeters = 1200;
const shippingSearchRadiusMeters = 8000;

const demoNearbyStores: NearbyStore[] = [
  {
    distanceMiles: 0.4,
    driveMinutes: 2,
    id: 'demo-cvs',
    name: 'CVS',
    place: 'Pharmacy',
    walkMinutes: 8,
  },
];

const storeTypeMatches = [
  { place: 'Grocery store', types: ['grocery_store', 'supermarket'] },
  { place: 'Pharmacy', types: ['pharmacy', 'drugstore'] },
  { place: 'UPS Store', types: ['courier_service', 'post_office', 'shipping_service'] },
  { place: 'Cafe or convenience store', types: ['cafe', 'convenience_store'] },
];

function matchStorePlace(types: string[]) {
  const matchedStoreType = storeTypeMatches.find((storeTypeMatch) =>
    storeTypeMatch.types.some((type) => types.includes(type))
  );

  return matchedStoreType?.place ?? 'Nearby store';
}

function getDistanceMiles(
  originLatitude: number,
  originLongitude: number,
  destinationLatitude?: number,
  destinationLongitude?: number
) {
  if (destinationLatitude === undefined || destinationLongitude === undefined) {
    return 0.5;
  }

  const earthRadiusMiles = 3958.8;
  const latitudeDelta = ((destinationLatitude - originLatitude) * Math.PI) / 180;
  const longitudeDelta = ((destinationLongitude - originLongitude) * Math.PI) / 180;
  const originLatitudeRadians = (originLatitude * Math.PI) / 180;
  const destinationLatitudeRadians = (destinationLatitude * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(originLatitudeRadians) *
      Math.cos(destinationLatitudeRadians) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function estimateTravelTimes(distanceMiles: number) {
  return {
    driveMinutes: Math.max(1, Math.round((distanceMiles / 18) * 60)),
    walkMinutes: Math.max(1, Math.round((distanceMiles / 3) * 60)),
  };
}

function mapGooglePlaceToNearbyStore(
  place: GooglePlace,
  index: number,
  latitude: number,
  longitude: number,
  placeOverride?: string
) {
  const name = place.displayName?.text ?? 'Nearby store';
  const distanceMiles = getDistanceMiles(
    latitude,
    longitude,
    place.location?.latitude,
    place.location?.longitude
  );
  const travelTimes = estimateTravelTimes(distanceMiles);

  return {
    distanceMiles,
    driveMinutes: travelTimes.driveMinutes,
    id: place.id ?? `${name}-${index}`,
    name,
    place: placeOverride ?? matchStorePlace(place.types ?? []),
    walkMinutes: travelTimes.walkMinutes,
  };
}

function mergeStores(stores: NearbyStore[]) {
  return Array.from(new Map(stores.map((store) => [store.id, store])).values()).sort(
    (firstStore, secondStore) => firstStore.distanceMiles - secondStore.distanceMiles
  );
}

async function fetchNearbyStores(latitude: number, longitude: number) {
  const placesApiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (!placesApiKey) {
    throw new Error('Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to use real nearby stores.');
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': placesApiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.types',
    },
    body: JSON.stringify({
      includedTypes: [
        'cafe',
        'convenience_store',
        'courier_service',
        'drugstore',
        'grocery_store',
        'pharmacy',
        'post_office',
        'shipping_service',
        'supermarket',
      ],
      maxResultCount: 10,
      locationRestriction: {
        circle: {
          center: {
            latitude,
            longitude,
          },
          radius: nearbySearchRadiusMeters,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Places API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { places?: GooglePlace[] };

  return (data.places ?? [])
    .map((place, index) => mapGooglePlaceToNearbyStore(place, index, latitude, longitude))
    .sort((firstStore, secondStore) => firstStore.distanceMiles - secondStore.distanceMiles);
}

async function fetchTextSearchStores(
  latitude: number,
  longitude: number,
  textQuery: string,
  placeOverride: string
) {
  const placesApiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (!placesApiKey) {
    throw new Error('Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to use real nearby stores.');
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': placesApiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.types',
    },
    body: JSON.stringify({
      textQuery,
      pageSize: 5,
      locationBias: {
        circle: {
          center: {
            latitude,
            longitude,
          },
          radius: shippingSearchRadiusMeters,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Places API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as { places?: GooglePlace[] };

  return (data.places ?? []).map((place, index) =>
    mapGooglePlaceToNearbyStore(place, index, latitude, longitude, placeOverride)
  );
}

export function NearbyStoresProvider({ children }: PropsWithChildren) {
  const [nearbyStores, setNearbyStores] = useState(demoNearbyStores);
  const [selectedStoreId, setSelectedStoreId] = useState(demoNearbyStores[0].id);
  const [status, setStatus] = useState('Using demo nearby store.');
  const [isLoading, setIsLoading] = useState(false);

  const selectedStore = useMemo(
    () => nearbyStores.find((store) => store.id === selectedStoreId) ?? nearbyStores[0],
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
      const hasShippingTask = activeTasks.some((task) => taskMatchesPlace(task, 'UPS Store'));
      const nearbySearchStores = await fetchNearbyStores(
        location.coords.latitude,
        location.coords.longitude
      );
      const shippingStores = hasShippingTask
        ? await fetchTextSearchStores(
            location.coords.latitude,
            location.coords.longitude,
            'The UPS Store',
            'UPS Store'
          )
        : [];
      const stores = mergeStores([...nearbySearchStores, ...shippingStores]);

      if (stores.length === 0) {
        setStatus('No matching stores found nearby.');
        return;
      }

      const usefulStores = stores.filter((store) =>
        activeTasks.some((task) => taskMatchesPlace(task, store.place))
      );
      const storesToShow = usefulStores.length > 0 ? usefulStores : stores;
      const closestStore = storesToShow[0];
      const completableTaskCount = activeTasks.filter((task) =>
        storesToShow.some((store) => taskMatchesPlace(task, store.place))
      ).length;
      const farthestUsefulStore = storesToShow.reduce((farthestStore, store) =>
        store.distanceMiles > farthestStore.distanceMiles ? store : farthestStore
      );
      const slowestUsefulStore = storesToShow.reduce((slowestStore, store) =>
        store.driveMinutes > slowestStore.driveMinutes ? store : slowestStore
      );

      setNearbyStores(storesToShow);
      setSelectedStoreId(closestStore.id);
      setStatus(
        `${completableTaskCount} tasks can be completed within ${farthestUsefulStore.distanceMiles.toFixed(
          1
        )} miles in about ${slowestUsefulStore.driveMinutes} min by drive.`
      );
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
