import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';
import { ColorSchemeName } from 'react-native';

export interface AppThemeColors {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  white: string;
  black: string;
  Grey: string;
  lightGrey: string;
  transparent: string;
  danger: string;
  textSubtle: string;
  surfaceElevated: string;
  surfaceBorder: string;
  tint: string;
  tintLight: string;
  tintDark: string;
  tabIconDefault: string;
  tabIconSelected: string;
  success: string;
  warning: string;
  info: string;
  separator: string;
  card: string;
  cardBorder: string;
  overlay: string;
  dangerLight: string;
}

export const LIGHT_COLORS: AppThemeColors = {
  primary: '#281C59',
  secondary: '#4E8D9C',
  tertiary: '#85C79A',
  quaternary: '#EDF7BD',
  background: '#F0F0F0',
  surface: '#FFFFFF',
  surfaceAlt: '#E7E7E7',
  border: '#D7D7D7',
  text: '#111111',
  textMuted: '#575757',
  white: '#FFFFFF',
  black: '#0A0A0A',
  Grey: '#8B8B8B',
  lightGrey: '#D7D7D7',
  transparent: 'transparent',
  danger: '#A41919',
  textSubtle: '#6B7280',
  surfaceElevated: '#F6F7F8',
  surfaceBorder: '#DADDE1',
  tint: '#2ECC71',
  tintLight: '#5EECA0',
  tintDark: '#1A8A46',
  tabIconDefault: '#7A8A80',
  tabIconSelected: '#2ECC71',
  success: '#2ECC71',
  warning: '#F39C12',
  info: '#3498DB',
  separator: '#E6E9EC',
  card: '#FFFFFF',
  cardBorder: '#E1E5E8',
  overlay: 'rgba(0,0,0,0.35)',
  dangerLight: '#C0392B',
};

export const DARK_COLORS: AppThemeColors = {
  primary: '#281C59',
  secondary: '#4E8D9C',
  tertiary: '#85C79A',
  quaternary: '#EDF7BD',
  background: '#050505',
  surface: '#111111',
  surfaceAlt: '#181818',
  border: '#2B2B2B',
  text: '#F6F6F6',
  textMuted: '#9B9B9B',
  white: '#FFFFFF',
  black: '#000000',
  Grey: '#8C8C8C',
  lightGrey: '#303030',
  transparent: 'transparent',
  danger: '#D04040',
  textSubtle: '#5C7265',
  surfaceElevated: '#161E18',
  surfaceBorder: '#1E2C22',
  tint: '#2ECC71',
  tintLight: '#5EECA0',
  tintDark: '#1A8A46',
  tabIconDefault: '#4A6054',
  tabIconSelected: '#2ECC71',
  success: '#2ECC71',
  warning: '#F39C12',
  info: '#3498DB',
  separator: '#131C15',
  card: '#101610',
  cardBorder: '#1A2A1C',
  overlay: 'rgba(0,0,0,0.75)',
  dangerLight: '#FF6B6B',
};

export type AppThemeColorKey = keyof AppThemeColors;

export const getAppColors = (colorScheme: ColorSchemeName): AppThemeColors => {
  return colorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
};

export const getNavigationTheme = (colorScheme: ColorSchemeName): Theme => {
  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = getAppColors(colorScheme);

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };
};
