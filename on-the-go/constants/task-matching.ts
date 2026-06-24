import type { Task } from '@/types/task';

export const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Buy milk',
    place: 'Grocery store',
    places: ['Grocery store'],
    completed: false,
  },
  {
    id: '2',
    title: 'Pick up toothpaste',
    place: 'Grocery store or pharmacy',
    places: ['Grocery store', 'Pharmacy'],
    completed: false,
  },
  {
    id: '3',
    title: 'Return Amazon package',
    place: 'UPS Store',
    places: ['UPS Store'],
    completed: false,
  },
];

export function matchPlaces(taskTitle: string) {
  const normalizedTitle = taskTitle.toLowerCase();

  if (
    /(milk|eggs|bread|rice|fruit|vegetables|groceries|target|household|detergent|paper towels)/.test(
      normalizedTitle
    )
  ) {
    return ['Grocery store'];
  }

  if (/(toothpaste|medicine|advil|prescription|shampoo|soap)/.test(normalizedTitle)) {
    return ['Grocery store', 'Pharmacy'];
  }

  if (/(return|package|amazon|ship|ups|fedex)/.test(normalizedTitle)) {
    return ['UPS Store'];
  }

  if (/(coffee|snack|lunch|sandwich)/.test(normalizedTitle)) {
    return ['Cafe or convenience store'];
  }

  return ['Grocery store'];
}

export function getPlaceLabel(places: string[]) {
  if (places.includes('Grocery store') && places.includes('Pharmacy')) {
    return 'Grocery store or pharmacy';
  }

  return places[0] ?? 'Grocery store';
}

export function normalizeTaskPlaces(task: Task) {
  if (task.place === 'Pharmacy or Target') {
    const places = ['Grocery store', 'Pharmacy'];

    return {
      ...task,
      place: getPlaceLabel(places),
      places,
    };
  }

  if (!task.places) {
    const places = matchPlaces(task.title);

    return {
      ...task,
      place: getPlaceLabel(places),
      places,
    };
  }

  return task;
}

export function taskMatchesPlace(task: Task, place: string) {
  return normalizeTaskPlaces(task).places.includes(place);
}
