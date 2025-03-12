import React from 'react';
import { Modal, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Task, BUBBLE_COLORS } from '~/lib/types';

interface TaskDetailProps {
  task: Task | null;
  onClose: () => void;
}

export function TaskDetail({ task, onClose }: TaskDetailProps) {
  if (!task) return null;

  return (
    <Modal
      visible={!!task}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <SafeAreaView className="flex-1" style={{ backgroundColor: BUBBLE_COLORS[task.priority] }}>
        <View className="p-5 items-end">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-white/30 justify-center items-center"
            onPress={onClose}
          >
            <Text className="text-white text-2xl font-bold">×</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1 p-5 justify-center">
          <Text className="text-white text-3xl font-bold mb-4 text-center">
            {task.name}
          </Text>
          
          {task.description ? (
            <Text className="text-white text-lg mb-6 text-center">
              {task.description}
            </Text>
          ) : null}

          <View className="bg-white/20 p-4 rounded-xl">
            <Text className="text-white text-base mb-2">
              Priority: {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Text>
            <Text className="text-white text-base">
              Created: {new Date(task.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
} 