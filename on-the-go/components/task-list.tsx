import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { Task } from '@/types/task';

type TaskListProps = {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
};

export function TaskList({ tasks, onToggleTask }: TaskListProps) {
  return (
    <>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Your tasks
      </ThemedText>

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
  sectionTitle: {
    color: '#1F2933',
    marginTop: 8,
  },
  taskRow: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  completedRow: {
    opacity: 0.55,
  },
  taskBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1F2933',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  completedBullet: {
    backgroundColor: '#1F2933',
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
    color: '#1F2933',
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
