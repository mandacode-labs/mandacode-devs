import { useState, useRef, useMemo } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useTranslationStatus } from "@/hooks/use-translation-status";
import type {
  TranslationContentType,
  TranslationJobStatus,
  PublishStatus,
} from "@/lib/db/schema";

export type ChipState =
  | { kind: "no-translation" }
  | { kind: "translating" }
  | { kind: "ready"; publishStatus: PublishStatus };

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

const outdatedRingClass =
  "ring-2 ring-orange-400 ring-offset-1 ring-offset-bg-primary";

const chipBaseClass =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide border transition-colors cursor-pointer select-none";

function getChipClass(state: ChipState): string {
  switch (state.kind) {
    case "no-translation":
      return "bg-bg-secondary text-text-secondary border-border hover:bg-bg-tertiary";
    case "translating":
      return "bg-red-50 text-red-700 border-red-200";
    case "ready":
      if (state.publishStatus === "published")
        return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";
      if (state.publishStatus === "archived")
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
      return "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100";
  }
}

function getChipState(
  jobStatus: TranslationJobStatus | null,
  isOriginal: boolean,
  hasTranslation: boolean,
  publishStatus: PublishStatus | null | undefined,
): ChipState {
  if (
    jobStatus === "pending" ||
    jobStatus === "running" ||
    jobStatus === "failed"
  ) {
    return { kind: "translating" };
  }
  if (!isOriginal && !hasTranslation) return { kind: "no-translation" };
  if (isOriginal && !publishStatus) return { kind: "no-translation" };
  return { kind: "ready", publishStatus: publishStatus ?? "draft" };
}

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

interface RegenerateMenuProps {
  href: string;
  isOriginal: boolean;
  isOutdated: boolean;
  onRegenerate: () => void;
  onClose: () => void;
}

function RegenerateMenu({
  href,
  isOriginal,
  isOutdated,
  onRegenerate,
  onClose,
}: RegenerateMenuProps) {
  return (
    <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] bg-bg-primary border border-border rounded-lg shadow-lg py-1">
      <a
        href={href}
        className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-bg-secondary"
        onClick={onClose}
      >
        <span className="w-3 h-3 inline-block">✎</span>
        {isOriginal ? "원본 편집" : "번역 편집"}
      </a>
      {!isOriginal && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRegenerate();
          }}
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
  );
}

interface ChipProps {
  locale: string;
  href: string;
  title: string;
  state: ChipState;
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
  state,
  isOutdated,
  isOriginal,
  isTranslating,
  jobStatus,
  canRegenerate,
  onRegenerate,
}: ChipProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hasTranslation = state.kind !== "no-translation";

  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  const tooltipParts: string[] = [];
  if (isOriginal) tooltipParts.push("원본");
  if (hasTranslation) tooltipParts.push("번역됨");
  else tooltipParts.push("번역 없음");
  if (jobStatus) tooltipParts.push(`작업: ${jobStatus}`);
  if (isOutdated) tooltipParts.push("원본 변경됨");
  const tooltip = tooltipParts.join(" · ");

  const className = `${chipBaseClass} ${getChipClass(state)} ${
    isOutdated ? outdatedRingClass : ""
  } ${!hasTranslation && !isTranslating ? "opacity-50" : ""}`;

  const showMenu = canRegenerate && onRegenerate && hasTranslation;

  const handleClick = (e: React.MouseEvent) => {
    if (showMenu) {
      e.preventDefault();
      setMenuOpen((v) => !v);
    }
  };

  if (showMenu) {
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
          <RegenerateMenu
            href={href}
            isOriginal={isOriginal}
            isOutdated={isOutdated}
            onRegenerate={() => {
              setMenuOpen(false);
              onRegenerate?.();
            }}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <a href={href} className={className} title={tooltip} onClick={handleClick}>
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
          const state = getChipState(
            status,
            isOriginal,
            hasTranslation,
            publishStatus,
          );
          const isTranslating =
            status === "pending" || status === "running" || regenerating;
          return (
            <Chip
              key={locale}
              locale={locale}
              href={href}
              title={title}
              state={state}
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
