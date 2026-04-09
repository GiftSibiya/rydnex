import skaftinClient from '@/backend/client/SkaftinClient';
import routes from '@/constants/ApiRoutes';

/** v1: all users use inland reference prices. */
export const FUEL_PRICES_INLAND_REGION = 'inland' as const;

/** Until vehicles store fuel type, fuel log cost/L defaults from this key in `pricesByFuelType`. */
export const DEFAULT_FUEL_TYPE_FOR_COST_HINT = 'petrol_95' as const;

export type FuelPriceRow = {
  id: number;
  effective_date: string;
  region: string;
  fuel_type: string;
  price: number;
};

export function latestInlandPricesFromRows(rows: FuelPriceRow[]): {
  effectiveDate: string | null;
  pricesByFuelType: Record<string, number>;
} {
  const inland = rows.filter((r) => r.region === FUEL_PRICES_INLAND_REGION);
  if (inland.length === 0) return { effectiveDate: null, pricesByFuelType: {} };

  let maxD = '';
  for (const r of inland) {
    const d = String(r.effective_date).slice(0, 10);
    if (d > maxD) maxD = d;
  }

  const pricesByFuelType: Record<string, number> = {};
  for (const r of inland) {
    if (String(r.effective_date).slice(0, 10) !== maxD) continue;
    pricesByFuelType[r.fuel_type] = Number(r.price);
  }

  return { effectiveDate: maxD, pricesByFuelType };
}

export async function fetchInlandFuelPriceRows(): Promise<FuelPriceRow[]> {
  const res = await skaftinClient.post<Record<string, unknown>[]>(
    routes.reference.fuelPrices.list,
    { where: { region: FUEL_PRICES_INLAND_REGION } }
  );
  const data = Array.isArray(res.data) ? res.data : [];
  return data.map((row) => ({
    id: Number(row.id),
    effective_date: String(row.effective_date ?? ''),
    region: String(row.region ?? ''),
    fuel_type: String(row.fuel_type ?? ''),
    price: Number(row.price ?? 0),
  }));
}
