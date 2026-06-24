import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type TaskInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  onAddTask: () => void;
};

export function TaskInput({ value, onChangeText, onAddTask }: TaskInputProps) {
  return (
    <ThemedView style={styles.inputCard}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onAddTask}
        placeholder="Add an errand, like buy eggs"
        placeholderTextColor="#7A838F"
        returnKeyType="done"
        style={styles.input}
      />

      <Pressable style={styles.addButton} onPress={onAddTask}>
        <ThemedText style={styles.addButtonText}>Add</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E5E9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    color: '#1F2933',
    flex: 1,
    fontSize: 16,
    minHeight: 44,
  },
  addButton: {
    backgroundColor: '#1F2933',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
