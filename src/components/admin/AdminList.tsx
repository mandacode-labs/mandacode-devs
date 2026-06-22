import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AdminLocaleChips } from "./AdminLocaleChips";
import DeleteModal from "./DeleteModal";
import type { TranslationContentType } from "@/lib/db/schema";
import type { AdminTranslations } from "./use-admin-translations";

export interface AdminListColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: string;
}

export interface AdminListLocaleInfo {
  locale: string;
  href: string;
  active: boolean;
  title: string;
  publishStatus?: "draft" | "published" | "archived" | null;
  isOutdated?: boolean;
}

export interface AdminListItem {
  id: string;
  title: string;
  href: string;
  viewHref?: string;
  meta?: string;
  originalLocale: string;
  existingLocales: string[];
  locales: AdminListLocaleInfo[];
  extras?: Record<string, string | number | null>;
}

interface AdminListProps {
  items: AdminListItem[];
  contentType: TranslationContentType;
  columns: AdminListColumn[];
  emptyTitle: string;
  emptyMessage: string;
  deleteModalTitle: string;
  translations: AdminTranslations;
  entityType: "posts" | "projects" | "developers";
  reorderable?: boolean;
  reorderLabels?: {
    start: string;
    save: string;
    saving: string;
    saved: string;
    failed: string;
    cancel: string;
    hint: string;
    activeHint: string;
  };
  reorderEndpoint?: string;
}

export function AdminList({
  items: initialItems,
  contentType,
  columns,
  emptyTitle,
  emptyMessage,
  deleteModalTitle,
  translations,
  entityType,
  reorderable = false,
  reorderLabels = {
    start: "Reorder",
    save: "Save Order",
    saving: "Saving...",
    saved: "Order saved",
    failed: "Failed to save order",
    cancel: "Cancel",
    hint: "Enable reorder mode to change the display order.",
    activeHint: "Drag rows to reorder, then save.",
  },
  reorderEndpoint,
}: AdminListProps) {
  const [items, setItems] = useState(initialItems);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminListItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((current) => {
      const oldIndex = current.findIndex((item) => item.id === active.id);
      const newIndex = current.findIndex((item) => item.id === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
    setHasChanges(true);
  }, []);

  const handleSaveOrder = useCallback(async () => {
    if (!reorderEndpoint) return;
    setIsSaving(true);
    try {
      const response = await fetch(reorderEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orders: items.map((item, index) => ({
            id: item.id,
            project_order: index + 1,
          })),
        }),
      });
      if (!response.ok) throw new Error("Failed to save order");
      setHasChanges(false);
      setToast({ type: "success", message: reorderLabels.saved });
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setToast({ type: "error", message: reorderLabels.failed });
    } finally {
      setIsSaving(false);
    }
  }, [items, reorderEndpoint, reorderLabels]);

  const handleCancelReorder = useCallback(() => {
    setItems(initialItems);
    setIsReorderMode(false);
    setHasChanges(false);
  }, [initialItems]);

  const handleDelete = useCallback(
    async (allLocales: boolean) => {
      if (!deleteItem) return;
      try {
        const params = new URLSearchParams();
        params.set("confirmation", "delete");
        if (allLocales) params.set("all", "true");

        const response = await fetch(
          `/api/admin/${entityType}/${deleteItem.id}?${params.toString()}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error || "Failed to delete");
        }

        window.location.reload();
      } catch (error) {
        console.error("Delete failed:", error);
      }
    },
    [deleteItem, entityType],
  );

  if (items.length === 0) {
    return (
      <div className="bg-bg-primary border border-border rounded-xl shadow-sm p-8 text-center">
        <h3 className="text-lg font-semibold text-text-primary">
          {emptyTitle}
        </h3>
        <p className="text-sm text-text-secondary mt-1">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {reorderable && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-text-secondary">
            {isReorderMode ? reorderLabels.activeHint : reorderLabels.hint}
          </p>
          {isReorderMode ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelReorder}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
              >
                {reorderLabels.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={!hasChanges || isSaving || !reorderEndpoint}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? reorderLabels.saving : reorderLabels.save}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsReorderMode(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary text-sm font-medium rounded-lg hover:bg-bg-secondary border border-border transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
              >
                <circle cx="9" cy="6" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="9" cy="18" r="1.5" />
                <circle cx="15" cy="6" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="15" cy="18" r="1.5" />
              </svg>
              {reorderLabels.start}
            </button>
          )}
        </div>
      )}

      <div className="bg-bg-primary border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isReorderMode ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <table className="w-full text-sm">
                  <thead className="bg-bg-secondary border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-text-secondary text-xs uppercase tracking-wide w-16">
                        #
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-text-secondary text-xs uppercase tracking-wide">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-text-secondary text-xs uppercase tracking-wide">
                        Languages
                      </th>
                      {columns.map((column) => (
                        <th
                          key={column.key}
                          className={`px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide ${
                            column.align === "right"
                              ? "text-right"
                              : column.align === "center"
                                ? "text-center"
                                : "text-left"
                          } ${column.width ?? ""}`}
                        >
                          {column.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right font-semibold text-text-secondary text-xs uppercase tracking-wide w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item, index) => (
                      <SortableRow
                        key={item.id}
                        item={item}
                        index={index}
                        columns={columns}
                        contentType={contentType}
                        translations={translations}
                      />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary text-xs uppercase tracking-wide w-16">
                    #
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary text-xs uppercase tracking-wide">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary text-xs uppercase tracking-wide">
                    Languages
                  </th>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-4 py-3 font-semibold text-text-secondary text-xs uppercase tracking-wide ${
                        column.align === "right"
                          ? "text-right"
                          : column.align === "center"
                            ? "text-center"
                            : "text-left"
                      } ${column.width ?? ""}`}
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-semibold text-text-secondary text-xs uppercase tracking-wide w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-bg-secondary/40 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-tertiary text-text-muted text-xs font-medium">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <a href={item.href} className="block group/link">
                        <span className="font-medium text-text-primary group-hover/link:text-accent transition-colors">
                          {item.title}
                        </span>
                        {item.meta && (
                          <span className="block text-xs text-text-muted font-mono mt-0.5">
                            {item.meta}
                          </span>
                        )}
                      </a>
                    </td>
                    <td className="px-4 py-4">
                      <AdminLocaleChips
                        contentType={contentType}
                        contentId={item.id}
                        originalLocale={item.originalLocale}
                        locales={item.locales}
                      />
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-4 ${
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
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.viewHref && (
                          <a
                            href={item.viewHref}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-accent hover:bg-accent-subtle transition-colors"
                            title={translations["admin.view"] ?? "View"}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="w-4 h-4"
                            >
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </a>
                        )}
                        <a
                          href={item.href}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-accent hover:bg-accent-subtle transition-colors"
                          title="Edit"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="w-4 h-4"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </a>
                        <button
                          type="button"
                          onClick={() => setDeleteItem(item)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="w-4 h-4"
                          >
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {toast && (
        <div
          className={`mt-3 text-sm px-4 py-2 rounded-lg ${
            toast.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}

      {deleteItem && (
        <DeleteModal
          title={deleteModalTitle}
          itemName={deleteItem.title}
          translations={translations}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}
    </>
  );
}

function SortableRow({
  item,
  index,
  columns,
  contentType,
  translations,
}: {
  item: AdminListItem;
  index: number;
  columns: AdminListColumn[];
  contentType: TranslationContentType;
  translations: AdminTranslations;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group bg-bg-primary hover:bg-bg-secondary/40 transition-colors ${
        isDragging ? "opacity-80" : ""
      }`}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="p-1.5 text-text-muted hover:text-text-primary cursor-grab active:cursor-grabbing rounded-md hover:bg-bg-tertiary"
            aria-label="Drag to reorder"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4"
            >
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </button>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-tertiary text-text-muted text-xs font-medium">
            {index + 1}
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <a href={item.href} className="block group/link">
          <span className="font-medium text-text-primary group-hover/link:text-accent transition-colors">
            {item.title}
          </span>
          {item.meta && (
            <span className="block text-xs text-text-muted font-mono mt-0.5">
              {item.meta}
            </span>
          )}
        </a>
      </td>
      <td className="px-4 py-4">
        <AdminLocaleChips
          contentType={contentType}
          contentId={item.id}
          originalLocale={item.originalLocale}
          locales={item.locales}
        />
      </td>
      {columns.map((column) => (
        <td
          key={column.key}
          className={`px-4 py-4 ${
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
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.viewHref && (
            <a
              href={item.viewHref}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-accent hover:bg-accent-subtle transition-colors"
              title={translations["admin.view"] ?? "View"}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </a>
          )}
          <a
            href={item.href}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-accent hover:bg-accent-subtle transition-colors"
            title="Edit"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </a>
          <button
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
            aria-label="Delete"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4"
            >
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

export { AdminLocaleChips };
