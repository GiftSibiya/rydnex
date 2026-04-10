import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";

import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import FuelPricesSync from "@/components/boot/FuelPricesSync";
import { VehicleProvider } from "@/contexts/VehicleContext";
import { AppThemeProvider, useAppTheme } from "@/themes/AppTheme";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoggedIn } = useAuth();
  const { colors } = useAppTheme();
  const router = useRouter();
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!isLoggedIn) {
      router.replace("/");
    }
  }, [isLoggedIn]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="register-otp" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="reminders" options={{ title: "Reminders" }} />
      <Stack.Screen name="service-details" options={{ title: "Service Details" }} />
      <Stack.Screen name="log/fuel" options={{ title: "Fuel Log", presentation: "modal" }} />
      <Stack.Screen name="log/service" options={{ title: "Service / Repair", presentation: "modal" }} />
      <Stack.Screen name="log/odometer" options={{ title: "Odometer", presentation: "modal" }} />
      <Stack.Screen name="log/subpages/logbook-item-page" options={{ headerShown: false }} />
      <Stack.Screen name="log/subpages/logbook-item-edit-page" options={{ headerShown: false }} />
      <Stack.Screen name="garage/vehicle-details-page" options={{ headerShown: false }} />
      <Stack.Screen name="garage/vehicle-edit-page" options={{ headerShown: false }} />
      <Stack.Screen name="account/editAccountScreen" options={{ title: "Edit Account", presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AppThemeProvider>
              <AuthProvider>
                <VehicleProvider>
                  <FuelPricesSync />
                  {Platform.OS === "web" ? (
                    <RootLayoutNav />
                  ) : (
                    <KeyboardProvider>
                      <RootLayoutNav />
                    </KeyboardProvider>
                  )}
                </VehicleProvider>
              </AuthProvider>
            </AppThemeProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

