import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/themes/AppTheme';
import { AuthStore } from '@/stores/StoresIndex';
import LoginScreen from '@/features/auth/screens/LoginScreen';
import RegistrationScreen from '@/features/auth/screens/RegistrationScreen';
import DashboardScreen from '@/features/home/screens/DashboardScreen';
import VehiclesScreen from '@/features/vehicles/screens/VehiclesScreen';
import MaintenanceScreen from '@/features/maintenance/screens/MaintenanceScreen';
import InsightsScreen from '@/features/efficiency/screens/InsightsScreen';
import RemindersScreen from '@/features/reminders/screens/RemindersScreen';
import LogbookScreen from '@/features/logbook/screens/LogbookScreen';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
import ToastPopUp from '@/components/popups/ToastPopUp';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegistrationScreen} />
  </AuthStack.Navigator>
);

const MainTabs = () => {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
            Dashboard: 'speed',
            Vehicles: 'directions-car',
            Maintenance: 'build',
            Insights: 'query-stats',
            Reminders: 'notifications-active',
            Logbook: 'menu-book',
            Profile: 'person',
          };
          return <MaterialIcons name={iconMap[route.name] ?? 'circle'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Vehicles" component={VehiclesScreen} />
      <Tab.Screen name="Maintenance" component={MaintenanceScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Reminders" component={RemindersScreen} />
      <Tab.Screen name="Logbook" component={LogbookScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  const { navigationTheme } = useAppTheme();
  const accessToken = AuthStore((state) => state.accessToken);

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {accessToken ? (
          <RootStack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <RootStack.Screen name="AuthNavigator" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
      <ToastPopUp />
    </NavigationContainer>
  );
};

export default RootNavigator;
