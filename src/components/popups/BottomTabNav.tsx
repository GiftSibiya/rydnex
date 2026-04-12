import React, { useState, useEffect, useMemo } from 'react'
import { Feather } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { StyleSheet, TouchableOpacity, View, Dimensions, Text } from 'react-native'
import Animated, {
  useAnimatedStyle, withSpring, useSharedValue, withTiming,
} from 'react-native-reanimated'
import { BottomTabStateStore } from '@/stores/StoresIndex'
import { useAppTheme } from '@/themes/AppTheme'
import { AppThemeColors } from '@/themes/theme'

const { width: screenWidth, height } = Dimensions.get('window')

// Indicator width: container width minus horizontal margins (20 each side), divided by tab count
const CONTAINER_WIDTH = screenWidth - 40
const TAB_COUNT = 2
const PILL_WIDTH = CONTAINER_WIDTH / TAB_COUNT - 12

const BottomTabNav = () => {
  const navigation: any = useNavigation()
  const { colors } = useAppTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const [activeTab, setActiveTab] = useState(0)
  const { bottomTabActiveState } = BottomTabStateStore()

  // Slide the container in/out from below
  const tabBarPosition = useSharedValue(bottomTabActiveState ? 0 : height)

  // Sliding pill indicator: starts at tab 0
  const indicatorX = useSharedValue(6)

  // Scale values for press feedback
  const scaleValues = [useSharedValue(1), useSharedValue(1)]

  useEffect(() => {
    tabBarPosition.value = withSpring(
      bottomTabActiveState ? 0 : height,
      { damping: 20, stiffness: 90 }
    )
  }, [bottomTabActiveState])

  const tabs = [
    { name: 'Home', icon: 'home' as const, component: 'Home' },
    { name: 'Account', icon: 'user' as const, component: 'Account' },
  ]

  const handleTabPress = (index: number, route: string) => {
    // Press bounce
    scaleValues[index].value = withTiming(0.85, { duration: 80 }, () => {
      scaleValues[index].value = withSpring(1, { damping: 15, stiffness: 200 })
    })

    // Slide indicator
    const targetX = index * (CONTAINER_WIDTH / TAB_COUNT) + 6
    indicatorX.value = withSpring(targetX, { damping: 20, stiffness: 120 })

    setActiveTab(index)
    navigation.navigate('MainStack', { screen: route })
  }

  const tabBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tabBarPosition.value }],
  }))

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }))

  return (
    <Animated.View style={[styles.container, tabBarStyle]}>

      {/* Sliding pill indicator */}
      <Animated.View style={[styles.activePill, { backgroundColor: colors.primary + '20' }, indicatorStyle]} />

      {tabs.map((tab, index) => {
        const isActive = activeTab === index
        const scale = scaleValues[index]

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => handleTabPress(index, tab.component)}
            activeOpacity={1}
          >
            <Animated.View
              style={[styles.tabInner, useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))]}
            >
              <View style={[
                styles.iconWrapper,
                isActive && { backgroundColor: colors.primary + '15' },
              ]}>
                <Feather
                  name={tab.icon}
                  size={20}
                  color={isActive ? colors.primary : colors.textMuted}
                />
              </View>
              <Text style={[
                styles.label,
                { color: isActive ? colors.primary : colors.textMuted },
                isActive && styles.labelActive,
              ]}>
                {tab.name}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        )
      })}
    </Animated.View>
  )
}

export default BottomTabNav

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    height: 68,
    backgroundColor: colors.surface,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  // Sliding background pill
  activePill: {
    position: 'absolute',
    top: 8,
    left: 0,
    width: PILL_WIDTH,
    height: 52,
    borderRadius: 14,
  },

  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    gap: 3,
  },
  iconWrapper: {
    width: 36,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  labelActive: {
    fontWeight: '700',
  },
})
