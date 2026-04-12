import { useEffect, useState } from "react";
import skaftinClient from "@/backend/client/SkaftinClient";
import { fetchRepairCatalogRows, fetchServiceCatalogRows } from "@/backend/maintenance/logCatalogLinks";
import routes from "@/constants/ApiRoutes";

export type LogLinkKind = "service" | "repair";

export type UseLogLinkedItemsResult = {
  linkedSlugs: string[];
  linkedNames: string[];
  loading: boolean;
  error: boolean;
};

function parseDbId(rawLogId: string | undefined): number | null {
  if (!rawLogId) return null;
  const n =
    rawLogId.startsWith("s-") || rawLogId.startsWith("r-")
      ? Number(rawLogId.slice(2))
      : Number(rawLogId);
  return !n || Number.isNaN(n) ? null : n;
}

/**
 * Loads junction rows for a service or repair log and resolves linked catalog slugs/names
 * (one catalog fetch via cache + one links select).
 */
export function useLogLinkedItems(
  rawLogId: string | undefined,
  kind: LogLinkKind
): UseLogLinkedItemsResult {
  const [linkedSlugs, setLinkedSlugs] = useState<string[]>([]);
  const [linkedNames, setLinkedNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const dbId = parseDbId(rawLogId);
    if (dbId == null) {
      setLinkedSlugs([]);
      setLinkedNames([]);
      setError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const isRepair = kind === "repair";
        const linksRoute = isRepair
          ? routes.maintenance.repairLogItems.list
          : routes.maintenance.serviceLogItems.list;
        const linksWhere = isRepair ? { repair_log_id: dbId } : { service_log_id: dbId };
        const itemIdKey = isRepair ? "repair_item_id" : "service_item_id";

        const catalogRows = isRepair ? await fetchRepairCatalogRows() : await fetchServiceCatalogRows();
        const linksRes = await skaftinClient.post<Record<string, any>[]>(linksRoute, {
          where: linksWhere,
        });
        if (cancelled) return;

        const links = Array.isArray(linksRes.data) ? linksRes.data : [];
        const itemIds = new Set(
          links.map((l) => Number(l[itemIdKey])).filter((id) => !Number.isNaN(id))
        );
        const matched = catalogRows.filter((r) => itemIds.has(Number(r.id)));
        setLinkedSlugs(matched.map((r) => r.slug));
        setLinkedNames(matched.map((r) => r.name));
      } catch {
        if (!cancelled) {
          setError(true);
          setLinkedSlugs([]);
          setLinkedNames([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawLogId, kind]);

  return { linkedSlugs, linkedNames, loading, error };
}
