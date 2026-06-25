import type { CSSProperties, ReactNode } from "react";
import { AdminLocaleChips, type LocaleInfo } from "./AdminLocaleChips";
import type { TranslationContentType, PublishStatus } from "@/lib/db/schema";
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

function DragHandleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
    >
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
    >
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

const actionLinkClass =
  "inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-text-secondary hover:text-accent hover:bg-accent-subtle transition-colors";
const deleteButtonClass =
  "inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors";

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
    `group bg-bg-primary hover:bg-bg-secondary/40 transition-colors ${
      isDragging ? "opacity-80" : ""
    } ${rowClassName}`.trim();

  return (
    <tr ref={rowRef} style={rowStyle} className={className}>
      <td className="px-3 sm:px-4 py-2.5 sm:py-4">
        <div className="flex items-center gap-2">
          {dragHandle}
          <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-bg-tertiary text-text-muted text-xs font-medium">
            {index + 1}
          </div>
        </div>
      </td>
      <td className="px-3 sm:px-4 py-2.5 sm:py-4">
        <a href={item.href} className="block group/link">
          <span className="font-medium text-text-primary group-hover/link:text-accent transition-colors">
            {item.title}
          </span>
          {item.meta && (
            <span className="block text-xs text-text-muted font-mono mt-0.5 truncate">
              {item.meta}
            </span>
          )}
        </a>
      </td>
      <td className="px-3 sm:px-4 py-2.5 sm:py-4">
        <AdminLocaleChips
          contentType={contentType}
          contentId={item.id}
          originalLocale={item.originalLocale}
          locales={item.locales}
          regenerating={regeneratingId === item.id}
          onRegenerate={onRegenerate}
        />
      </td>
      {columns.map((column) => (
        <td
          key={column.key}
          className={`px-3 sm:px-4 py-2.5 sm:py-4 ${
            column.align === "right"
              ? "text-right"
              : column.align === "center"
                ? "text-center"
                : "text-left"
          }`}
        >
          <span className="text-text-secondary">
            {item.extras?.[column.key] ?? "\u00A0"}
          </span>
        </td>
      ))}
      <td className="px-3 sm:px-4 py-2.5 sm:py-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {item.viewHref && (
            <a
              href={item.viewHref}
              className={actionLinkClass}
              title={translations["admin.view"] ?? "View"}
            >
              <ViewIcon />
            </a>
          )}
          <a href={item.href} className={actionLinkClass} title="Edit">
            <EditIcon />
          </a>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className={deleteButtonClass}
            title="Delete"
            aria-label="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </td>
    </tr>
  );
}
