import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, Text, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Task, BUBBLE_SIZES, BUBBLE_COLORS } from '~/lib/types';

interface TaskBubbleProps {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
  onPositionChange: (x: number, y: number) => void;
}

// Constants
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const LONG_PRESS_DURATION = 2000; // Full long press duration for popping (2 seconds)
const DRAG_THRESHOLD_DURATION = 350; // Increased from 250ms to make popping easier to trigger
const MOVEMENT_THRESHOLD = 15; // Increased from 5px to allow more movement before switching to drag
const INITIAL_VELOCITY = 0.5; // Initial low velocity
const DRAG_FRICTION = 0.95; // Friction applied after dragging (higher = less friction)
const NATURAL_FRICTION = 0.98; // Natural friction during regular movement
const COLLISION_BOUNCE = 0.8; // Bounce factor for collisions

export function TaskBubble({ task, onPress, onComplete, onPositionChange }: TaskBubbleProps) {
  // State and refs
  const [isPressing, setIsPressing] = useState(false);
  const [isPopping, setIsPopping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const size = BUBBLE_SIZES[task.priority];
  const color = BUBBLE_COLORS[task.priority];
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  // Position and movement tracking
  const screenCenterX = SCREEN_WIDTH / 2;
  const screenCenterY = SCREEN_HEIGHT / 2;
  const initialPosition = {
    x: screenCenterX - size / 2 + (Math.random() * 2 - 1) * 50,
    y: screenCenterY - size / 2 + (Math.random() * 2 - 1) * 50
  };
  
  const position = useRef(new Animated.ValueXY(initialPosition)).current;
  const velocity = useRef({
    x: (Math.random() * 2 - 1) * INITIAL_VELOCITY,
    y: (Math.random() * 2 - 1) * INITIAL_VELOCITY
  });
  
  // Interaction tracking
  const pressStartTime = useRef(0);
  const lastPosition = useRef({ x: 0, y: 0 });
  const lastGestureVelocity = useRef({ x: 0, y: 0 });
  const hasMovedSincePress = useRef(false);
  const pressTimer = useRef<NodeJS.Timeout>();
  const dragThresholdTimer = useRef<NodeJS.Timeout>();
  const hapticInterval = useRef<NodeJS.Timeout>();
  const animationFrameId = useRef<number>();
  
  // Position listener for tracking current position
  useEffect(() => {
    position.addListener((value) => {
      lastPosition.current = value;
      onPositionChange(value.x, value.y);
    });
    
    return () => {
      position.removeAllListeners();
      if (pressTimer.current) clearTimeout(pressTimer.current);
      if (dragThresholdTimer.current) clearTimeout(dragThresholdTimer.current);
      if (hapticInterval.current) clearTimeout(hapticInterval.current);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);
  
  // Start the animation loop when component mounts
  useEffect(() => {
    startAnimationLoop();
  }, []);
  
  // Haptic feedback for popping
  const startHapticFeedback = () => {
    // Initial haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    let interval = 500; // Start with 500ms interval
    const minInterval = 50; // Minimum interval between haptics
    const startTime = Date.now();
    
    const updateHaptics = () => {
      if (!isPressing || !isPopping) return;
      
      // Calculate how long we've been pressing
      const pressDuration = Date.now() - startTime;
      
      // Decrease interval based on press duration
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
  
  // Check for collisions with screen edges
  const checkCollisions = () => {
    let x = lastPosition.current.x;
    let y = lastPosition.current.y;
    let collided = false;
    
    // Screen edge collisions
    if (x <= 0) {
      velocity.current.x = Math.abs(velocity.current.x) * COLLISION_BOUNCE;
      x = 0;
      collided = true;
    } else if (x >= SCREEN_WIDTH - size) {
      velocity.current.x = -Math.abs(velocity.current.x) * COLLISION_BOUNCE;
      x = SCREEN_WIDTH - size;
      collided = true;
    }
    
    if (y <= 0) {
      velocity.current.y = Math.abs(velocity.current.y) * COLLISION_BOUNCE;
      y = 0;
      collided = true;
    } else if (y >= SCREEN_HEIGHT - size) {
      velocity.current.y = -Math.abs(velocity.current.y) * COLLISION_BOUNCE;
      y = SCREEN_HEIGHT - size;
      collided = true;
    }
    
    // Update position if collided
    if (collided) {
      position.setValue({ x, y });
    }
    
    return collided;
  };
  
  // Animation loop for bubble movement
  const startAnimationLoop = () => {
    const animate = () => {
      if (!isDragging) {
        // Apply friction to gradually slow down
        velocity.current.x *= isPopping ? 0.9 : NATURAL_FRICTION;
        velocity.current.y *= isPopping ? 0.9 : NATURAL_FRICTION;
        
        // Add a tiny bit of random movement when not interacting
        if (!isPressing && !isPopping) {
          velocity.current.x += (Math.random() * 0.1 - 0.05) * INITIAL_VELOCITY;
          velocity.current.y += (Math.random() * 0.1 - 0.05) * INITIAL_VELOCITY;
        }
        
        // Ensure velocity doesn't get too small (keeps some movement)
        const minVelocity = INITIAL_VELOCITY * 0.5;
        const currentSpeed = Math.sqrt(
          velocity.current.x * velocity.current.x + 
          velocity.current.y * velocity.current.y
        );
        
        if (currentSpeed < minVelocity && !isPopping) {
          const scale = minVelocity / (currentSpeed || 0.01); // Avoid division by zero
          velocity.current.x *= scale;
          velocity.current.y *= scale;
        }
        
        // Update position based on velocity
        const newX = lastPosition.current.x + velocity.current.x;
        const newY = lastPosition.current.y + velocity.current.y;
        position.setValue({ x: newX, y: newY });
        
        // Check for collisions
        checkCollisions();
      }
      
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  // Handle bubble popping
  const startPoppingProcess = () => {
    setIsPopping(true);
    
    // Start visual scaling animation with immediate feedback
    Animated.spring(scaleAnim, {
      toValue: 1.15,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
    // Start haptic feedback
    startHapticFeedback();
    
    // Set a timer for completion
    pressTimer.current = setTimeout(() => {
      // Final pop haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Pop animation
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.5,
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
        // Complete the task
        onComplete();
      });
    }, LONG_PRESS_DURATION);
  };
  
  // Cancel popping process properly
  const cancelPoppingProcess = () => {
    setIsPopping(false);
    stopHapticFeedback();
    
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = undefined;
    }
    
    // Reset scale with a springy animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  
  // Create pan responder for drag/press interactions
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
      onPanResponderGrant: () => {
        // Start pressing
        setIsPressing(true);
        pressStartTime.current = Date.now();
        hasMovedSincePress.current = false;
        
        // Immediate haptic feedback that touch was registered
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Set a timeout to determine if this is a drag or pop
        dragThresholdTimer.current = setTimeout(() => {
          if (!hasMovedSincePress.current && !isDragging) {
            // User held for threshold duration without moving = start popping
            startPoppingProcess();
          }
        }, DRAG_THRESHOLD_DURATION);
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy, moveX, moveY } = gestureState;
        
        // Track movement velocity for momentum
        lastGestureVelocity.current = {
          x: gestureState.vx,
          y: gestureState.vy
        };
        
        // Determine if user has moved significantly
        const movementDistance = Math.sqrt(dx * dx + dy * dy);
        if (movementDistance > MOVEMENT_THRESHOLD) {
          hasMovedSincePress.current = true;
          
          // If popping has started, cancel it
          if (isPopping) {
            cancelPoppingProcess();
          }
          
          // If not dragging yet, start dragging
          if (!isDragging) {
            setIsDragging(true);
            
            // Clear drag threshold timer
            if (dragThresholdTimer.current) {
              clearTimeout(dragThresholdTimer.current);
              dragThresholdTimer.current = undefined;
            }
          }
          
          // Position the bubble at touch point (centered on finger)
          const newX = moveX - size / 2;
          const newY = moveY - size / 2;
          
          // Keep bubble within screen bounds
          const boundedX = Math.max(0, Math.min(newX, SCREEN_WIDTH - size));
          const boundedY = Math.max(0, Math.min(newY, SCREEN_HEIGHT - size));
          
          position.setValue({ x: boundedX, y: boundedY });
        }
      },
      onPanResponderRelease: () => {
        // End pressing state
        setIsPressing(false);
        setIsDragging(false);
        
        // Clear timers
        if (dragThresholdTimer.current) {
          clearTimeout(dragThresholdTimer.current);
        }
        
        // If we were popping, cancel it
        if (isPopping) {
          // Cancel popping
          cancelPoppingProcess();
        } else {
          // Handle short tap (if it wasn't a drag)
          const pressDuration = Date.now() - pressStartTime.current;
          if (pressDuration < 200 && !hasMovedSincePress.current) {
            onPress();
          }
          
          // If was dragging, transfer gesture velocity to bubble
          if (hasMovedSincePress.current) {
            velocity.current = {
              x: lastGestureVelocity.current.x * 5, // Amplify gesture velocity
              y: lastGestureVelocity.current.y * 5
            };
          }
        }
      },
    })
  ).current;
  
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