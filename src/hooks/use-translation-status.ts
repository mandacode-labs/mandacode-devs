import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type {
  TranslationContentType,
  TranslationJob,
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

export interface WatchedJob extends TranslationJob {
  status: TranslationJobStatus;
  target_locale: string;
  error_message: string | null;
}

interface UseWatchTranslationJobsOptions {
  contentType: TranslationContentType;
  contentId: string;
  jobIds: string[];
  interval?: number;
  timeoutMs?: number;
}

export function useWatchTranslationJobs(
  options: UseWatchTranslationJobsOptions,
) {
  const {
    contentType,
    contentId,
    jobIds,
    interval = 2000,
    timeoutMs = 90_000,
  } = options;

  const [jobs, setJobs] = useState<WatchedJob[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  const poll = useCallback(async () => {
    if (jobIds.length === 0) return [];
    const params = new URLSearchParams();
    params.set("content_type", contentType);
    params.append("content_id", contentId);
    const data = await apiFetch<{ jobs: WatchedJob[] }>(
      `/api/admin/translations?${params.toString()}`,
    );
    const byId = new Map(data.jobs.map((j) => [j.id, j]));
    return jobIds
      .map((id) => byId.get(id))
      .filter((j): j is WatchedJob => j !== undefined);
  }, [contentType, contentId, jobIds]);

  useEffect(() => {
    if (jobIds.length === 0) {
      setJobs([]);
      setIsPolling(false);
      return;
    }
    setIsPolling(true);
    let cancelled = false;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return;
      try {
        const current = await poll();
        if (cancelled) return;
        setJobs(current);
        const allFound = current.length === jobIds.length;
        const allDone =
          allFound &&
          current.every(
            (j) => j.status === "completed" || j.status === "failed",
          );
        const timedOut = Date.now() - startedAt > timeoutMs;
        if (allDone || timedOut) {
          setIsPolling(false);
          return;
        }
      } catch {
        // ignore
      }
      setTimeout(tick, interval);
    };
    tick();

    return () => {
      cancelled = true;
      setIsPolling(false);
    };
  }, [jobIds, interval, timeoutMs, poll]);

  return { jobs, isPolling };
}
