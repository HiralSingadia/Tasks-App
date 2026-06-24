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
  loadNearbyStores: (activeTasks?: Task[], options?: LoadNearbyStoresOptions) => Promise<void>;
  nearbyStores: NearbyStore[];
  selectedStore: NearbyStore | null;
  selectedStoreId: string | null;
  setSelectedStoreId: (storeId: string) => void;
  status: string;
};

type LoadNearbyStoresOptions = {
  searchFurther?: boolean;
};

const NearbyStoresContext = createContext<NearbyStoresContextValue | null>(null);
const nearbySearchRadiusMiles = 0.5;
const nearbySearchRadiusMeters = 805;
const expandedSearchRadiusMiles = 1.5;
const expandedSearchRadiusMeters = 2414;
const maxStoresPerCategory = 5;

const storeTypeMatches = [
  { place: 'Grocery store', types: ['grocery_store', 'supermarket'] },
  { place: 'Pharmacy', types: ['pharmacy', 'drugstore'] },
  { place: 'UPS Store', types: ['courier_service', 'post_office', 'shipping_service'] },
  { place: 'Pet store', types: ['pet_store'] },
  { place: 'Gas station', types: ['gas_station'] },
  { place: 'Cafe or convenience store', types: ['cafe', 'convenience_store'] },
];

function matchStorePlace(types: string[]) {
  const matchedStoreType = storeTypeMatches.find((storeTypeMatch) =>
    storeTypeMatch.types.some((type) => types.includes(type))
  );

  return matchedStoreType?.place ?? 'Grocery store';
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

function mergeStores(stores: NearbyStore[], searchRadiusMiles: number) {
  return Array.from(new Map(stores.map((store) => [store.id, store])).values())
    .filter((store) => store.distanceMiles <= searchRadiusMiles)
    .sort((firstStore, secondStore) => firstStore.distanceMiles - secondStore.distanceMiles);
}

function prioritizeStoresForActivePlaces(stores: NearbyStore[], activePlaces: string[]) {
  const nearestStoreByActivePlace = activePlaces
    .map((place) => stores.find((store) => store.place === place))
    .filter((store): store is NearbyStore => Boolean(store));
  const prioritizedStoreIds = new Set(nearestStoreByActivePlace.map((store) => store.id));
  const additionalMatchingStores = stores.filter(
    (store) => activePlaces.includes(store.place) && !prioritizedStoreIds.has(store.id)
  );

  return [...nearestStoreByActivePlace, ...additionalMatchingStores];
}

function limitStoresPerCategory(stores: NearbyStore[]) {
  const storeCountByCategory = new Map<string, number>();

  return stores.filter((store) => {
    const currentCount = storeCountByCategory.get(store.place) ?? 0;

    if (currentCount >= maxStoresPerCategory) {
      return false;
    }

    storeCountByCategory.set(store.place, currentCount + 1);
    return true;
  });
}

function getMissingPetStoreFallbackPlaces(stores: NearbyStore[], activePlaces: string[]) {
  const needsPetStoreFallback =
    activePlaces.includes('Pet store') && !stores.some((store) => store.place === 'Pet store');

  return needsPetStoreFallback ? ['Pet store'] : [];
}

async function fetchNearbyStores(
  latitude: number,
  longitude: number,
  searchRadiusMeters: number,
  includedTypes: string[] = storeTypeMatches.flatMap((storeTypeMatch) => storeTypeMatch.types),
  placeOverride?: string
) {
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
      includedTypes,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude,
            longitude,
          },
          radius: searchRadiusMeters,
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
    .map((place, index) =>
      mapGooglePlaceToNearbyStore(place, index, latitude, longitude, placeOverride)
    )
    .sort((firstStore, secondStore) => firstStore.distanceMiles - secondStore.distanceMiles);
}

async function fetchNearbyStoresForPlace(
  latitude: number,
  longitude: number,
  searchRadiusMeters: number,
  place: string
) {
  const storeTypeMatch = storeTypeMatches.find((match) => match.place === place);

  if (!storeTypeMatch) {
    return [];
  }

  return fetchNearbyStores(latitude, longitude, searchRadiusMeters, storeTypeMatch.types, place);
}

async function fetchTextSearchStores(
  latitude: number,
  longitude: number,
  searchRadiusMeters: number,
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
          radius: searchRadiusMeters,
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
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedStore = useMemo(
    () => nearbyStores.find((store) => store.id === selectedStoreId) ?? nearbyStores[0] ?? null,
    [nearbyStores, selectedStoreId]
  );

  const loadNearbyStores = async (
    activeTasks: Task[] = [],
    options: LoadNearbyStoresOptions = {}
  ) => {
    const searchRadiusMiles = options.searchFurther
      ? expandedSearchRadiusMiles
      : nearbySearchRadiusMiles;
    const searchRadiusMeters = options.searchFurther
      ? expandedSearchRadiusMeters
      : nearbySearchRadiusMeters;

    setIsLoading(true);
    setStatus(options.searchFurther ? 'Searching a little farther...' : 'Checking your location...');

    try {
      const locationPermission = await Location.requestForegroundPermissionsAsync();

      if (locationPermission.status !== 'granted') {
        setStatus('Location permission was denied.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const activePlaces = storeTypeMatches
        .map((storeTypeMatch) => storeTypeMatch.place)
        .filter((place) => activeTasks.some((task) => taskMatchesPlace(task, place)));
      const hasShippingTask = activeTasks.some((task) => taskMatchesPlace(task, 'UPS Store'));
      const nearbySearchStores = await fetchNearbyStores(
        location.coords.latitude,
        location.coords.longitude,
        searchRadiusMeters
      );
      const activeCategoryStores = (
        await Promise.all(
          activePlaces.map((place) =>
            fetchNearbyStoresForPlace(
              location.coords.latitude,
              location.coords.longitude,
              searchRadiusMeters,
              place
            )
          )
        )
      ).flat();
      const shippingStores = hasShippingTask
        ? await fetchTextSearchStores(
            location.coords.latitude,
            location.coords.longitude,
            searchRadiusMeters,
            'The UPS Store',
            'UPS Store'
          )
        : [];
      const initialStores = mergeStores(
        [
          ...nearbySearchStores,
          ...activeCategoryStores,
          ...shippingStores,
        ],
        searchRadiusMiles
      );
      const fallbackPetStores = (
        await Promise.all(
          getMissingPetStoreFallbackPlaces(initialStores, activePlaces).map((place) =>
            fetchTextSearchStores(
              location.coords.latitude,
              location.coords.longitude,
              searchRadiusMeters,
              'pet store',
              place
            )
          )
        )
      ).flat();
      const stores = mergeStores(
        [
          ...nearbySearchStores,
          ...activeCategoryStores,
          ...shippingStores,
          ...fallbackPetStores,
        ],
        searchRadiusMiles
      );

      if (stores.length === 0) {
        setNearbyStores([]);
        setSelectedStoreId(null);
        setStatus(`No matching stores found within ${searchRadiusMiles.toFixed(1)} miles.`);
        return;
      }

      const storesToShow = limitStoresPerCategory(
        activePlaces.length > 0 ? prioritizeStoresForActivePlaces(stores, activePlaces) : stores
      );

      if (storesToShow.length === 0) {
        setNearbyStores([]);
        setSelectedStoreId(null);
        setStatus(`No matching stores found within ${searchRadiusMiles.toFixed(1)} miles.`);
        return;
      }

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
