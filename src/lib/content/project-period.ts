import { formatMonthYear } from "@/lib/utils/date";
import type { Language } from "@/lib/config/languages";

export function formatProjectPeriod(
  project: { startDate: string | null; endDate: string | null },
  lang: Language = "ko",
): string {
  const { startDate, endDate } = project;
  const start = formatMonthYear(startDate, lang);
  const end = formatMonthYear(endDate, lang);
  if (start !== "-" && end !== "-") return `${start} ~ ${end}`;
  if (start !== "-") return `${start} ~`;
  if (end !== "-") return `~ ${end}`;
  return "-";
}
