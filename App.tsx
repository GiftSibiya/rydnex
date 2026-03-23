import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppThemeProvider } from '@/themes/AppTheme';
import RootNavigator from '@/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <RootNavigator />
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

