import { useState, useCallback } from "react";
import { GripVertical, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
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
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteModal from "./DeleteModal";
import type { TranslationContentType } from "@/lib/db/schema";
import type { AdminTranslations } from "./use-admin-translations";
import {
  AdminListRow,
  AdminListMobileCard,
  type AdminListColumn,
  type AdminListItem,
} from "./AdminListRow";

export type { AdminListColumn, AdminListItem };
export type AdminListLocaleInfo = AdminListItem["locales"][number];

interface AdminListProps {
  items: AdminListItem[];
  contentType: TranslationContentType;
  columns: AdminListColumn[];
  emptyTitle: string;
  emptyMessage: string;
  deleteModalTitle: string;
  translations: AdminTranslations;
  entityType: "posts" | "projects" | "developers";
  statusLabel?: string;
  regenerateEndpoint?: string;
  regenerateLabels?: {
    success: string;
    failed: string;
  };
  onAfterRegenerate?: () => void;
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
  statusLabel = "상태",
  regenerateEndpoint = "/api/admin/translations/regenerate",
  regenerateLabels = {
    success: "재번역 시작",
    failed: "재번역 실패",
  },
  onAfterRegenerate,
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
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

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
      await apiFetch<{ success: true }>(reorderEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orders: items.map((item, index) => ({
            id: item.id,
            project_order: index + 1,
          })),
        }),
      });
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

        await apiFetch<{ success: true }>(
          `/api/admin/${entityType}/${deleteItem.id}?${params.toString()}`,
          { method: "DELETE" },
        );

        window.location.reload();
      } catch (error) {
        console.error("Delete failed:", error);
      }
    },
    [deleteItem, entityType],
  );

  const handleRegenerate = useCallback(
    async (
      contentId: string,
      contentTypeArg: TranslationContentType,
      targetLocale: string,
    ) => {
      try {
        setRegeneratingId(contentId);
        const params = new URLSearchParams();
        params.set("content_type", contentTypeArg);
        params.set("content_id", contentId);
        params.set("target_locale", targetLocale);

        await apiFetch<{ success: true }>(
          `${regenerateEndpoint}?${params.toString()}`,
          { method: "POST" },
        );

        setToast({ type: "success", message: regenerateLabels.success });
        setTimeout(() => setToast(null), 3000);
        onAfterRegenerate?.();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : regenerateLabels.failed;
        setToast({
          type: "error",
          message: `${regenerateLabels.failed}: ${message}`,
        });
        setTimeout(() => setToast(null), 5000);
      } finally {
        setRegeneratingId(null);
      }
    },
    [regenerateEndpoint, regenerateLabels, onAfterRegenerate],
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
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? reorderLabels.saving : reorderLabels.save}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsReorderMode(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-bg-tertiary text-text-primary text-sm font-medium rounded-lg hover:bg-bg-secondary border border-border transition-colors"
            >
              <GripVertical className="w-4 h-4" />
              {reorderLabels.start}
            </button>
          )}
        </div>
      )}

      <div className="sm:bg-bg-primary sm:border sm:border-border sm:rounded-xl sm:shadow-sm sm:overflow-hidden">
        <div className="sm:overflow-x-auto">
          <div className="sm:hidden divide-y divide-border border border-border rounded-xl overflow-hidden bg-bg-primary shadow-sm">
            {items.map((item) => (
              <AdminListMobileCard
                key={item.id}
                item={item}
                columns={columns}
                contentType={contentType}
                translations={translations}
                regeneratingId={regeneratingId}
                onRegenerate={handleRegenerate}
                onDelete={(item) => setDeleteItem(item)}
              />
            ))}
          </div>

          <table className="hidden sm:table w-full text-xs table-fixed">
            <colgroup>
              <col className="w-14" />
              <col className="w-[40%]" />
              <col className="w-auto" />
              {columns.map((column) => (
                <col
                  key={column.key}
                  className={column.width ? column.width : "w-auto"}
                />
              ))}
              <col className="w-24" />
            </colgroup>
            <thead className="bg-bg-secondary border-b border-border">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold text-text-secondary text-[11px] uppercase tracking-wide w-14">
                  #
                </th>
                <th className="px-3 py-2.5 text-left font-semibold text-text-secondary text-[11px] uppercase tracking-wide">
                  Title
                </th>
                <th className="px-3 py-2.5 text-left font-semibold text-text-secondary text-[11px] uppercase tracking-wide">
                  {statusLabel}
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-3 py-2.5 font-semibold text-text-secondary text-[11px] uppercase tracking-wide ${
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
                <th className="px-3 py-2.5 text-right font-semibold text-text-secondary text-[11px] uppercase tracking-wide w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isReorderMode ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={items.map((item) => item.id)}>
                    {items.map((item, index) => (
                      <SortableRow
                        key={item.id}
                        item={item}
                        index={index}
                        columns={columns}
                        contentType={contentType}
                        translations={translations}
                        regeneratingId={regeneratingId}
                        onRegenerate={handleRegenerate}
                        onDelete={(item) => setDeleteItem(item)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                items.map((item, index) => (
                  <AdminListRow
                    key={item.id}
                    item={item}
                    index={index}
                    columns={columns}
                    contentType={contentType}
                    translations={translations}
                    regeneratingId={regeneratingId}
                    onRegenerate={handleRegenerate}
                    onDelete={(item) => setDeleteItem(item)}
                  />
                ))
              )}
            </tbody>
          </table>
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
  regeneratingId,
  onRegenerate,
  onDelete,
}: {
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
    <AdminListRow
      item={item}
      index={index}
      columns={columns}
      contentType={contentType}
      translations={translations}
      regeneratingId={regeneratingId}
      onRegenerate={onRegenerate}
      onDelete={onDelete}
      rowRef={setNodeRef}
      rowStyle={style}
      isDragging={isDragging}
      dragHandle={
        <button
          type="button"
          {...(attributes as React.ButtonHTMLAttributes<HTMLButtonElement>)}
          {...(listeners as React.ButtonHTMLAttributes<HTMLButtonElement>)}
          className="p-1.5 text-text-muted hover:text-text-primary cursor-grab active:cursor-grabbing rounded-md hover:bg-bg-tertiary"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      }
    />
  );
}
