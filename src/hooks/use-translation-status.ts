import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type {
  TranslationContentType,
  TranslationJobStatus,
} from "@/lib/db/schema";

export type TranslationStatusMap = Record<
  string,
  Record<string, TranslationJobStatus>
>;

export type TranslationErrorMap = Record<string, Record<string, string | null>>;

interface UseTranslationStatusOptions {
  contentType: TranslationContentType;
  ids: string[];
  enabled?: boolean;
}

export function useTranslationStatus(options: UseTranslationStatusOptions) {
  const { contentType, ids, enabled = true } = options;
  const [statusMap, setStatusMap] = useState<TranslationStatusMap>({});
  const [errorMap, setErrorMap] = useState<TranslationErrorMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

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
          error_message: string | null;
        }>;
      };
      const nextStatus: TranslationStatusMap = {};
      const nextErrors: TranslationErrorMap = {};

      for (const job of data.jobs) {
        const byLocale = (nextStatus[job.content_id] ??= {});
        const byLocaleErr = (nextErrors[job.content_id] ??= {});
        if (!byLocale[job.target_locale]) {
          byLocale[job.target_locale] = job.status;
          byLocaleErr[job.target_locale] = job.error_message;
        }
      }

      setStatusMap(nextStatus);
      setErrorMap(nextErrors);
      setLastFetched(Date.now());
    } catch {
      // ignore polling errors
    } finally {
      setIsLoading(false);
    }
  }, [contentType, ids]);

  useEffect(() => {
    if (enabled && ids.length > 0) {
      fetchStatus();
    }
  }, [enabled, ids, fetchStatus]);

  const getStatus = useCallback(
    (id: string, locale: string): TranslationJobStatus | null => {
      return statusMap[id]?.[locale] ?? null;
    },
    [statusMap],
  );

  const getError = useCallback(
    (id: string, locale: string): string | null => {
      return errorMap[id]?.[locale] ?? null;
    },
    [errorMap],
  );

  return {
    statusMap,
    errorMap,
    getStatus,
    getError,
    isLoading,
    lastFetched,
    refetch: fetchStatus,
  };
}
