import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { TaskInput } from '@/components/task-input';
import { TaskList } from '@/components/task-list';
import { useTasks } from '@/hooks/use-tasks';

export default function HomeScreen() {
  const [taskTitle, setTaskTitle] = useState('');
  const { addTask, tasks, toggleTask } = useTasks();

  const handleAddTask = () => {
    addTask(taskTitle);
    setTaskTitle('');
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      style={styles.screen}>
      <TaskInput value={taskTitle} onChangeText={setTaskTitle} onAddTask={handleAddTask} />

      <TaskList tasks={tasks} onToggleTask={toggleTask} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 12,
    flexGrow: 1,
  },
});
