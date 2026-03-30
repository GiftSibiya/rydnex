import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { FONT_FAMILY } from '@/constants/Fonts';

type Props = {
  onDone: () => void;
};

const SplashScreen: React.FC<Props> = ({ onDone }) => {
  const [progressWidth, setProgressWidth] = useState(0);

  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.5);
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkY = useSharedValue(28);
  const taglineOpacity = useSharedValue(0);
  const stripesOpacity = useSharedValue(0);
  const stripesX = useSharedValue(20);
  const progressValue = useSharedValue(0);

  useEffect(() => {
    // Speed stripes enter
    stripesOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    stripesX.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });

    // Icon pulse in
    iconOpacity.value = withDelay(150, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    iconScale.value = withDelay(150, withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.4)) }));

    // Wordmark rises
    wordmarkOpacity.value = withDelay(280, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    wordmarkY.value = withDelay(280, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));

    // Tagline fades
    taglineOpacity.value = withDelay(560, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));

    // Progress bar fills
    progressValue.value = withDelay(300, withTiming(1, { duration: 1700, easing: Easing.out(Easing.quad) }));

    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const stripesStyle = useAnimatedStyle(() => ({
    opacity: stripesOpacity.value,
    transform: [{ translateX: stripesX.value }],
  }));

  const progressFillStyle = useAnimatedStyle(() => ({
    width: progressValue.value * progressWidth,
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#281C59" />

      {/* Decorative speed stripes — top right */}
      <Animated.View style={[styles.stripes, stripesStyle]}>
        <View style={[styles.stripe, styles.stripe1]} />
        <View style={[styles.stripe, styles.stripe2]} />
        <View style={[styles.stripe, styles.stripe3]} />
      </Animated.View>

      {/* Decorative speed stripes — bottom left */}
      <Animated.View style={[styles.stripesBottomLeft, stripesStyle]}>
        <View style={[styles.stripe, styles.stripe3]} />
        <View style={[styles.stripe, styles.stripe2]} />
        <View style={[styles.stripe, styles.stripe1]} />
      </Animated.View>

      {/* Center brand */}
      <View style={styles.center}>
        <Animated.View style={iconStyle}>
          <MaterialIcons name="speed" size={48} color="#EDF7BD" style={styles.icon} />
        </Animated.View>

        <Animated.Text style={[styles.wordmark, wordmarkStyle]}>
          rydnex
        </Animated.Text>

        <Animated.View style={[styles.taglineRow, taglineStyle]}>
          <View style={styles.dot} />
          <Text style={styles.tagline}>VEHICLE INTELLIGENCE</Text>
          <View style={styles.dot} />
        </Animated.View>
      </View>

      {/* Progress bar */}
      <View
        style={styles.progressTrack}
        onLayout={(e) => setProgressWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.progressFill, progressFillStyle]} />
      </View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#281C59',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Speed stripe decorations
  stripes: {
    position: 'absolute',
    top: 72,
    right: 28,
    transform: [{ rotate: '-28deg' }],
    gap: 8,
    alignItems: 'flex-end',
  },
  stripesBottomLeft: {
    position: 'absolute',
    bottom: 64,
    left: 28,
    transform: [{ rotate: '-28deg' }],
    gap: 8,
    alignItems: 'flex-start',
  },
  stripe: {
    height: 1.5,
    backgroundColor: '#EDF7BD',
    opacity: 0.12,
  },
  stripe1: { width: 72 },
  stripe2: { width: 52 },
  stripe3: { width: 36 },

  // Brand center
  center: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 12,
    opacity: 0.88,
  },
  wordmark: {
    fontFamily: FONT_FAMILY.nexaBold,
    fontSize: 66,
    color: '#EDF7BD',
    letterSpacing: 3,
    lineHeight: 74,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#85C79A',
  },
  tagline: {
    fontFamily: FONT_FAMILY.poppinsRegular,
    fontSize: 10,
    color: '#4E8D9C',
    letterSpacing: 4.5,
  },

  // Progress bar
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#3D2E7A',
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    backgroundColor: '#85C79A',
  },
});
