import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { initialTasks, matchPlace } from '@/constants/task-matching';
import type { Task } from '@/types/task';

type TasksContextValue = {
  activeTasks: Task[];
  addTask: (title: string) => void;
  tasks: Task[];
  toggleTask: (taskId: string) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: PropsWithChildren) {
  const [tasks, setTasks] = useState(initialTasks);

  const activeTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);

  const addTask = (title: string) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    setTasks((currentTasks) => [
      {
        id: Date.now().toString(),
        title: trimmedTitle,
        place: matchPlace(trimmedTitle),
        completed: false,
      },
      ...currentTasks,
    ]);
  };

  const toggleTask = (taskId: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <TasksContext.Provider value={{ activeTasks, addTask, tasks, toggleTask }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);

  if (!context) {
    throw new Error('useTasks must be used within TasksProvider');
  }

  return context;
}
