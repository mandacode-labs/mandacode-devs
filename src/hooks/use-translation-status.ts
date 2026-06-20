import { useCallback, useEffect, useState } from "react";
import type {
  TranslationContentType,
  TranslationJobStatus,
} from "@/lib/db/schema";

export type TranslationStatusMap = Record<
  string,
  Record<string, TranslationJobStatus>
>;

interface UseTranslationStatusOptions {
  contentType: TranslationContentType;
  ids: string[];
  enabled?: boolean;
  interval?: number;
}

export function useTranslationStatus(options: UseTranslationStatusOptions) {
  const { contentType, ids, enabled = true, interval = 5000 } = options;
  const [statusMap, setStatusMap] = useState<TranslationStatusMap>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (ids.length === 0) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("content_type", contentType);
      for (const id of ids) {
        params.append("content_id", id);
      }

      const response = await fetch(
        `/api/admin/translations?${params.toString()}`,
      );
      if (!response.ok) return;

      const data = (await response.json()) as {
        jobs: Array<{
          content_id: string;
          target_locale: string;
          status: TranslationJobStatus;
        }>;
      };
      const next: TranslationStatusMap = {};

      for (const job of data.jobs) {
        const byLocale = (next[job.content_id] ??= {});
        if (!byLocale[job.target_locale]) {
          byLocale[job.target_locale] = job.status;
        }
      }

      setStatusMap(next);
    } catch {
      // ignore polling errors
    } finally {
      setIsLoading(false);
    }
  }, [contentType, ids]);

  useEffect(() => {
    if (!enabled || ids.length === 0) return;

    fetchStatus();
    const timer = setInterval(fetchStatus, interval);
    return () => clearInterval(timer);
  }, [enabled, ids, interval, fetchStatus]);

  const getStatus = useCallback(
    (id: string, locale: string): TranslationJobStatus | null => {
      return statusMap[id]?.[locale] ?? null;
    },
    [statusMap],
  );

  return { statusMap, getStatus, isLoading, refetch: fetchStatus };
}
