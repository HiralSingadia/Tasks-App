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
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#DCE4DB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#17231C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  input: {
    color: '#17231C',
    flex: 1,
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 8,
  },
  addButton: {
    backgroundColor: '#2F6B4F',
    borderRadius: 10,
    minHeight: 48,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
