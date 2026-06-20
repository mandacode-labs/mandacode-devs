import { getTranslationJobsByContents } from "@/lib/db/translation-jobs";
import type {
  TranslationContentType,
  TranslationJobStatus,
} from "@/lib/db/schema";

export async function buildTranslationStatusMap(
  contentType: TranslationContentType,
  ids: string[],
): Promise<Map<string, Map<string, TranslationJobStatus>>> {
  if (ids.length === 0) {
    return new Map();
  }

  const jobs = await getTranslationJobsByContents(contentType, ids);
  const map = new Map<string, Map<string, TranslationJobStatus>>();

  for (const job of jobs) {
    let localeMap = map.get(job.content_id);
    if (!localeMap) {
      localeMap = new Map<string, TranslationJobStatus>();
      map.set(job.content_id, localeMap);
    }
    if (!localeMap.has(job.target_locale)) {
      localeMap.set(job.target_locale, job.status);
    }
  }

  return map;
}
