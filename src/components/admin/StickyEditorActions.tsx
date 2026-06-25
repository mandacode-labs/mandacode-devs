import type { AdminTranslations } from "./use-admin-translations";

interface StickyEditorActionsProps {
  isSubmitting: boolean;
  cancelHref: string;
  submitLabel: string;
  saveLabel: string;
  savingLabel: string;
  cancelLabel: string;
  onSubmit: () => void;
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

export function StickyEditorActions({
  isSubmitting,
  cancelHref,
  submitLabel,
  saveLabel,
  savingLabel,
  cancelLabel,
  onSubmit,
}: StickyEditorActionsProps) {
  return (
    <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-3 sm:py-4 bg-bg-secondary border-t border-border flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? savingLabel : (submitLabel ?? saveLabel)}
        </button>
        <a
          href={cancelHref}
          className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
        >
          {cancelLabel}
        </a>
      </div>
    </div>
  );
}

export default StickyEditorActions;
