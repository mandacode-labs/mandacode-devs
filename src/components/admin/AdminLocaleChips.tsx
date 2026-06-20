import { useMemo } from "react";
import { useTranslationStatus } from "@/hooks/use-translation-status";
import type {
  TranslationContentType,
  TranslationJobStatus,
} from "@/lib/db/schema";

interface LocaleInfo {
  locale: string;
  href: string;
  active: boolean;
  title: string;
}

interface AdminLocaleChipsProps {
  contentType: TranslationContentType;
  contentId: string;
  locales: LocaleInfo[];
}

const statusChipClass: Record<TranslationJobStatus, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  running: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

export function AdminLocaleChips({
  contentType,
  contentId,
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
      {locales.map(({ locale, href, active, title }) => {
        const status = getStatus(contentId, locale);
        const clickable =
          active || status === "completed" || status === "failed";

        const statusClass = status
          ? statusChipClass[status]
          : active
            ? "bg-accent-subtle text-accent border-accent/20"
            : "bg-bg-secondary text-text-secondary border-border";

        const chip = (
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide border ${statusClass} ${
              !clickable ? "opacity-60" : ""
            }`}
            title={title}
          >
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
            title={title}
          >
            {chip}
          </a>
        );
      })}
    </div>
  );
}
