import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native'
import React, { useEffect } from 'react'
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { PopUpStateStore } from '@/stores/StoresIndex';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';

const { height } = Dimensions.get('window');

const PopTab1 = () => {
  const { popTab1Active, setPopTab1Inactive } = PopUpStateStore();

  // Shared value for the popup position
  const popupPosition = useSharedValue(popTab1Active ? 0 : height);

  // Update popup position when active state changes
  useEffect(() => {
    popupPosition.value = withSpring(
      popTab1Active ? 0 : height,
      { damping: 20, stiffness: 50 }
    );
  }, [popTab1Active]);

  // Handle close when dragged down
  const handleClose = () => {
    setPopTab1Inactive();
  };

  // Pan gesture to handle dragging
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow dragging downward
      if (event.translationY > 0) {
        popupPosition.value = event.translationY;
      }
    })
    .onEnd((event) => {
      // If dragged down more than 100px, close the popup
      if (event.translationY > 100) {
        popupPosition.value = withTiming(height, { duration: 300 }, () => {
          runOnJS(handleClose)();
        });
      } else {
        // Otherwise, spring back to original position
        popupPosition.value = withSpring(0, { damping: 20, stiffness: 90 });
      }
    });

  // Animated style for the popup position
  const popupStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: popupPosition.value }]
    };
  });

  // Sample content items for scrolling
  const contentItems = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    description: `This is the description for item ${i + 1}. It contains some sample text to demonstrate scrolling within the popup.`
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, popupStyle]}>
        <View style={styles.header}>
          <Text style={styles.title}>Pop Tab 1 for the maps</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          overScrollMode="never"
          nestedScrollEnabled={true}
        >
          <Text style={styles.contentText}>
            This is a popup tab that slides up from the bottom of the screen.
            It can contain any content you want to display.
          </Text>

          <Text style={styles.sectionTitle}>Scrollable Content</Text>

          {contentItems.map(item => (
            <View key={item.id} style={styles.itemContainer}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
          ))}

          <Text style={styles.dragHint}>
            Drag down to dismiss
          </Text>
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  );
}

export default PopTab1

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height / 1.5,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  contentText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  itemContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  dragHint: {
    marginTop: 20,
    marginBottom: 30,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
})