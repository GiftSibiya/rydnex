import { useEffect } from 'react';
import useFuelPricesStore from '@/stores/data/FuelPricesStore';
import useAuthStore from '@/stores/data/AuthStore';

/** Loads inland fuel prices when the user session is active (same behaviour as the former FuelPricesProvider). */
export default function FuelPricesSync() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const sync = useFuelPricesStore((s) => s.sync);

  useEffect(() => {
    void sync();
  }, [accessToken, sync]);

  return null;
}
