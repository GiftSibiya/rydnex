import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { Theme } from '@react-navigation/native';
import { AppThemeColors, getAppColors, getNavigationTheme, LIGHT_COLORS } from '@/themes/theme';
import ThemeStateStore, { resolveThemeScheme } from '@/stores/state/ThemeStateStore';

interface AppThemeContextValue {
  colorScheme: 'light' | 'dark';
  isDark: boolean;
  colors: AppThemeColors;
  navigationTheme: Theme;
}

const AppThemeContext = createContext<AppThemeContextValue>({
  colorScheme: 'light',
  isDark: false,
  colors: LIGHT_COLORS,
  navigationTheme: getNavigationTheme('light'),
});

const normalizeColorScheme = (scheme: ColorSchemeName): 'light' | 'dark' => {
  return scheme === 'dark' ? 'dark' : 'light';
};

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState(() => ThemeStateStore.getState().mode);
  const [deviceColorScheme, setDeviceColorScheme] = useState<'light' | 'dark'>(
    () => normalizeColorScheme(Appearance.getColorScheme())
  );

  useEffect(() => {
    const unsubscribe = ThemeStateStore.subscribe((state) => {
      setMode((prev) => (prev === state.mode ? prev : state.mode));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const nextScheme = normalizeColorScheme(colorScheme);
      setDeviceColorScheme((prev) => (prev === nextScheme ? prev : nextScheme));
    });
    return () => subscription.remove();
  }, []);

  const colorScheme = useMemo(
    () => resolveThemeScheme(mode, deviceColorScheme),
    [mode, deviceColorScheme]
  );

  const value = useMemo<AppThemeContextValue>(() => {
    const colors = getAppColors(colorScheme);

    return {
      colorScheme,
      isDark: colorScheme === 'dark',
      colors,
      navigationTheme: getNavigationTheme(colorScheme),
    };
  }, [colorScheme]);

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
};

export const useAppTheme = () => useContext(AppThemeContext);
