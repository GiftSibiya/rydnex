import React, { createContext, useContext, useMemo } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';
import { Theme } from '@react-navigation/native';
import { AppThemeColors, getAppColors, getNavigationTheme, LIGHT_COLORS } from '@/themes/theme';

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
  const deviceColorScheme = useColorScheme();
  const colorScheme = normalizeColorScheme(deviceColorScheme);

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
