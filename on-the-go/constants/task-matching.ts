import type { Task } from '@/types/task';

export const initialTasks: Task[] = [
  { id: '1', title: 'Buy milk', place: 'Grocery store', completed: false },
  { id: '2', title: 'Pick up toothpaste', place: 'Pharmacy or Target', completed: false },
  { id: '3', title: 'Return Amazon package', place: 'UPS Store', completed: false },
];

export function matchPlace(taskTitle: string) {
  const normalizedTitle = taskTitle.toLowerCase();

  if (/(milk|eggs|bread|rice|fruit|vegetables|groceries)/.test(normalizedTitle)) {
    return 'Grocery store';
  }

  if (/(toothpaste|medicine|advil|prescription|shampoo|soap)/.test(normalizedTitle)) {
    return 'Pharmacy or Target';
  }

  if (/(return|package|amazon|ship|ups|fedex)/.test(normalizedTitle)) {
    return 'UPS Store';
  }

  if (/(coffee|snack|lunch|sandwich)/.test(normalizedTitle)) {
    return 'Cafe or convenience store';
  }

  return 'Nearby store';
}
