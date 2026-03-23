import { StyleSheet } from 'react-native';
import { FONT_FAMILY, FONT_SIZE } from '@/constants/Fonts';

export const GlobalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontFamily: FONT_FAMILY.nexaBold,
    fontSize: FONT_SIZE.extraLarge,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontFamily: FONT_FAMILY.poppinsRegular,
    fontSize: FONT_SIZE.small,
    opacity: 0.8,
    marginTop: 6,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
});
