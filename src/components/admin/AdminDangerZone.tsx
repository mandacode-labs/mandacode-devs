"use client";

interface AdminDangerZoneProps {
  title: string;
  description: string;
  buttonLabel: string;
  deleting?: boolean;
  onDelete: () => void;
}

export function AdminDangerZone({
  title,
  description,
  buttonLabel,
  deleting = false,
  onDelete,
}: AdminDangerZoneProps) {
  return (
    <div className="bg-bg-primary border border-red-200 rounded-xl p-4 sm:p-6">
      <h2 className="text-xs sm:text-sm font-semibold text-red-700 uppercase tracking-wide mb-2">
        {title}
      </h2>
      <p className="text-xs sm:text-sm text-text-secondary mb-3">
        {description}
      </p>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-red-600 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {deleting ? "..." : buttonLabel}
      </button>
    </div>
  );
}

export default AdminDangerZone;
