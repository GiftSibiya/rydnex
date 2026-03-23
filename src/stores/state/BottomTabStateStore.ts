import { create } from 'zustand';

interface BottomTabStateProps {
  bottomTabActiveState: boolean;
  BOTTOM_TAB_X_POSITION: number;
  toggleBottomTab: () => void;
  setBottomTabActive: () => void;
  setBottomTabInactive: () => void;
  SET_BOTTOM_TAB_POSITION: (position: number) => void;
}

const useBottomTabState = create<BottomTabStateProps>((set) => ({
  bottomTabActiveState: true,
  BOTTOM_TAB_X_POSITION: 0,
  SET_BOTTOM_TAB_POSITION: (position) => set({ BOTTOM_TAB_X_POSITION: position }),
  toggleBottomTab: () =>
    set((state) => ({
      bottomTabActiveState: !state.bottomTabActiveState,
    })),
  setBottomTabActive: () => set({ bottomTabActiveState: true }),
  setBottomTabInactive: () => set({ bottomTabActiveState: false }),
}));

export default useBottomTabState;