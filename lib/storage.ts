import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from './types';

const TASKS_KEY = '@bubble_tasks';

export async function getTasks(): Promise<Task[]> {
  try {
    const tasksJson = await AsyncStorage.getItem(TASKS_KEY);
    console.log('tasksJson', tasksJson);
    return tasksJson ? JSON.parse(tasksJson) : [];
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
}

export async function saveTask(task: Task): Promise<void> {
  try {
    const tasks = await getTasks();
    tasks.push(task);
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving task:', error);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    const tasks = await getTasks();
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
  } catch (error) {
    console.error('Error deleting task:', error);
  }
} 