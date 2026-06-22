import { useMemo, useState, useRef, useEffect } from "react";
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
  canRegenerate?: boolean;
}

interface AdminLocaleChipsProps {
  contentType: TranslationContentType;
  contentId: string;
  originalLocale: string;
  locales: LocaleInfo[];
  regenerating?: boolean;
  onRegenerate?: (
    contentId: string,
    contentType: TranslationContentType,
    targetLocale: string,
  ) => void;
}

const toneClass: Record<ChipTone, string> = {
  "no-translation":
    "bg-bg-secondary text-text-secondary border-border hover:bg-bg-tertiary",
  translating: "bg-red-50 text-red-700 border-red-200",
  "translated-draft":
    "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
  "translated-published":
    "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  archived: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  "original-draft":
    "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
  "original-published":
    "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  "original-archived":
    "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
};

const outdatedRingClass =
  "ring-2 ring-orange-400 ring-offset-1 ring-offset-bg-primary";

const chipBaseClass =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide border transition-colors cursor-pointer select-none";

function sortLocales(
  originalLocale: string,
  locales: LocaleInfo[],
): LocaleInfo[] {
  const priority = (l: LocaleInfo): number => {
    if (l.locale === originalLocale) return 0;
    if (l.publishStatus) {
      if (l.publishStatus === "published") return 1;
      if (l.publishStatus === "draft") return 2;
      return 3;
    }
    return 4;
  };
  return [...locales].sort((a, b) => {
    const pa = priority(a);
    const pb = priority(b);
    if (pa !== pb) return pa - pb;
    return a.locale.localeCompare(b.locale);
  });
}

function getChipTone(
  locale: string,
  originalLocale: string,
  publishStatus: PublishStatus | null | undefined,
  jobStatus: TranslationJobStatus | null,
  hasTranslation: boolean,
): ChipTone {
  if (
    jobStatus === "pending" ||
    jobStatus === "running" ||
    jobStatus === "failed"
  ) {
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

interface ChipProps {
  locale: string;
  href: string;
  title: string;
  tone: ChipTone;
  isOutdated: boolean;
  isOriginal: boolean;
  isTranslating: boolean;
  jobStatus: TranslationJobStatus | null;
  canRegenerate: boolean;
  onRegenerate: (() => void) | null;
}

function Chip({
  locale,
  href,
  title,
  tone,
  isOutdated,
  isOriginal,
  isTranslating,
  jobStatus,
  canRegenerate,
  onRegenerate,
}: ChipProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasTranslation = tone !== "no-translation";

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const tooltipParts: string[] = [];
  if (isOriginal) tooltipParts.push("원본");
  if (hasTranslation) tooltipParts.push("번역됨");
  else tooltipParts.push("번역 없음");
  if (jobStatus) tooltipParts.push(`작업: ${jobStatus}`);
  if (isOutdated) tooltipParts.push("원본 변경됨");
  const tooltip = tooltipParts.join(" · ");

  const className = `${chipBaseClass} ${toneClass[tone]} ${
    isOutdated ? outdatedRingClass : ""
  } ${!hasTranslation && !isTranslating ? "opacity-50" : ""}`;

  const handleClick = (e: React.MouseEvent) => {
    if (canRegenerate && onRegenerate) {
      e.preventDefault();
      setMenuOpen((v) => !v);
    }
  };

  const handleRegenerate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    onRegenerate?.();
  };

  if (canRegenerate && onRegenerate && hasTranslation) {
    return (
      <div className="relative inline-flex" ref={menuRef}>
        <a
          href={href}
          className={className}
          title={tooltip}
          onClick={handleClick}
        >
          {locale}
        </a>
        {menuOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] bg-bg-primary border border-border rounded-lg shadow-lg py-1">
            <a
              href={href}
              className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-bg-secondary"
              onClick={() => setMenuOpen(false)}
            >
              <span className="w-3 h-3 inline-block">
                {isOriginal ? "✎" : "✎"}
              </span>
              {isOriginal ? "원본 편집" : "번역 편집"}
            </a>
            {!isOriginal && (
              <button
                type="button"
                onClick={handleRegenerate}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-bg-secondary text-left"
              >
                <span className="w-3 h-3 inline-block">↻</span>
                재번역
              </button>
            )}
            {isOutdated && !isOriginal && (
              <div className="px-3 py-1.5 text-[10px] text-orange-600 border-t border-border mt-1 pt-1.5">
                ⚠ 원본이 변경됨
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href={href}
      className={className}
      title={tooltip}
      onClick={canRegenerate && onRegenerate ? handleClick : undefined}
    >
      {locale}
    </a>
  );
}

export function AdminLocaleChips({
  contentType,
  contentId,
  originalLocale,
  locales,
  regenerating = false,
  onRegenerate,
}: AdminLocaleChipsProps) {
  const ids = useMemo(() => [contentId], [contentId]);
  const { getStatus } = useTranslationStatus({
    contentType,
    ids,
    interval: 5000,
  });

  const sorted = useMemo(
    () => sortLocales(originalLocale, locales),
    [originalLocale, locales],
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sorted.map(
        ({
          locale,
          href,
          title,
          publishStatus,
          isOutdated,
          canRegenerate = true,
        }) => {
          const status = getStatus(contentId, locale);
          const hasTranslation =
            publishStatus !== null && publishStatus !== undefined;
          const isOriginal = locale === originalLocale;
          const tone = getChipTone(
            locale,
            originalLocale,
            publishStatus,
            status,
            hasTranslation,
          );
          const isTranslating =
            status === "pending" || status === "running" || regenerating;
          return (
            <Chip
              key={locale}
              locale={locale}
              href={href}
              title={title}
              tone={tone}
              isOutdated={!!isOutdated}
              isOriginal={isOriginal}
              isTranslating={isTranslating}
              jobStatus={status}
              canRegenerate={canRegenerate}
              onRegenerate={
                onRegenerate
                  ? () => onRegenerate(contentId, contentType, locale)
                  : null
              }
            />
          );
        },
      )}
    </div>
  );
}
