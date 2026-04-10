import { create } from "zustand";

export type ThemeMode = "system" | "light" | "dark";
export type ThemeColorScheme = "light" | "dark";

export interface ThemeState {
  /** User preference: follow OS, or force light/dark */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeStateStore = create<ThemeState>((set) => ({
  mode: "system",
  setMode: (mode) => set({ mode }),
}));

/** Resolve which palette to use (no store subscription — use with `useColorScheme` in UI). */
export function resolveThemeScheme(
  mode: ThemeMode,
  deviceScheme: ThemeColorScheme
): ThemeColorScheme {
  return mode === "system" ? deviceScheme : mode;
}

export default ThemeStateStore;
