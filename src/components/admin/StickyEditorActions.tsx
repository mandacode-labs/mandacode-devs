import DeleteModal from "./DeleteModal";
import type { AdminTranslations } from "./use-admin-translations";

interface StickyEditorActionsProps {
  isEditMode: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  showDeleteModal: boolean;
  cancelHref: string;
  itemName: string;
  locale: string;
  translations: AdminTranslations;
  onSubmit: () => void;
  onShowDelete: () => void;
  onHideDelete: () => void;
  onConfirmDelete: (allLocales: boolean) => void;
  deleteModalTitle: string;
  deleteButtonLabel: string;
  submitLabel: string;
  saveLabel: string;
  savingLabel: string;
  cancelLabel: string;
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
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
      className="w-4 h-4"
    >
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function StickyEditorActions({
  isEditMode,
  isSubmitting,
  isDeleting,
  showDeleteModal,
  cancelHref,
  itemName,
  locale,
  translations,
  onSubmit,
  onShowDelete,
  onHideDelete,
  onConfirmDelete,
  deleteModalTitle,
  deleteButtonLabel,
  submitLabel,
  saveLabel,
  savingLabel,
  cancelLabel,
}: StickyEditorActionsProps) {
  return (
    <>
      <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-bg-secondary border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {isSubmitting && <Spinner />}
            {isSubmitting ? savingLabel : isEditMode ? submitLabel : saveLabel}
          </button>
          <a
            href={cancelHref}
            className="px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            {cancelLabel}
          </a>
        </div>

        {isEditMode && (
          <button
            type="button"
            onClick={onShowDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <TrashIcon />
            {deleteButtonLabel}
          </button>
        )}
      </div>

      {showDeleteModal && (
        <DeleteModal
          title={deleteModalTitle}
          itemName={itemName}
          locale={locale}
          translations={translations}
          onConfirm={onConfirmDelete}
          onCancel={onHideDelete}
        />
      )}
    </>
  );
}
