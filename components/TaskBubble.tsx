import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, StyleSheet, Text, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Task, BUBBLE_SIZES, BUBBLE_COLORS } from '~/lib/types';

interface TaskBubbleProps {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
  onPositionChange: (x: number, y: number) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const LONG_PRESS_DURATION = 2000; // 2 seconds
const COLLISION_BOUNCE = 0.8; // Increased from 0.6 for bouncier collisions
const BASE_SPEED = 0.5; // Base movement speed
const MAX_SPEED = 16; // Increased from 5 to allow faster movement
const DRAG_COEFFICIENT = 0.995; // Increased from 0.98 for much less friction
const RANDOM_FORCE = 0.02; // Random movement strength
const TARGET_SPEED = 0.8; // Speed the bubbles will tend towards
const SPEED_ADJUSTMENT_RATE = 0.002; // Reduced from 0.005 to maintain momentum longer

export function TaskBubble({ task, onPress, onComplete, onPositionChange }: TaskBubbleProps) {
  const [isPressing, setIsPressing] = useState(false);
  const pressStartTime = useRef<number>(0);
  const pressStartPosition = useRef({ x: 0, y: 0 });
  const pressTimer = useRef<NodeJS.Timeout>();
  const hapticInterval = useRef<NodeJS.Timeout>();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  // Calculate initial position from center
  const size = BUBBLE_SIZES[task.priority];
  const screenCenterX = SCREEN_WIDTH / 2;
  const screenCenterY = SCREEN_HEIGHT / 2;
  const initialPosition = {
    x: screenCenterX - size / 2 + (Math.random() * 2 - 1) * 50, // Random offset ±50px from center
    y: screenCenterY - size / 2 + (Math.random() * 2 - 1) * 50  // Random offset ±50px from center
  };
  
  const position = useRef(new Animated.ValueXY(initialPosition)).current;
  const velocity = useRef({
    x: (Math.random() * 2 - 1) * BASE_SPEED,
    y: (Math.random() * 2 - 1) * BASE_SPEED
  });
  const lastGestureVelocity = useRef({ x: 0, y: 0 });
  const currentPosition = useRef(initialPosition);

  // Clean up all intervals when component unmounts
  useEffect(() => {
    return () => {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
      if (hapticInterval.current) {
        clearInterval(hapticInterval.current);
      }
    };
  }, []);

  // Set up position listener
  useEffect(() => {
    position.addListener((value) => {
      currentPosition.current = value;
    });

    return () => {
      position.removeAllListeners();
    };
  }, []);

  const normalizeVelocity = () => {
    const speed = Math.sqrt(
      velocity.current.x * velocity.current.x +
      velocity.current.y * velocity.current.y
    );

    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      velocity.current.x *= scale;
      velocity.current.y *= scale;
    }

    // Gradually adjust speed towards target speed
    if (speed > TARGET_SPEED) {
      velocity.current.x *= (1 - SPEED_ADJUSTMENT_RATE);
      velocity.current.y *= (1 - SPEED_ADJUSTMENT_RATE);
    } else if (speed < TARGET_SPEED) {
      velocity.current.x *= (1 + SPEED_ADJUSTMENT_RATE);
      velocity.current.y *= (1 + SPEED_ADJUSTMENT_RATE);
    }
  };

  const checkCollisions = (x: number, y: number) => {
    // Screen edge collisions
    if (x <= 0) {
      velocity.current.x = Math.abs(velocity.current.x) * COLLISION_BOUNCE;
      x = 0;
    } else if (x >= SCREEN_WIDTH - size) {
      velocity.current.x = -Math.abs(velocity.current.x) * COLLISION_BOUNCE;
      x = SCREEN_WIDTH - size;
    }

    if (y <= 0) {
      velocity.current.y = Math.abs(velocity.current.y) * COLLISION_BOUNCE;
      y = 0;
    } else if (y >= SCREEN_HEIGHT - size) {
      velocity.current.y = -Math.abs(velocity.current.y) * COLLISION_BOUNCE;
      y = SCREEN_HEIGHT - size;
    }

    // Update position if it was adjusted
    position.setValue({ x, y });
  };

  const startHapticFeedback = () => {
    // Initial haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    let interval = 500; // Start with 500ms interval
    const minInterval = 50; // Minimum interval between haptics
    const startTime = Date.now();
    
    const updateHaptics = () => {
      if (!isPressing) return;
      
      // Calculate how long we've been pressing
      const pressDuration = Date.now() - startTime;
      
      // Decrease interval based on press duration
      // Start slow, get faster exponentially
      interval = Math.max(
        minInterval,
        500 - (pressDuration / LONG_PRESS_DURATION) * 450
      );
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Schedule next haptic with updated interval
      hapticInterval.current = setTimeout(updateHaptics, interval);
    };
    
    // Start the haptic loop
    hapticInterval.current = setTimeout(updateHaptics, interval);
  };

  const stopHapticFeedback = () => {
    if (hapticInterval.current) {
      clearTimeout(hapticInterval.current);
      hapticInterval.current = undefined;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        // Get the touch position relative to the bubble
        const touch = {
          x: evt.nativeEvent.locationX,
          y: evt.nativeEvent.locationY
        };
        
        // Check if touch is within the circular bubble
        const center = { x: size / 2, y: size / 2 };
        const distance = Math.sqrt(
          Math.pow(touch.x - center.x, 2) + 
          Math.pow(touch.y - center.y, 2)
        );
        
        return distance <= size / 2;
      },
      onPanResponderGrant: (_, gestureState) => {
        position.stopAnimation();
        setIsPressing(true);
        pressStartTime.current = Date.now();
        pressStartPosition.current = {
          x: gestureState.x0,
          y: gestureState.y0
        };
        lastGestureVelocity.current = { x: 0, y: 0 };
        
        // Start the pop animation
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: LONG_PRESS_DURATION,
          useNativeDriver: true,
        }).start();

        startHapticFeedback();

        pressTimer.current = setTimeout(() => {
          stopHapticFeedback();
          // Final strong haptic feedback for the pop
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          // Pop animation
          Animated.sequence([
            Animated.spring(scaleAnim, {
              toValue: 1.8,
              useNativeDriver: true,
            }),
            Animated.parallel([
              Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
            ]),
          ]).start(() => {
            onComplete();
          });
        }, LONG_PRESS_DURATION);
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = gestureState.moveX - size / 2;
        const newY = gestureState.moveY - size / 2;
        
        lastGestureVelocity.current = {
          x: gestureState.vx,
          y: gestureState.vy
        };
        
        position.setValue({ 
          x: Math.max(0, Math.min(newX, SCREEN_WIDTH - size)),
          y: Math.max(0, Math.min(newY, SCREEN_HEIGHT - size))
        });
        
        onPositionChange(newX, newY);
        checkCollisions(newX, newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsPressing(false);
        stopHapticFeedback();
        
        if (pressTimer.current) {
          clearTimeout(pressTimer.current);
        }
        
        const pressDuration = Date.now() - pressStartTime.current;
        const moveDistance = Math.sqrt(
          Math.pow(gestureState.dx, 2) +
          Math.pow(gestureState.dy, 2)
        );

        if (pressDuration < 200 && moveDistance < 10) {
          onPress();
        }
        
        // Increased velocity retention from 0.99 to 1.2 to make throws more energetic
        velocity.current = {
          x: lastGestureVelocity.current.x * 1.2,
          y: lastGestureVelocity.current.y * 1.2
        };
        
        scaleAnim.setValue(1);
        startFloatingAnimation();
      },
    })
  ).current;

  useEffect(() => {
    startFloatingAnimation();
    return () => {
      if (pressTimer.current) {
        clearTimeout(pressTimer.current);
      }
    };
  }, []);

  const startFloatingAnimation = () => {
    let animationFrame: number;

    const animate = () => {
      const currentX = currentPosition.current.x;
      const currentY = currentPosition.current.y;

      // Only apply random forces when not pressing
      if (!isPressing) {
        velocity.current.x += (Math.random() * 2 - 1) * RANDOM_FORCE;
        velocity.current.y += (Math.random() * 2 - 1) * RANDOM_FORCE;
      }

      // Apply drag
      velocity.current.x *= DRAG_COEFFICIENT;
      velocity.current.y *= DRAG_COEFFICIENT;

      // Normalize velocity
      normalizeVelocity();

      // Update position
      const newX = currentX + velocity.current.x;
      const newY = currentY + velocity.current.y;

      // Check for collisions with screen edges
      checkCollisions(newX, newY);

      // Update position tracking
      onPositionChange(currentPosition.current.x, currentPosition.current.y);

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  };

  const color = BUBBLE_COLORS[task.priority];

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        {
          position: 'absolute',
          transform: [
            ...position.getTranslateTransform(),
            { scale: scaleAnim }
          ],
          opacity: opacityAnim,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
        }
      ]}
      className="justify-center items-center shadow-lg z-10"
    >
      <Text className="text-white text-md font-bold text-center p-2.5" numberOfLines={2}>
        {task.name}
      </Text>
    </Animated.View>
  );
} 