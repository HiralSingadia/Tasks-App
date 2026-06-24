import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import type { Task } from '@/types/task';

const CATEGORY_SYMBOLS: Record<string, IconSymbolName> = {
  'Cafe or convenience store': 'cup.and.saucer.fill',
  'Gas station': 'fuelpump.fill',
  'Grocery store': 'cart.fill',
  'Pet store': 'pawprint.fill',
  Pharmacy: 'cross.case.fill',
  'UPS Store': 'shippingbox.fill',
};

const getCategorySymbol = (place: string) => CATEGORY_SYMBOLS[place] ?? 'mappin.circle.fill';
const getCategoryTitle = (place: string) => (place === 'Grocery store' ? 'Groceries' : place);

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
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const categoryGroups = tasks.reduce<Record<string, Task[]>>((groups, task) => {
    const places = task.places ?? [task.place];

    return places.reduce<Record<string, Task[]>>(
      (updatedGroups, place) => ({
        ...updatedGroups,
        [place]: [...(updatedGroups[place] ?? []), task],
      }),
      groups
    );
  }, {});
  const getActiveTaskCount = (placeTasks: Task[]) =>
    placeTasks.filter((task) => !task.completed).length;
  const categoryEntries = Object.entries(categoryGroups).sort(
    ([firstPlace, firstTasks], [secondPlace, secondTasks]) => {
      const activeDifference = getActiveTaskCount(secondTasks) - getActiveTaskCount(firstTasks);

      if (activeDifference !== 0) {
        return activeDifference;
      }

      const totalDifference = secondTasks.length - firstTasks.length;

      if (totalDifference !== 0) {
        return totalDifference;
      }

      return firstPlace.localeCompare(secondPlace);
    }
  );
  const renderCategoryTile = ([place, placeTasks]: [string, Task[]]) => {
    const activeCount = getActiveTaskCount(placeTasks);
    const isCollapsed = collapsedCategories[place] ?? false;
    const categoryTitle = getCategoryTitle(place);

    return (
      <ThemedView key={place} style={styles.categoryTile}>
        <Pressable
          accessibilityLabel={`${categoryTitle}, ${activeCount} ${
            activeCount === 1 ? 'task' : 'tasks'
          }`}
          accessibilityHint={isCollapsed ? 'Shows tasks in this category' : 'Hides tasks in this category'}
          accessibilityRole="button"
          accessibilityState={{ expanded: !isCollapsed }}
          onPress={() =>
            setCollapsedCategories((currentCategories) => ({
              ...currentCategories,
              [place]: !isCollapsed,
            }))
          }
          style={({ pressed }) => [styles.categoryHeader, pressed && styles.categoryHeaderPressed]}>
          <IconSymbol
            name={isCollapsed ? 'chevron.right' : 'chevron.down'}
            size={18}
            color="#60706A"
            style={styles.collapseIcon}
          />
          <ThemedView style={styles.categorySymbolBadge}>
            <IconSymbol name={getCategorySymbol(place)} size={23} color="#2F6B4F" />
          </ThemedView>
          <ThemedText numberOfLines={1} style={styles.categoryTitle}>
            {categoryTitle}
          </ThemedText>
          <ThemedText style={styles.categoryCount}>{activeCount}</ThemedText>
        </Pressable>

        {!isCollapsed
          ? placeTasks.map((task) => (
              <Pressable
                key={`${place}-${task.id}`}
                style={[styles.taskItem, task.completed && styles.completedItem]}
                onPress={() => onToggleTask(task.id)}>
                <ThemedView style={[styles.taskBullet, task.completed && styles.completedBullet]}>
                  {task.completed ? <ThemedText style={styles.checkmark}>✓</ThemedText> : null}
                </ThemedView>
                <ThemedText
                  numberOfLines={2}
                  style={[styles.taskTitle, task.completed && styles.completedText]}>
                  {task.title}
                </ThemedText>
              </Pressable>
            ))
          : null}
      </ThemedView>
    );
  };

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

      <ThemedView style={styles.categoryList}>
        {categoryEntries.map(renderCategoryTile)}
      </ThemedView>
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
  categoryList: {
    backgroundColor: 'transparent',
    gap: 10,
  },
  categoryTile: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E3E8DE',
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  categoryHeader: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  categoryHeaderPressed: {
    opacity: 0.72,
  },
  collapseIcon: {
    width: 18,
  },
  categorySymbolBadge: {
    alignItems: 'center',
    backgroundColor: '#E7F1E7',
    borderRadius: 16,
    height: 34,
    justifyContent: 'center',
    width: 46,
  },
  categoryTitle: {
    color: '#17231C',
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  categoryCount: {
    color: '#2F6B4F',
    fontSize: 18,
    fontWeight: '900',
  },
  taskItem: {
    alignItems: 'flex-start',
    backgroundColor: '#F7F9F4',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  completedItem: {
    opacity: 0.55,
  },
  taskBullet: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
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
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  taskTitle: {
    color: '#17231C',
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
});
