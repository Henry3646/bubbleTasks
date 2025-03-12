import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { TaskBubble } from '~/components/TaskBubble';
import { TaskModal } from '~/components/TaskModal';
import { TaskDetail } from '~/components/TaskDetail';
import { Task, BUBBLE_SIZES } from '~/lib/types';
import { getTasks, saveTask, deleteTask } from '~/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { NAV_THEME } from '~/lib/constants';
import { useColorScheme } from '~/lib/useColorScheme';
import { ThemeToggle } from '~/components/ThemeToggle';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const PADDING = 20;

interface BubblePosition {
  x: number;
  y: number;
  size: number;
  id: string;
}

export default function HomeScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const theme = isDarkColorScheme ? NAV_THEME.dark : NAV_THEME.light;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [bubblePositions, setBubblePositions] = useState<Record<string, BubblePosition>>({});

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const loadedTasks = await getTasks();
    setTasks(loadedTasks);
    
    // Initialize bubble positions
    const positions: Record<string, BubblePosition> = {};
    loadedTasks.forEach((task) => {
      positions[task.id] = getInitialPosition(task);
    });
    setBubblePositions(positions);
  };

  const handleAddTask = async (task: Task) => {
    await saveTask(task);
    setTasks((prev) => [...prev, task]);
    setBubblePositions((prev) => ({
      ...prev,
      [task.id]: getInitialPosition(task),
    }));
  };

  const handleCompleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    setBubblePositions((prev) => {
      const newPositions = { ...prev };
      delete newPositions[taskId];
      return newPositions;
    });
  };

  const handleTaskPress = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleBubblePositionChange = (taskId: string, x: number, y: number) => {
    setBubblePositions((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        x,
        y,
      },
    }));
  };

  // Calculate initial positions for bubbles
  const getInitialPosition = (task: Task): BubblePosition => {
    const size = BUBBLE_SIZES[task.priority];
    const safeWidth = SCREEN_WIDTH - size - PADDING * 2;
    const safeHeight = SCREEN_HEIGHT - size - PADDING * 2;
    
    return {
      x: PADDING + Math.random() * safeWidth,
      y: PADDING + Math.random() * safeHeight,
      size,
      id: task.id,
    };
  };

  const getOtherBubblePositions = (taskId: string) => {
    return Object.values(bubblePositions).filter(pos => pos.id !== taskId);
  };

  return (
    <View className='flex-1 bg-background'>
      <View className='absolute top-[5.75rem] left-10'>
        <ThemeToggle />
      </View>
      <StatusBar style="auto" />
      <View className='flex-1'>
        {tasks.map((task) => (
          <TaskBubble
            key={task.id}
            task={task}
            onPress={() => handleTaskPress(task)}
            onComplete={() => handleCompleteTask(task.id)}
            onPositionChange={(x, y) => handleBubblePositionChange(task.id, x, y)}
          />
        ))}
      </View>

      <TouchableOpacity
        className='absolute top-14 right-10 bg-primary rounded-full p-4 '
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="add" size={32} color={theme.background} />
      </TouchableOpacity>

      <TaskModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleAddTask}
      />

      <TaskDetail
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </View>
  );
}