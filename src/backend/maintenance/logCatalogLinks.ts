import skaftinClient from "@/backend/client/SkaftinClient";
import routes from "@/constants/ApiRoutes";

export type CatalogRow = { id: number; slug: string; name: string };

const CACHE_TTL_MS = 5 * 60 * 1000;

let serviceCatalogCache: { at: number; rows: CatalogRow[] } | null = null;
let repairCatalogCache: { at: number; rows: CatalogRow[] } | null = null;

function normalizeRows(raw: Record<string, any>[]): CatalogRow[] {
  return raw
    .map((r) => ({
      id: Number(r.id),
      slug: String(r.slug ?? "").trim(),
      name: String(r.name ?? "").trim(),
    }))
    .filter((r) => !Number.isNaN(r.id) && r.slug.length > 0);
}

/** One select for full service_items table; cached ~5 minutes. */
export async function fetchServiceCatalogRows(force = false): Promise<CatalogRow[]> {
  const now = Date.now();
  if (!force && serviceCatalogCache && now - serviceCatalogCache.at < CACHE_TTL_MS) {
    return serviceCatalogCache.rows;
  }
  const res = await skaftinClient.post<Record<string, any>[]>(routes.reference.serviceItems.list, {});
  const rows = normalizeRows(Array.isArray(res.data) ? res.data : []);
  serviceCatalogCache = { at: now, rows };
  return rows;
}

/** One select for full repair_items table; cached ~5 minutes. */
export async function fetchRepairCatalogRows(force = false): Promise<CatalogRow[]> {
  const now = Date.now();
  if (!force && repairCatalogCache && now - repairCatalogCache.at < CACHE_TTL_MS) {
    return repairCatalogCache.rows;
  }
  const res = await skaftinClient.post<Record<string, any>[]>(routes.reference.repairItems.list, {});
  const rows = normalizeRows(Array.isArray(res.data) ? res.data : []);
  repairCatalogCache = { at: now, rows };
  return rows;
}

export function rowsToSlugIdMap(rows: CatalogRow[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(r.slug, r.id);
  return m;
}

export function resolveIdsFromSlugs(slugs: string[], map: Map<string, number>): number[] {
  const uniq = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))];
  const ids: number[] = [];
  for (const s of uniq) {
    const id = map.get(s);
    if (id != null && !Number.isNaN(id)) ids.push(id);
  }
  return ids;
}

/** Delete all junction rows for this service log, then insert for resolved slugs. */
export async function syncServiceLogJunction(serviceLogId: number, slugs: string[]): Promise<void> {
  try {
    await skaftinClient.delete(routes.maintenance.serviceLogItems.delete, {
      where: { service_log_id: serviceLogId },
    });
  } catch {
    /* continue; inserts may still fail */
  }
  const rows = await fetchServiceCatalogRows();
  const map = rowsToSlugIdMap(rows);
  const ids = resolveIdsFromSlugs(slugs, map);
  await Promise.all(
    ids.map((service_item_id) =>
      skaftinClient
        .post(routes.maintenance.serviceLogItems.create, {
          data: { service_log_id: serviceLogId, service_item_id },
        })
        .catch(() => null)
    )
  );
}

/** Delete all junction rows for this repair log, then insert for resolved slugs. */
export async function syncRepairLogJunction(repairLogId: number, slugs: string[]): Promise<void> {
  try {
    await skaftinClient.delete(routes.maintenance.repairLogItems.delete, {
      where: { repair_log_id: repairLogId },
    });
  } catch {
    /* continue */
  }
  const rows = await fetchRepairCatalogRows();
  const map = rowsToSlugIdMap(rows);
  const ids = resolveIdsFromSlugs(slugs, map);
  await Promise.all(
    ids.map((repair_item_id) =>
      skaftinClient
        .post(routes.maintenance.repairLogItems.create, {
          data: { repair_log_id: repairLogId, repair_item_id },
        })
        .catch(() => null)
    )
  );
}
