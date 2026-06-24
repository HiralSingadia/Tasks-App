import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { Task } from '@/types/task';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('opportunities', {
      name: 'Nearby opportunities',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existingPermission = await Notifications.getPermissionsAsync();

  if (existingPermission.status === 'granted') {
    return true;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();

  return requestedPermission.status === 'granted';
}

export function useOpportunityNotifications() {
  const sendOpportunityNotification = async ({
    distanceMinutes,
    storeName,
    suggestedTasks,
  }: {
    distanceMinutes: number;
    storeName: string;
    suggestedTasks: Task[];
  }) => {
    const canNotify = await requestNotificationPermission();

    if (!canNotify) {
      return;
    }

    const opportunityTasks =
      suggestedTasks.length > 0
        ? suggestedTasks.map((task) => task.title.toLowerCase()).join(', ')
        : 'a pharmacy errand';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nearby opportunity',
        body: `You are ${distanceMinutes} minutes from ${storeName}. You can finish ${opportunityTasks} there.`,
      },
      trigger: null,
    });
  };

  return { sendOpportunityNotification };
}
