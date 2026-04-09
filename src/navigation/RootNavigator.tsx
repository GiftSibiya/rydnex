import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/themes/AppTheme';
import { AuthStore } from '@/stores/StoresIndex';

// Auth Screens
import SplashScreen from '@/app/auth/SplashScreen';
import LoginScreen from '@/app/auth/login-screen';
import RegistrationScreen from '@/app/auth/register-screen';
import RegistrationOtpScreen from '@/app/auth/register-otp-screen';
import ForgotPasswordScreen from '@/app/auth/forgot-password-otp-screen';

//
import DashboardScreen from '@/features/home/screens/DashboardScreen';
import VehiclesScreen from '@/features/vehicles/screens/VehiclesScreen';
import MaintenanceScreen from '@/features/maintenance/screens/MaintenanceScreen';
import InsightsScreen from '@/features/efficiency/screens/InsightsScreen';
import LogbookScreen from '@/features/logbook/screens/LogbookScreen';
import ProfileScreen from '@/features/profile/screens/ProfileScreen';
import RemindersScreen from '@/features/reminders/screens/RemindersScreen';
import ToastPopUp from '@/components/popups/ToastPopUp';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegistrationScreen} />
    <AuthStack.Screen name="RegistrationOtp" component={RegistrationOtpScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
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
      <Tab.Screen name="Logbook" component={LogbookScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  const { navigationTheme } = useAppTheme();
  const accessToken = AuthStore((state) => state.accessToken);
  const [splashDone, setSplashDone] = useState(false);

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!splashDone ? (
          <RootStack.Screen name="Splash">
            {() => <SplashScreen onDone={() => setSplashDone(true)} />}
          </RootStack.Screen>
        ) : accessToken ? (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabs} />
            <RootStack.Screen name="Reminders" component={RemindersScreen} />
          </>
        ) : (
          <RootStack.Screen name="AuthNavigator" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
      <ToastPopUp />
    </NavigationContainer>
  );
};

export default RootNavigator;
