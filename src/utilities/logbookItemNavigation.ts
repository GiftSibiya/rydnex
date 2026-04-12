import type { FuelLog, OdometerLog, ServiceLog } from "@/contexts/VehicleContext";

export type LogBookListItem =
  | (ServiceLog & { _type: "service" })
  | (FuelLog & { _type: "fuel" })
  | (OdometerLog & { _type: "odometer" });

const LOGBOOK_ITEM_PATH = "/log/subpages/logbook-item-page" as const;

/**
 * Params for `logbook-item-page`. Pass to `router.push({ pathname, params })`.
 */
export function buildLogbookItemPageParams(
  item: LogBookListItem,
  options?: { readOnly?: boolean }
): Record<string, string> {
  const readOnly = options?.readOnly ? { readOnly: "1" } : {};
  if (item._type === "service") {
    return {
      _type: "service",
      id: item.id,
      date: item.date,
      type: item.type,
      description: item.description ?? "",
      cost: String(item.cost),
      odometer: String(item.odometer),
      ...(item.workshop ? { workshop: item.workshop } : {}),
      ...(item.notes ? { notes: item.notes } : {}),
      ...readOnly,
    };
  }
  if (item._type === "fuel") {
    return {
      _type: "fuel",
      id: item.id,
      date: item.date,
      liters: String(item.liters),
      costPerLiter: String(item.costPerLiter),
      totalCost: String(item.totalCost),
      odometer: String(item.odometer),
      fullTank: String(item.fullTank),
      ...readOnly,
    };
  }
  return {
    _type: "odometer",
    id: item.id,
    date: item.date,
    reading: String(item.reading),
    ...(item.note ? { note: item.note } : {}),
    ...readOnly,
  };
}

export function logbookItemPagePath(): typeof LOGBOOK_ITEM_PATH {
  return LOGBOOK_ITEM_PATH;
}
