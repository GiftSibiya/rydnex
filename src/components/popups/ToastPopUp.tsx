import { StyleSheet, Text, View, TouchableOpacity, Dimensions, StatusBar, Platform } from 'react-native'
import React, { useEffect } from 'react'
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ToastStateStore } from '@/stores/StoresIndex';

const { width, height } = Dimensions.get('window');

// Get status bar height
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

const ToastPopUp = () => {
  const { toast, hideToast } = ToastStateStore();

  // Shared value for the toast position
  const toastPosition = useSharedValue(-100);

  // Update toast position when visibility changes
  useEffect(() => {
    if (toast.visible) {
      // Show toast
      toastPosition.value = withSpring(0, {
        damping: 15,
        stiffness: 100
      });

      // After 2 seconds, animate upwards before hiding
      const timer = setTimeout(() => {
        // Animate upwards
        toastPosition.value = withTiming(-100, {
          duration: 500
        }, () => {
          // After animation completes, hide the toast
          runOnJS(hideToast)();
        });
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // Hide toast
      toastPosition.value = withTiming(-100, {
        duration: 300
      });
    }
  }, [toast.visible]);

  // Pan gesture to handle manual dismissal
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow dragging upward
      if (event.translationY < 0) {
        toastPosition.value = event.translationY;
      }
    })
    .onEnd((event) => {
      // If dragged up more than 50px, hide the toast
      if (event.translationY < -50) {
        toastPosition.value = withTiming(-100, { duration: 300 }, () => {
          runOnJS(hideToast)();
        });
      } else {
        // Otherwise, spring back to original position
        toastPosition.value = withSpring(0, { damping: 15, stiffness: 100 });
      }
    });

  // Animated style for the toast position
  const toastStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: toastPosition.value }]
    };
  });

  // Get background color based on toast type
  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return '#34C759';
      case 'error':
        return '#FF3B30';
      case 'warning':
        return '#FF9500';
      case 'info':
      default:
        return '#007AFF';
    }
  };

  // Get icon based on toast type
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  if (!toast.visible) return null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          toastStyle,
          { backgroundColor: getBackgroundColor() }
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getIcon()}</Text>
        </View>
        <Text style={styles.message}>{toast.message}</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideToast}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

export default ToastPopUp

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    marginTop: STATUS_BAR_HEIGHT + 10,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 3000,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  icon: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})