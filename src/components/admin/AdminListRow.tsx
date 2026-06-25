import type { CSSProperties, ReactNode } from "react";
import { GripVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { AdminLocaleChips, type LocaleInfo } from "./AdminLocaleChips";
import type { TranslationContentType } from "@/lib/db/schema";
import type { AdminTranslations } from "./use-admin-translations";

export interface AdminListColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface AdminListItem {
  id: string;
  title: string;
  href: string;
  viewHref?: string;
  meta?: string;
  originalLocale: string;
  existingLocales: string[];
  locales: LocaleInfo[];
  extras?: Record<string, string | number | null>;
}

interface AdminListRowProps {
  item: AdminListItem;
  index: number;
  columns: AdminListColumn[];
  contentType: TranslationContentType;
  translations: AdminTranslations;
  regeneratingId: string | null;
  onRegenerate: (
    contentId: string,
    contentType: TranslationContentType,
    targetLocale: string,
  ) => void;
  onDelete: (item: AdminListItem) => void;
  rowRef?: (el: HTMLTableRowElement | null) => void;
  rowStyle?: CSSProperties;
  rowClassName?: string;
  isDragging?: boolean;
  dragHandle?: ReactNode;
}

const actionLinkClass =
  "inline-flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:text-accent hover:bg-accent-subtle transition-colors";
const deleteButtonClass =
  "inline-flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors";
const rowCellClass = "px-3 py-3 align-middle whitespace-nowrap";
const numberBadgeClass =
  "inline-flex items-center justify-center w-7 h-7 rounded-md bg-bg-secondary text-text-muted text-xs font-medium";

interface AdminListMobileCardProps {
  item: AdminListItem;
  columns: AdminListColumn[];
  contentType: TranslationContentType;
  translations: AdminTranslations;
  regeneratingId: string | null;
  onRegenerate: (
    contentId: string,
    contentType: TranslationContentType,
    targetLocale: string,
  ) => void;
  onDelete: (item: AdminListItem) => void;
}

export function AdminListMobileCard({
  item,
  columns,
  contentType,
  translations,
  regeneratingId,
  onRegenerate,
  onDelete,
}: AdminListMobileCardProps) {
  return (
    <div className="px-4 py-3 bg-bg-primary hover:bg-bg-secondary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <a
            href={item.href}
            className="block text-sm font-medium text-text-primary hover:text-accent transition-colors truncate"
          >
            {item.title}
          </a>
          {item.meta && (
            <p className="mt-0.5 text-[11px] text-text-muted font-mono truncate">
              {item.meta}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0 -mr-1">
          {item.viewHref && (
            <a
              href={item.viewHref}
              className={actionLinkClass}
              title={translations["admin.view"] ?? "View"}
            >
              <Eye className="w-4 h-4" />
            </a>
          )}
          <a href={item.href} className={actionLinkClass} title="Edit">
            <Pencil className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className={deleteButtonClass}
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex items-end gap-3">
        <div className="flex-1 min-w-0">
          <AdminLocaleChips
            size="sm"
            contentType={contentType}
            contentId={item.id}
            originalLocale={item.originalLocale}
            locales={item.locales}
            regenerating={regeneratingId === item.id}
            onRegenerate={onRegenerate}
          />
        </div>
        {columns.length > 0 && (
          <div className="shrink-0 text-right text-[11px] leading-5 text-text-secondary">
            {columns.map((column) => {
              const value = item.extras?.[column.key];
              if (!value) return null;
              return (
                <div key={column.key} className="truncate">
                  <span className="text-text-muted">{column.label}</span>{" "}
                  <span className="font-medium text-text-primary">{value}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminListRow({
  item,
  index,
  columns,
  contentType,
  translations,
  regeneratingId,
  onRegenerate,
  onDelete,
  rowRef,
  rowStyle,
  rowClassName = "",
  isDragging = false,
  dragHandle,
}: AdminListRowProps) {
  const className =
    `hidden sm:table-row group bg-bg-primary hover:bg-bg-secondary/40 transition-colors ${
      isDragging ? "opacity-80" : ""
    } ${rowClassName}`.trim();

  return (
    <tr ref={rowRef} style={rowStyle} className={className}>
      <td className={`${rowCellClass} w-14`}>
        <div className="flex items-center gap-2">
          {dragHandle}
          <span className={numberBadgeClass}>{index + 1}</span>
        </div>
      </td>
      <td className={`${rowCellClass} min-w-0 w-full max-w-0`}>
        <div className="flex items-center justify-between gap-3 min-w-0">
          <a href={item.href} className="block group/link min-w-0 flex-1">
            <span className="text-sm font-medium text-text-primary group-hover/link:text-accent transition-colors truncate block">
              {item.title}
            </span>
            {item.meta && (
              <span className="block text-xs text-text-muted font-mono truncate">
                {item.meta}
              </span>
            )}
          </a>
        </div>
      </td>
      <td className={`${rowCellClass}`}>
        <div className="flex items-center">
          <AdminLocaleChips
            contentType={contentType}
            contentId={item.id}
            originalLocale={item.originalLocale}
            locales={item.locales}
            regenerating={regeneratingId === item.id}
            onRegenerate={onRegenerate}
          />
        </div>
      </td>
      {columns.map((column) => (
        <td
          key={column.key}
          className={`${rowCellClass} ${
            column.align === "right"
              ? "text-right"
              : column.align === "center"
                ? "text-center"
                : "text-left"
          } ${column.width ?? ""}`}
        >
          <span className="text-text-secondary text-xs">
            {item.extras?.[column.key] ?? "\u00A0"}
          </span>
        </td>
      ))}
      <td className={`${rowCellClass} text-right`}>
        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.viewHref && (
            <a
              href={item.viewHref}
              className={actionLinkClass}
              title={translations["admin.view"] ?? "View"}
            >
              <Eye className="w-4 h-4" />
            </a>
          )}
          <a href={item.href} className={actionLinkClass} title="Edit">
            <Pencil className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className={deleteButtonClass}
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function DragHandleIcon() {
  return <GripVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-muted" />;
}
