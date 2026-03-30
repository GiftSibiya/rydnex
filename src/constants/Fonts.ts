// NOTE: The upstream project expects custom font assets under `assets/fonts/*`.
// Those assets aren't present in this checkout, so we use safe fallbacks to
// keep Expo Go functional.
export const FONT = {};

export const FONT_FAMILY = {
  // Fall back to system fonts if custom font files aren't bundled.
  poppinsRegular: 'System',
  nexaRegular: 'System',
  nexaBold: 'System',
};

export const FONT_SIZE = {
  extraSmall: 12,
  small: 14,
  medium: 16,
  large: 18,
  extraLarge: 28,
}