import { useState, useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
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
  errorMessage: string | null;
  rect: DOMRect;
  onRegenerate: () => void;
  onClose: () => void;
}

function RegenerateMenu({
  href,
  isOriginal,
  isOutdated,
  errorMessage,
  rect,
  onRegenerate,
  onClose,
}: RegenerateMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, onClose, true);

  const top = rect.bottom + 4;
  const left = rect.left;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[200px] max-w-[280px] bg-bg-primary border border-border rounded-lg shadow-lg py-1"
      style={{ top, left }}
    >
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
      {errorMessage && (
        <div className="px-3 py-1.5 text-[10px] text-red-600 border-t border-border mt-1 pt-1.5 break-words">
          <div className="font-semibold mb-0.5">번역 실패</div>
          {errorMessage}
        </div>
      )}
    </div>,
    document.body,
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
  errorMessage: string | null;
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
  errorMessage,
  canRegenerate,
  onRegenerate,
}: ChipProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null);
  const chipRef = useRef<HTMLAnchorElement>(null);
  const hasTranslation = state.kind !== "no-translation";

  const showMenu = canRegenerate && onRegenerate && hasTranslation;

  const handleClick = (e: React.MouseEvent) => {
    if (showMenu) {
      e.preventDefault();
      if (chipRef.current) {
        setMenuRect(chipRef.current.getBoundingClientRect());
      }
      setMenuOpen((v) => !v);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (showMenu) {
      e.stopPropagation();
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onScroll = () => setMenuOpen(false);
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [menuOpen]);

  const tooltipParts: string[] = [];
  if (isOriginal) tooltipParts.push("원본");
  if (hasTranslation) tooltipParts.push("번역됨");
  else tooltipParts.push("번역 없음");
  if (jobStatus) tooltipParts.push(`작업: ${jobStatus}`);
  if (errorMessage) tooltipParts.push(errorMessage);
  if (isOutdated) tooltipParts.push("원본 변경됨");
  const tooltip = tooltipParts.join(" · ");

  const className = `${chipBaseClass} ${getChipClass(state)} ${
    isOutdated ? outdatedRingClass : ""
  } ${!hasTranslation && !isTranslating ? "opacity-50" : ""}`;

  if (showMenu) {
    return (
      <a
        ref={chipRef}
        href={href}
        className={className}
        title={tooltip}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        {locale}
        {menuOpen && menuRect && (
          <RegenerateMenu
            href={href}
            isOriginal={isOriginal}
            isOutdated={isOutdated}
            errorMessage={errorMessage}
            rect={menuRect}
            onRegenerate={() => {
              setMenuOpen(false);
              onRegenerate?.();
            }}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </a>
    );
  }

  return (
    <a
      ref={chipRef}
      href={href}
      className={className}
      title={tooltip}
      onClick={handleClick}
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
  const { getStatus, getError } = useTranslationStatus({
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
          const errorMessage = getError(contentId, locale);
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
              errorMessage={errorMessage}
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
