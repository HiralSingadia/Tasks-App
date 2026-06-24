import { useMemo, useState } from 'react';
import * as Location from 'expo-location';

import type { NearbyStore } from '@/types/nearby-store';

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

const demoNearbyStores: NearbyStore[] = [
  {
    distanceMiles: 0.4,
    driveMinutes: 2,
    id: 'demo-cvs',
    name: 'CVS',
    place: 'Pharmacy or Target',
    walkMinutes: 8,
  },
];

const storeTypeMatches = [
  { place: 'Grocery store', types: ['grocery_store', 'supermarket'] },
  { place: 'Pharmacy or Target', types: ['pharmacy', 'drugstore', 'department_store'] },
  { place: 'UPS Store', types: ['post_office'] },
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
        'department_store',
        'drugstore',
        'grocery_store',
        'pharmacy',
        'post_office',
        'supermarket',
      ],
      maxResultCount: 10,
      locationRestriction: {
        circle: {
          center: {
            latitude,
            longitude,
          },
          radius: 1200,
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
    .map((place, index) => {
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
        place: matchStorePlace(place.types ?? []),
        walkMinutes: travelTimes.walkMinutes,
      };
    })
    .sort((firstStore, secondStore) => firstStore.distanceMiles - secondStore.distanceMiles);
}

export function useNearbyStores() {
  const [nearbyStores, setNearbyStores] = useState(demoNearbyStores);
  const [selectedStoreId, setSelectedStoreId] = useState(demoNearbyStores[0].id);
  const [status, setStatus] = useState('Using demo nearby store.');
  const [isLoading, setIsLoading] = useState(false);

  const selectedStore = useMemo(
    () => nearbyStores.find((store) => store.id === selectedStoreId) ?? nearbyStores[0],
    [nearbyStores, selectedStoreId]
  );

  const loadNearbyStores = async (activeTaskPlaces: string[] = []) => {
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
      const stores = await fetchNearbyStores(location.coords.latitude, location.coords.longitude);

      if (stores.length === 0) {
        setStatus('No matching stores found nearby.');
        return;
      }

      const usefulStores = stores.filter((store) => activeTaskPlaces.includes(store.place));
      const storesToShow = usefulStores.length > 0 ? usefulStores : stores;
      const closestStore = storesToShow[0];
      const completableTaskCount = activeTaskPlaces.filter((place) =>
        storesToShow.some((store) => store.place === place)
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

  return {
    isLoading,
    loadNearbyStores,
    nearbyStores,
    selectedStore,
    selectedStoreId,
    setSelectedStoreId,
    status,
  };
}
