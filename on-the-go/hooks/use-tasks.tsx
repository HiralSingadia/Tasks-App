import AsyncStorage from '@react-native-async-storage/async-storage';
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
  addTask: (title: string, places?: string[], options?: { append?: boolean }) => void;
  editTask: (taskId: string, title: string) => void;
  tasks: Task[];
  toggleTask: (taskId: string) => void;
};

const TasksContext = createContext<TasksContextValue | null>(null);
export const tasksStorageKey = 'on-the-go.tasks.v1';

function getInitialTasks() {
  return initialTasks.map(normalizeTaskPlaces);
}

function getNormalizedTasks(tasks: Task[]) {
  return tasks.map(normalizeTaskPlaces);
}

function isTaskArray(value: unknown): value is Task[] {
  return (
    Array.isArray(value) &&
    value.every(
      (task) =>
        task &&
        typeof task === 'object' &&
        typeof (task as Task).id === 'string' &&
        typeof (task as Task).title === 'string' &&
        typeof (task as Task).place === 'string' &&
        typeof (task as Task).completed === 'boolean'
    )
  );
}

export function TasksProvider({ children }: PropsWithChildren) {
  const [tasks, setTasks] = useState(getInitialTasks);
  const [hasLoadedStoredTasks, setHasLoadedStoredTasks] = useState(false);

  const activeTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);

  useEffect(() => {
    let isMounted = true;

    async function loadStoredTasks() {
      try {
        const storedTasks = await AsyncStorage.getItem(tasksStorageKey);

        if (!isMounted) {
          return;
        }

        if (!storedTasks) {
          setTasks(getInitialTasks());
          return;
        }

        const parsedTasks: unknown = JSON.parse(storedTasks);

        if (!isTaskArray(parsedTasks)) {
          setTasks(getInitialTasks());
          return;
        }

        setTasks(getNormalizedTasks(parsedTasks));
      } catch (error) {
        console.warn('Unable to load saved tasks.', error);
        setTasks(getInitialTasks());
      } finally {
        if (isMounted) {
          setHasLoadedStoredTasks(true);
        }
      }
    }

    loadStoredTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredTasks) {
      return;
    }

    const tasksToSave = tasks.filter((task) => !task.completed);

    AsyncStorage.setItem(tasksStorageKey, JSON.stringify(tasksToSave)).catch((error) => {
      console.warn('Unable to save tasks.', error);
    });
  }, [hasLoadedStoredTasks, tasks]);

  const addTask = (title: string, forcedPlaces?: string[], options?: { append?: boolean }) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const places = forcedPlaces?.length ? forcedPlaces : matchPlaces(trimmedTitle);

    const newTask = {
        id: Date.now().toString(),
        title: trimmedTitle,
        place: getPlaceLabel(places),
        places,
        completed: false,
      };

    setTasks((currentTasks) =>
      options?.append ? [...currentTasks, newTask] : [newTask, ...currentTasks]
    );
  };

  const toggleTask = (taskId: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const editTask = (taskId: string, title: string) => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, title: trimmedTitle } : task))
    );
  };

  return (
    <TasksContext.Provider value={{ activeTasks, addTask, editTask, tasks, toggleTask }}>
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
