import { useMemo } from "react";
import { useTranslationStatus } from "@/hooks/use-translation-status";
import type {
  TranslationContentType,
  TranslationJobStatus,
  PublishStatus,
} from "@/lib/db/schema";

export type ChipTone =
  | "no-translation"
  | "translating"
  | "translated-draft"
  | "translated-published"
  | "archived"
  | "original-draft"
  | "original-published"
  | "original-archived";

export interface LocaleInfo {
  locale: string;
  href: string;
  active: boolean;
  title: string;
  publishStatus?: PublishStatus | null;
  isOutdated?: boolean;
}

interface AdminLocaleChipsProps {
  contentType: TranslationContentType;
  contentId: string;
  originalLocale: string;
  locales: LocaleInfo[];
}

const baseChipClass =
  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide border";

const toneClass: Record<ChipTone, string> = {
  "no-translation": "bg-bg-secondary text-text-secondary border-border",
  translating: "bg-red-50 text-red-700 border-red-200",
  "translated-draft": "bg-orange-50 text-orange-700 border-orange-200",
  "translated-published": "bg-green-50 text-green-700 border-green-200",
  archived: "bg-blue-50 text-blue-700 border-blue-200",
  "original-draft": "bg-orange-50 text-orange-700 border-orange-200",
  "original-published": "bg-green-50 text-green-700 border-green-200",
  "original-archived": "bg-blue-50 text-blue-700 border-blue-200",
};

const outdatedRingClass =
  "ring-2 ring-orange-400 ring-offset-1 ring-offset-bg-primary";

export function getChipTone(
  locale: string,
  originalLocale: string,
  publishStatus: PublishStatus | null | undefined,
  jobStatus: TranslationJobStatus | null,
  hasTranslation: boolean,
): ChipTone {
  if (jobStatus === "pending" || jobStatus === "running") {
    return "translating";
  }
  if (jobStatus === "failed") {
    return "translating";
  }

  const isOriginal = locale === originalLocale;
  if (isOriginal) {
    if (publishStatus === "archived") return "original-archived";
    if (publishStatus === "draft") return "original-draft";
    return "original-published";
  }

  if (!hasTranslation) return "no-translation";
  if (publishStatus === "archived") return "archived";
  if (publishStatus === "published") return "translated-published";
  return "translated-draft";
}

function getChipTooltip(
  locale: string,
  originalLocale: string,
  tone: ChipTone,
  jobStatus: TranslationJobStatus | null,
  isOutdated: boolean,
  labels: Record<string, string>,
): string {
  const base = labels[tone] ?? tone;
  const parts: string[] = [base];
  if (locale === originalLocale) parts.push("원본");
  if (jobStatus) parts.push(`job: ${jobStatus}`);
  if (isOutdated) parts.push(labels["admin.outdatedTranslation"] ?? "outdated");
  return parts.join(" · ");
}

export function AdminLocaleChips({
  contentType,
  contentId,
  originalLocale,
  locales,
}: AdminLocaleChipsProps) {
  const ids = useMemo(() => [contentId], [contentId]);
  const { getStatus } = useTranslationStatus({
    contentType,
    ids,
    interval: 5000,
  });

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {locales.map(
        ({ locale, href, active, title, publishStatus, isOutdated }) => {
          const status = getStatus(contentId, locale);
          const hasTranslation =
            publishStatus !== null && publishStatus !== undefined;
          const tone = getChipTone(
            locale,
            originalLocale,
            publishStatus,
            status,
            hasTranslation,
          );
          const clickable = active || hasTranslation || !!status;
          const labels: Record<string, string> = {
            "no-translation": "번역 없음",
            translating: "번역 중",
            "translated-draft": "번역됨 (게시 안 됨)",
            "translated-published": "번역됨 (게시됨)",
            archived: "보관됨",
            "original-draft": "원본 (게시 안 됨)",
            "original-published": "원본 (게시됨)",
            "original-archived": "원본 (보관됨)",
            "admin.outdatedTranslation": "원본 변경됨",
          };
          const tooltip = getChipTooltip(
            locale,
            originalLocale,
            tone,
            status,
            !!isOutdated,
            labels,
          );
          const chipClass = `${baseChipClass} ${toneClass[tone]} ${
            isOutdated ? outdatedRingClass : ""
          } ${!clickable ? "opacity-60" : ""}`;

          const chip = (
            <span className={chipClass} title={tooltip}>
              {locale}
            </span>
          );

          if (!clickable) {
            return (
              <span key={locale} className="inline-flex items-center">
                {chip}
              </span>
            );
          }

          return (
            <a
              key={locale}
              href={href}
              className="inline-flex items-center"
              title={tooltip}
            >
              {chip}
            </a>
          );
        },
      )}
    </div>
  );
}
