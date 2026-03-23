import { create } from 'zustand';

export interface PopupStateProps {
  // Popup active states
  popTab1Active: boolean;
  popTab2Active: boolean;
  popTab3Active: boolean;
  locationBottomTabActive: boolean;

  // Popup position states (for future use with different popup positions)
  popTab1Position: number;
  popTab2Position: number;
  popTab3Position: number;
  locationBottomTabPosition: number;
  // Actions
  setPopTab1Active: () => void;
  setPopTab1Inactive: () => void;
  setPopTab2Active: () => void;
  setPopTab2Inactive: () => void;
  setPopTab3Active: () => void;
  setPopTab3Inactive: () => void;
  setLocationBottomTabActive: () => void;
  setLocationBottomTabInactive: () => void;

  // Position setters (for future use)
  setPopTab1Position: (position: number) => void;
  setPopTab2Position: (position: number) => void;
  setPopTab3Position: (position: number) => void;
  setLocationBottomTabPosition: (position: number) => void;
}

const usePopupState = create<PopupStateProps>((set) => ({
  popTab1Active: false,
  popTab2Active: false,
  popTab3Active: false,
  locationBottomTabActive: false,
  popTab1Position: 0,
  popTab2Position: 0,
  popTab3Position: 0,
  locationBottomTabPosition: 0,
  setPopTab1Active: () => set({ popTab1Active: true }),
  setPopTab1Inactive: () => set({ popTab1Active: false }),
  setPopTab2Active: () => set({ popTab2Active: true }),
  setPopTab2Inactive: () => set({ popTab2Active: false }),
  setPopTab3Active: () => set({ popTab3Active: true }),
  setPopTab3Inactive: () => set({ popTab3Active: false }),
  setLocationBottomTabActive: () => set({ locationBottomTabActive: true }),
  setLocationBottomTabInactive: () => set({ locationBottomTabActive: false }),
  setPopTab1Position: (position) => set({ popTab1Position: position }),
  setPopTab2Position: (position) => set({ popTab2Position: position }),
  setPopTab3Position: (position) => set({ popTab3Position: position }),
  setLocationBottomTabPosition: (position) => set({ locationBottomTabPosition: position }),
}));

export default usePopupState;