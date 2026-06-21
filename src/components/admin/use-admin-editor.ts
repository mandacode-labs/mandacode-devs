import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import { generateEntityId } from "@/lib/id";

export interface Toast {
  type: "success" | "error";
  message: string;
}

export interface UseAdminEditorOptions {
  initialId?: string;
  initialLocale?: string;
  initialOriginalLocale?: string;
  existingLocales?: string[];
  entityType: "post" | "project" | "developer";
  listPath: string;
  getSubmitBody: () => Record<string, unknown>;
}

export function useAdminEditor(options: UseAdminEditorOptions) {
  const {
    initialId,
    initialLocale = "ko",
    initialOriginalLocale,
    existingLocales: initialExistingLocales = [],
    entityType,
    listPath,
    getSubmitBody,
  } = options;
  const isEditMode = !!initialId;
  const [id] = useState(() => initialId ?? generateEntityId());
  const [locale, setLocale] = useState(initialLocale);
  const [originalLocale, setOriginalLocale] = useState(
    initialOriginalLocale ?? initialLocale,
  );
  const [existingLocales, setExistingLocales] = useState(
    initialExistingLocales,
  );
  const [targetLocales, setTargetLocales] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (initialOriginalLocale) {
      setOriginalLocale(initialOriginalLocale);
    }
    if (initialExistingLocales.length > 0) {
      setExistingLocales(initialExistingLocales);
    }
  }, [initialOriginalLocale, initialExistingLocales]);

  const showSuccess = useCallback((message: string) => {
    setToast({ type: "success", message });
  }, []);

  const showError = useCallback((message: string) => {
    setToast({ type: "error", message });
  }, []);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const url = isEditMode
        ? `/api/admin/${entityType}s/${id}?locale=${encodeURIComponent(locale)}`
        : `/api/admin/${entityType}s`;
      const body = isEditMode
        ? getSubmitBody()
        : {
            id,
            locale,
            original_locale: originalLocale,
            ...getSubmitBody(),
          };

      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to save");
      }

      showSuccess("Saved successfully");
      window.location.href = listPath;
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (allLocales: boolean) => {
    if (!id || !locale) return;
    setIsDeleting(true);

    try {
      const params = new URLSearchParams();
      params.set("confirmation", "delete");
      if (!allLocales) params.set("locale", locale);
      else params.set("all", "true");

      const response = await fetch(
        `/api/admin/${entityType}s/${id}?${params.toString()}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to delete");
      }

      window.location.href = listPath;
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteModal(false);
      showError(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const toggleTargetLocale = (code: string) => {
    if (code === originalLocale) return;
    if (existingLocales.includes(code)) return;
    setTargetLocales(
      (prev = prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]),
    );
  };

  return {
    id,
    isEditMode,
    locale,
    setLocale,
    originalLocale,
    setOriginalLocale,
    existingLocales,
    setExistingLocales,
    targetLocales,
    toggleTargetLocale,
    isSubmitting,
    isDeleting,
    showDeleteModal,
    setShowDeleteModal,
    toast,
    handleSubmit,
    handleDelete,
  };
}
