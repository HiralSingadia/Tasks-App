import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import {
  getPlaceLabel,
  initialTasks,
  matchPlaces,
  normalizeTaskPlaces,
} from '@/constants/task-matching';
import type { Task } from '@/types/task';

type TasksContextValue = {
  activeTasks: Task[];
  addTask: (title: string) => void;
  tasks: Task[];
  toggleTask: (taskId: string) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: PropsWithChildren) {
  const [tasks, setTasks] = useState(() => initialTasks.map(normalizeTaskPlaces));

  const activeTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);

  useEffect(() => {
    setTasks((currentTasks) => {
      const normalizedTasks = currentTasks.map(normalizeTaskPlaces);
      const hasChanged = normalizedTasks.some((task, index) => task !== currentTasks[index]);

      return hasChanged ? normalizedTasks : currentTasks;
    });
  }, []);

  const addTask = (title: string) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const places = matchPlaces(trimmedTitle);

    setTasks((currentTasks) => [
      {
        id: Date.now().toString(),
        title: trimmedTitle,
        place: getPlaceLabel(places),
        places,
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
