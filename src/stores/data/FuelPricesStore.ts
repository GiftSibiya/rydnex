import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  DEFAULT_FUEL_TYPE_FOR_COST_HINT,
  fetchInlandFuelPriceRows,
  latestInlandPricesFromRows,
} from '@/services/fuelPricesService';
import useAuthStore from '@/stores/data/AuthStore';

const CACHE_KEY = 'rydnex_fuel_prices_cache';

type CachedPayload = { effectiveDate: string; pricesByFuelType: Record<string, number> };

export interface FuelPricesStoreState {
  effectiveDate: string | null;
  pricesByFuelType: Record<string, number>;
  loading: boolean;
  /** Hydrate from cache, then API, when the user has a session. Clears state when logged out. */
  sync: () => Promise<void>;
  reset: () => void;
}

export const selectDefaultCostPerLiter = (s: FuelPricesStoreState): number | null => {
  const p = s.pricesByFuelType[DEFAULT_FUEL_TYPE_FOR_COST_HINT];
  return p != null && p > 0 ? p : null;
};

const useFuelPricesStore = create<FuelPricesStoreState>((set, get) => ({
  effectiveDate: null,
  pricesByFuelType: {},
  loading: false,

  reset: () => set({ effectiveDate: null, pricesByFuelType: {}, loading: false }),

  sync: async () => {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      get().reset();
      return;
    }

    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CachedPayload>;
        if (parsed.pricesByFuelType && Object.keys(parsed.pricesByFuelType).length > 0) {
          set({
            effectiveDate: parsed.effectiveDate ?? null,
            pricesByFuelType: parsed.pricesByFuelType,
          });
        }
      }
    } catch {
      /* ignore */
    }

    set({ loading: true });
    try {
      const rows = await fetchInlandFuelPriceRows();
      const { effectiveDate: ed, pricesByFuelType: map } = latestInlandPricesFromRows(rows);
      set({ effectiveDate: ed, pricesByFuelType: map, loading: false });
      if (ed && Object.keys(map).length > 0) {
        const payload: CachedPayload = { effectiveDate: ed, pricesByFuelType: map };
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      }
    } catch {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<CachedPayload>;
          if (parsed.effectiveDate && parsed.pricesByFuelType) {
            set({
              effectiveDate: parsed.effectiveDate,
              pricesByFuelType: parsed.pricesByFuelType,
              loading: false,
            });
          } else {
            set({ loading: false });
          }
        } else {
          set({ loading: false });
        }
      } catch {
        set({ loading: false });
      }
    }
  },
}));

export default useFuelPricesStore;
