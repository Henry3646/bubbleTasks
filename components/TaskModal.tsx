import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Priority, Task } from '~/lib/types';
import { Input } from './ui/input';
import { ThemeToggle } from './ThemeToggle';
import { Label } from './ui/label';
import { Text } from './ui/text';
import { Button } from './ui/button';
import { H2 } from './ui/typography';
import { Textarea } from './ui/textarea';

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
}

export function TaskModal({ visible, onClose, onSave }: TaskModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('3');

  const handleSave = () => {
    if (!name.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description.trim() || undefined,
      priority,
      createdAt: Date.now(),
    };

    onSave(newTask);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setPriority('3');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className='flex-1 justify-end'
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <View className='bg-card rounded-t-2xl px-4 pt-20 pb-10 h-full'>
          <H2 className='mb-6'>New Task</H2>
          
          <Input
            placeholder="Task name"
            value={name}
            onChangeText={setName}
            className='mb-4'
          />
          
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            className='mb-4'
          />

          <View className='mb-4'>
            <Label>Priority:</Label>
            <View className='flex-row gap-2'>
              {(['1', '2', '3', '4', '5'] as Priority[]).map((p) => (
                <Button key={p} 
                  variant={priority === p ? 'default' : 'outline'}
                  className='flex-1'
                  onPress={() => setPriority(p)}
                >
                  <Text>{p}</Text>
                </Button>
              ))}
            </View>
          </View>

          <View className='flex-row gap-2'>
            <Button variant='outline' onPress={handleClose}
              className='flex-1'
            >
              <Text>Cancel</Text>
            </Button>
            <Button onPress={handleSave}
              className='flex-1'
            >
              <Text>Save</Text>
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
