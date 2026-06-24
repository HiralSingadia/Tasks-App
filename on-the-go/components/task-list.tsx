import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

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
  onAddTaskToCategory: (title: string, place: string) => void;
  onEditTask: (taskId: string, title: string) => void;
  onExploreNearby: () => void;
  onToggleTask: (taskId: string) => void;
};

export function TaskList({
  remainingTaskCount,
  tasks,
  onAddTaskToCategory,
  onEditTask,
  onExploreNearby,
  onToggleTask,
}: TaskListProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({});
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({});
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
    const isAdding = addingCategory === place;
    const categoryTitle = getCategoryTitle(place);
    const categoryDraft = categoryDrafts[place] ?? '';
    const startEditingTask = (task: Task) => {
      setEditingTaskId(task.id);
      setTaskDrafts((currentDrafts) => ({ ...currentDrafts, [task.id]: task.title }));
    };
    const saveTaskEdit = (task: Task) => {
      const taskDraft = taskDrafts[task.id] ?? task.title;
      const trimmedDraft = taskDraft.trim();

      if (!trimmedDraft) {
        setTaskDrafts((currentDrafts) => ({ ...currentDrafts, [task.id]: task.title }));
        setEditingTaskId(null);
        return;
      }

      onEditTask(task.id, trimmedDraft);
      setTaskDrafts((currentDrafts) => ({ ...currentDrafts, [task.id]: trimmedDraft }));
      setEditingTaskId(null);
    };
    const addCategoryTask = () => {
      const trimmedDraft = categoryDraft.trim();

      if (!trimmedDraft) {
        return;
      }

      onAddTaskToCategory(trimmedDraft, place);
      setCategoryDrafts((currentDrafts) => ({ ...currentDrafts, [place]: '' }));
      setAddingCategory(null);
    };

    return (
      <ThemedView key={place} style={styles.categoryTile}>
        <ThemedView style={styles.categoryHeader}>
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
            style={({ pressed }) => [
              styles.categoryToggle,
              pressed && styles.categoryHeaderPressed,
            ]}>
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
          <Pressable
            accessibilityLabel={`Add item to ${categoryTitle}`}
            accessibilityRole="button"
            onPress={() => {
              setCollapsedCategories((currentCategories) => ({
                ...currentCategories,
                [place]: false,
              }));
              setAddingCategory((currentCategory) => (currentCategory === place ? null : place));
            }}
            style={({ pressed }) => [styles.headerAddButton, pressed && styles.headerAddPressed]}>
            <IconSymbol name="plus" size={18} color="#2F6B4F" />
          </Pressable>
        </ThemedView>

        {!isCollapsed
          ? (
              <>
                {placeTasks.map((task) => (
                  editingTaskId === task.id ? (
                    <ThemedView key={`${place}-${task.id}`} style={styles.taskEditRow}>
                      <TextInput
                        accessibilityLabel={`Edit ${task.title}`}
                      autoFocus
                      multiline
                      value={taskDrafts[task.id] ?? task.title}
                      onChangeText={(value) =>
                        setTaskDrafts((currentDrafts) => ({
                            ...currentDrafts,
                            [task.id]: value,
                          }))
                        }
                        returnKeyType="default"
                        style={styles.taskEditInput}
                      />
                      <Pressable
                        accessibilityLabel={`Save ${task.title}`}
                        accessibilityRole="button"
                        onPress={() => saveTaskEdit(task)}
                        style={({ pressed }) => [
                          styles.taskIconButton,
                          styles.taskSaveButton,
                          pressed && styles.taskIconButtonPressed,
                        ]}>
                        <IconSymbol name="checkmark" size={18} color="#FFFFFF" />
                      </Pressable>
                    </ThemedView>
                  ) : (
                    <ThemedView
                      key={`${place}-${task.id}`}
                      style={[styles.taskItem, task.completed && styles.completedItem]}>
                      <Pressable
                        accessibilityLabel={`${task.completed ? 'Mark incomplete' : 'Mark complete'} ${
                          task.title
                        }`}
                        accessibilityRole="button"
                        onPress={() => onToggleTask(task.id)}
                        style={styles.taskBulletButton}>
                        <ThemedView
                          style={[styles.taskBullet, task.completed && styles.completedBullet]}>
                          {task.completed ? <ThemedText style={styles.checkmark}>✓</ThemedText> : null}
                        </ThemedView>
                      </Pressable>
                      <Pressable
                        accessibilityLabel={`Edit ${task.title}`}
                        accessibilityRole="button"
                        onPress={() => startEditingTask(task)}
                        style={({ pressed }) => [
                          styles.taskTitleButton,
                          pressed && styles.taskTitleButtonPressed,
                        ]}>
                        <ThemedText style={[styles.taskTitle, task.completed && styles.completedText]}>
                          {task.title}
                        </ThemedText>
                      </Pressable>
                    </ThemedView>
                  )
                ))}

                {isAdding ? (
                  <ThemedView style={styles.categoryAddRow}>
                    <TextInput
                      accessibilityLabel={`Add item to ${categoryTitle}`}
                      autoFocus
                      value={categoryDraft}
                      onChangeText={(value) =>
                        setCategoryDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [place]: value,
                        }))
                      }
                      onSubmitEditing={addCategoryTask}
                      placeholder={`Add to ${categoryTitle}`}
                      placeholderTextColor="#7A838F"
                      returnKeyType="done"
                      style={styles.categoryAddInput}
                    />
                    <Pressable
                      accessibilityLabel={`Save item to ${categoryTitle}`}
                      accessibilityRole="button"
                      onPress={addCategoryTask}
                      style={({ pressed }) => [
                        styles.categoryAddButton,
                        pressed && styles.categoryAddButtonPressed,
                      ]}>
                      <IconSymbol name="plus" size={20} color="#FFFFFF" />
                    </Pressable>
                  </ThemedView>
                ) : null}
              </>
            )
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
  categoryToggle: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
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
  headerAddButton: {
    alignItems: 'center',
    backgroundColor: '#E7F1E7',
    borderColor: '#CFE0CF',
    borderRadius: 12,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  headerAddPressed: {
    opacity: 0.72,
  },
  taskItem: {
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 2,
    paddingVertical: 7,
  },
  taskBulletButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'flex-start',
    paddingTop: 5,
    width: 38,
  },
  taskTitleButton: {
    flex: 1,
    alignItems: 'flex-start',
    minHeight: 40,
    justifyContent: 'flex-start',
    paddingTop: 3,
  },
  taskTitleButtonPressed: {
    opacity: 0.72,
  },
  taskIconButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  taskIconButtonPressed: {
    opacity: 0.72,
  },
  taskEditRow: {
    alignItems: 'flex-start',
    backgroundColor: '#F7F9F4',
    borderColor: '#DCE4DB',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
  },
  taskEditInput: {
    color: '#17231C',
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    minHeight: 58,
    paddingVertical: 6,
    textAlignVertical: 'top',
  },
  taskSaveButton: {
    backgroundColor: '#2F6B4F',
    marginTop: 4,
  },
  completedItem: {
    opacity: 0.55,
  },
  taskBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.8,
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
  taskTitle: {
    color: '#17231C',
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  categoryAddRow: {
    alignItems: 'center',
    backgroundColor: '#F7F9F4',
    borderColor: '#E3E8DE',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
  },
  categoryAddInput: {
    color: '#17231C',
    flex: 1,
    fontSize: 14,
    minHeight: 36,
    paddingVertical: 0,
  },
  categoryAddButton: {
    alignItems: 'center',
    backgroundColor: '#2F6B4F',
    borderRadius: 9,
    height: 34,
    justifyContent: 'center',
    width: 38,
  },
  categoryAddButtonPressed: {
    opacity: 0.72,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
});
