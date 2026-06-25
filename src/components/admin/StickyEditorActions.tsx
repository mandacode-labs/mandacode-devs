import type { AdminTranslations } from "./use-admin-translations";
import { Loader2 } from "lucide-react";

interface StickyEditorActionsProps {
  isSubmitting: boolean;
  cancelHref: string;
  submitLabel: string;
  saveLabel: string;
  savingLabel: string;
  cancelLabel: string;
  onSubmit: () => void;
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
          {isSubmitting && <Loader2 className="animate-spin h-4 w-4" />}
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
