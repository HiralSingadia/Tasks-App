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

      {tasks.map((task) => (
        <Pressable
          key={task.id}
          style={[styles.taskRow, task.completed && styles.completedRow]}
          onPress={() => onToggleTask(task.id)}>
          <ThemedView style={[styles.taskBullet, task.completed && styles.completedBullet]}>
            {task.completed ? <ThemedText style={styles.checkmark}>✓</ThemedText> : null}
          </ThemedView>

          <ThemedView style={styles.taskText}>
            <ThemedText style={[styles.taskTitle, task.completed && styles.completedText]}>
              {task.title}
            </ThemedText>
            <ThemedText style={styles.taskPlace}>{task.place}</ThemedText>
          </ThemedView>
        </Pressable>
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
  taskRow: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E3E8DE',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  completedRow: {
    backgroundColor: '#F7F8F4',
    opacity: 0.68,
  },
  taskBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2F6B4F',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  completedBullet: {
    backgroundColor: '#2F6B4F',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  taskText: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17231C',
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  taskPlace: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});
