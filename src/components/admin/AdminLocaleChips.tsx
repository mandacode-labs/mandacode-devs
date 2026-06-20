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

const statusDotClass: Record<TranslationJobStatus, string> = {
  pending: "bg-neutral-400",
  running: "bg-blue-500 animate-pulse",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

export function AdminLocaleChips({
  contentType,
  contentId,
  locales,
}: AdminLocaleChipsProps) {
  const { getStatus } = useTranslationStatus({
    contentType,
    ids: [contentId],
    interval: 5000,
  });

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {locales.map(({ locale, href, active, title }) => {
        const status = getStatus(contentId, locale);
        const clickable =
          active || status === "completed" || status === "failed";

        const chip = (
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium uppercase tracking-wide border ${
              active
                ? "bg-accent-subtle text-accent border-accent/20"
                : "bg-bg-secondary text-text-secondary border-border"
            } ${!clickable ? "opacity-60" : ""}`}
            title={title}
          >
            {locale}
            {status && (
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${statusDotClass[status]}`}
                aria-hidden="true"
              />
            )}
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
