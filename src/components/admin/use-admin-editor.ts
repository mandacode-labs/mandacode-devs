import { useCallback, useEffect, useState, type SyntheticEvent } from "react";
import { generateEntityId } from "@/lib/id";
import { DEFAULT_LANGUAGE } from "@/lib/config/languages";
import { apiFetch } from "@/lib/api/client";

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
    initialLocale = DEFAULT_LANGUAGE,
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
  const [isSettingOriginal, setIsSettingOriginal] = useState(false);

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

  const setAsOriginalLocale = useCallback(async () => {
    if (!isEditMode || !id || !locale) return;
    setIsSettingOriginal(true);
    try {
      const url = `/api/admin/${entityType}s/${id}?locale=${encodeURIComponent(
        locale,
      )}`;
      await apiFetch<{ success: true }>(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_locale: locale }),
      });

      showSuccess("Set as original locale");
      window.location.reload();
    } catch (error) {
      showError(
        error instanceof Error
          ? error.message
          : "Failed to set as original locale",
      );
    } finally {
      setIsSettingOriginal(false);
    }
  }, [isEditMode, id, locale, entityType, showSuccess, showError]);

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

      await apiFetch<{ success: true }>(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      showSuccess("Saved successfully");
      window.location.replace(listPath);
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

      await apiFetch<{ success: true }>(
        `/api/admin/${entityType}s/${id}?${params.toString()}`,
        { method: "DELETE" },
      );

      window.location.replace(listPath);
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteModal(false);
      showError(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const toggleTargetLocale = (code: string) => {
    if (code === originalLocale) return;
    if (existingLocales.includes(code)) return;
    setTargetLocales((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
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
    isSettingOriginal,
    setAsOriginalLocale,
    isSubmitting,
    isDeleting,
    showDeleteModal,
    setShowDeleteModal,
    toast,
    handleSubmit,
    handleDelete,
  };
}
