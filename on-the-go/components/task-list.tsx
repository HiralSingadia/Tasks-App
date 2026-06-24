import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Task } from '@/types/task';

type TaskListProps = {
  remainingTaskCount: number;
  tasks: Task[];
  onExploreNearby: () => void;
  onToggleTask: (taskId: string) => void;
};

export function TaskList({
  remainingTaskCount,
  tasks,
  onExploreNearby,
  onToggleTask,
}: TaskListProps) {
  const taskGroups = tasks.reduce<Record<string, Task[]>>((groups, task) => {
    const currentTasks = groups[task.place] ?? [];

    return {
      ...groups,
      [task.place]: [...currentTasks, task],
    };
  }, {});

  return (
    <>
      <ThemedView style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Your tasks
        </ThemedText>
        <ThemedView style={styles.sectionActions}>
          <ThemedText style={styles.sectionCount}>
            {remainingTaskCount} left
          </ThemedText>
          <Pressable
            accessibilityHint="Opens nearby stores"
            accessibilityRole="button"
            onPress={onExploreNearby}
            style={({ pressed }) => [styles.exploreButton, pressed && styles.exploreButtonPressed]}>
            <ThemedText style={styles.exploreText}>Explore</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>

      {Object.entries(taskGroups).map(([place, placeTasks]) => (
        <ThemedView key={place} style={styles.categoryCard}>
          <ThemedView style={styles.categoryHeader}>
            <ThemedText style={styles.categoryTitle}>{place}</ThemedText>
            <ThemedText style={styles.categoryCount}>
              {placeTasks.filter((task) => !task.completed).length}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.chipRow}>
            {placeTasks.map((task) => (
              <Pressable
                key={task.id}
                style={[styles.taskChip, task.completed && styles.completedChip]}
                onPress={() => onToggleTask(task.id)}>
                <ThemedText style={[styles.chipText, task.completed && styles.completedText]}>
                  {task.title}
                </ThemedText>
              </Pressable>
            ))}
          </ThemedView>
        </ThemedView>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionTitle: {
    color: '#17231C',
  },
  sectionActions: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 10,
  },
  sectionCount: {
    color: '#60706A',
    fontSize: 13,
    fontWeight: '700',
  },
  exploreButton: {
    backgroundColor: '#E7F1E7',
    borderColor: '#CFE0CF',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  exploreButtonPressed: {
    opacity: 0.72,
  },
  exploreText: {
    color: '#2F6B4F',
    fontSize: 13,
    fontWeight: '800',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E3E8DE',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  categoryHeader: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryTitle: {
    color: '#17231C',
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  categoryCount: {
    color: '#60706A',
    fontSize: 13,
    fontWeight: '800',
  },
  chipRow: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  taskChip: {
    backgroundColor: '#F4F7F1',
    borderColor: '#DCE6D7',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  completedChip: {
    opacity: 0.55,
  },
  chipText: {
    color: '#17231C',
    fontSize: 14,
    fontWeight: '700',
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
});
