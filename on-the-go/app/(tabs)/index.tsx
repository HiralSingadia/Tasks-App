import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NearbyMapSnapshot } from '@/components/nearby-map-snapshot';
import { TaskInput } from '@/components/task-input';
import { TaskList } from '@/components/task-list';
import { ThemedText } from '@/components/themed-text';
import { useNearbyStores } from '@/hooks/use-nearby-stores';
import { useTasks } from '@/hooks/use-tasks';

export default function HomeScreen() {
  const { activeTasks, addTask, editTask, tasks, toggleTask } = useTasks();
  const { isLoading, loadNearbyStores, nearbyStores } = useNearbyStores();
  const [taskDraft, setTaskDraft] = useState('');
  const lastPreloadedCategoryKey = useRef<string | null>(null);
  const activeCategoryKey = useMemo(
    () =>
      Array.from(new Set(activeTasks.flatMap((task) => task.places ?? [task.place])))
        .sort()
        .join('|'),
    [activeTasks]
  );

  const handleAddTaskToCategory = (title: string, place: string) => {
    addTask(title, [place], { append: true });
  };
  const handleAddSmartTask = () => {
    const trimmedDraft = taskDraft.trim();

    if (!trimmedDraft) {
      return;
    }

    addTask(trimmedDraft);
    setTaskDraft('');
  };
  const openNearbyStores = () => {
    router.push('/nearby');
    void loadNearbyStores(activeTasks);
  };

  useEffect(() => {
    if (!activeCategoryKey || isLoading || nearbyStores.length > 0) {
      return;
    }

    if (lastPreloadedCategoryKey.current === activeCategoryKey) {
      return;
    }

    lastPreloadedCategoryKey.current = activeCategoryKey;
    void loadNearbyStores(activeTasks);
  }, [activeCategoryKey, activeTasks, isLoading, loadNearbyStores, nearbyStores.length]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        style={styles.screen}>
        <ThemedText style={styles.eyebrow}>On the go</ThemedText>
        <ThemedText type="title" style={styles.title}>
          What can you knock out nearby?
        </ThemedText>

        <TaskInput
          value={taskDraft}
          onChangeText={setTaskDraft}
          onAddTask={handleAddSmartTask}
        />

        <NearbyMapSnapshot
          activeTasks={activeTasks}
          isLoading={isLoading}
          nearbyStores={nearbyStores}
          onOpenNearby={openNearbyStores}
        />

        <TaskList
          tasks={tasks}
          onAddTaskToCategory={handleAddTaskToCategory}
          onEditTask={editTask}
          onToggleTask={toggleTask}
          remainingTaskCount={activeTasks.length}
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
    paddingHorizontal: 14,
    paddingTop: 36,
    paddingBottom: 28,
    gap: 14,
    flexGrow: 1,
  },
  eyebrow: {
    color: '#3F6B54',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#17231C',
    fontSize: 32,
    lineHeight: 38,
    marginTop: 2,
  },
});
