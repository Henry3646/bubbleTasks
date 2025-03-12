export type Priority = '1' | '2' | '3' | '4' | '5';

export interface Task {
  id: string;
  name: string;
  description?: string;
  priority: Priority;
  createdAt: number;
}

export const BUBBLE_SIZES = {
  '1': 120,
  '2': 144,
  '3': 168,
  '4': 192,
  '5': 240,
} as const;

export const BUBBLE_COLORS = {
  '5': '#FE1D1D',
  '4': '#FDA123',
  '3': '#AFFF30',
  '2': '#A725FF',
  '1': '#20BCFF',
} as const; 