import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskInput } from '@/components/task-input';
import { TaskList } from '@/components/task-list';
import { ThemedText } from '@/components/themed-text';
import { useNearbyStores } from '@/hooks/use-nearby-stores';
import { useTasks } from '@/hooks/use-tasks';

export default function HomeScreen() {
  const [taskTitle, setTaskTitle] = useState('');
  const { activeTasks, addTask, tasks, toggleTask } = useTasks();
  const { loadNearbyStores } = useNearbyStores();

  const handleAddTask = () => {
    addTask(taskTitle);
    setTaskTitle('');
  };
  const openNearbyStores = () => {
    router.push('/nearby');
    void loadNearbyStores(activeTasks);
  };

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

        <TaskInput value={taskTitle} onChangeText={setTaskTitle} onAddTask={handleAddTask} />

        <TaskList
          tasks={tasks}
          onExploreNearby={openNearbyStores}
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
    paddingHorizontal: 20,
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
