import { useState } from "react";

interface DeleteModalProps {
  title: string;
  itemName: string;
  locale?: string;
  onConfirm: (allLocales: boolean) => void;
  onCancel: () => void;
}

export default function DeleteModal({
  title,
  itemName,
  locale,
  onConfirm,
  onCancel,
}: DeleteModalProps) {
  const [confirmation, setConfirmation] = useState("");
  const [allLocales, setAllLocales] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (confirmation !== "delete") return;
    setIsDeleting(true);
    try {
      await onConfirm(allLocales);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md bg-bg-primary rounded-xl border border-border shadow-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-5 h-5"
            >
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-text-primary">
              {title}
            </h3>
            <p className="text-sm text-text-secondary mt-1">
              <span className="font-medium text-text-primary">
                "{itemName}"
              </span>
              {locale && (
                <>
                  {" "}
                  (<span className="uppercase">{locale}</span>)
                </>
              )}{" "}
              will be permanently deleted. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <label className="flex items-center gap-2 text-sm text-text-secondary mb-4">
            <input
              type="checkbox"
              checked={allLocales}
              onChange={(e) => setAllLocales(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent"
            />
            Delete all language versions
          </label>

          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Type "delete" to confirm
          </label>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="delete"
            className="w-full px-3 py-2 border border-border rounded-lg bg-bg-primary text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
              if (e.key === "Escape") onCancel();
            }}
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmation !== "delete" || isDeleting}
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
