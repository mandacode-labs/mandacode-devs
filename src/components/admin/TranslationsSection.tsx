import { useState } from "react";
import { AdminSection } from "./AdminSection";
import { LANGUAGE_CONFIGS } from "@/lib/config/languages";
import { useAdminTranslations } from "./use-admin-translations";
import { apiFetch } from "@/lib/api/client";
import { interpolate } from "@/lib/utils/interpolate";
import type { AdminTranslations } from "./use-admin-translations";
import type { TranslationContentType } from "@/lib/db/schema";

interface TranslationsSectionProps {
  isEditMode: boolean;
  locale: string;
  originalLocale: string;
  existingLocales: string[];
  targetLocales: string[];
  isSettingOriginal: boolean;
  contentType: TranslationContentType;
  contentId: string;
  onSetOriginalLocale: () => void;
  onSetOriginalLocaleValue: (value: string) => void;
  onToggleTargetLocale: (code: string) => void;
  onAfterBulkAction: () => void;
  title: string;
  originalLocaleLabel: string;
  originalHint: string;
  translatedHint: string;
  setAsOriginalLabel: string;
  savingLabel: string;
  translateDescription: string;
  originalChipLabel: string;
  translatedChipLabel: string;
  regenerateAllLabel?: string;
  regenerateAllConfirmLabel?: string;
  publishAllLabel?: string;
  publishAllConfirmLabel?: string;
  successLabel?: string;
  failedLabel?: string;
  noopLabel?: string;
}

export function TranslationsSection({
  isEditMode,
  locale,
  originalLocale,
  existingLocales,
  targetLocales,
  isSettingOriginal,
  contentType,
  contentId,
  onSetOriginalLocale,
  onSetOriginalLocaleValue,
  onToggleTargetLocale,
  onAfterBulkAction,
  title,
  originalLocaleLabel,
  originalHint,
  translatedHint,
  setAsOriginalLabel,
  savingLabel,
  translateDescription,
  originalChipLabel,
  translatedChipLabel,
  regenerateAllLabel = "전체 재번역",
  regenerateAllConfirmLabel = "{count}개 언어의 번역을 다시 생성하시겠어요?",
  publishAllLabel = "전체 개시",
  publishAllConfirmLabel = "{count}개 언어를 published로 변경하시겠어요?",
  successLabel = "성공",
  failedLabel = "실패",
  noopLabel = "처리할 항목이 없습니다",
}: TranslationsSectionProps) {
  const t = useAdminTranslations({} as AdminTranslations);
  const [bulkAction, setBulkAction] = useState<
    null | "regenerate-all" | "publish-all"
  >(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const translatableCount = existingLocales.filter(
    (l) => l !== originalLocale,
  ).length;

  async function handleRegenerateAll() {
    if (translatableCount === 0) return;
    if (
      !window.confirm(
        interpolate(regenerateAllConfirmLabel, { count: translatableCount }),
      )
    )
      return;
    setBulkAction("regenerate-all");
    setToast(null);
    try {
      const params = new URLSearchParams();
      params.set("content_type", contentType);
      params.set("content_id", contentId);
      const res = await apiFetch<{ success: true; targetLocales: string[] }>(
        `/api/admin/translations/regenerate-all?${params.toString()}`,
        { method: "POST" },
      );
      setToast({
        type: "success",
        message: `${successLabel}: ${res.targetLocales.length}`,
      });
      onAfterBulkAction();
    } catch (error) {
      setToast({
        type: "error",
        message: `${failedLabel}: ${error instanceof Error ? error.message : "Unknown"}`,
      });
    } finally {
      setBulkAction(null);
      setTimeout(() => setToast(null), 4000);
    }
  }

  async function handlePublishAll() {
    if (translatableCount === 0) return;
    if (
      !window.confirm(
        interpolate(publishAllConfirmLabel, { count: translatableCount }),
      )
    )
      return;
    setBulkAction("publish-all");
    setToast(null);
    try {
      const plural = contentType === "post" ? "posts" : `${contentType}s`;
      const res = await apiFetch<{ success: true; publishedCount: number }>(
        `/api/admin/${plural}/${contentId}/publish-all`,
        { method: "POST" },
      );
      setToast({
        type: "success",
        message: `${successLabel}: ${res.publishedCount}`,
      });
      onAfterBulkAction();
    } catch (error) {
      setToast({
        type: "error",
        message: `${failedLabel}: ${error instanceof Error ? error.message : "Unknown"}`,
      });
    } finally {
      setBulkAction(null);
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <AdminSection title={title}>
      {isEditMode && (
        <div className="mb-4 p-4 bg-bg-secondary rounded-lg border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">
                {originalLocaleLabel}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {locale === originalLocale
                  ? originalHint
                  : translatedHint
                      .replace(
                        "{locale}",
                        LANGUAGE_CONFIGS[locale]?.label ?? locale,
                      )
                      .replace(
                        "{original}",
                        LANGUAGE_CONFIGS[originalLocale]?.label ??
                          originalLocale,
                      )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={originalLocale}
                onChange={(e) => onSetOriginalLocaleValue(e.target.value)}
                className="px-3 py-2 text-sm border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              >
                {Object.values(LANGUAGE_CONFIGS).map((loc) => (
                  <option key={loc.code} value={loc.code}>
                    {loc.label}
                  </option>
                ))}
              </select>
              {locale !== originalLocale && (
                <button
                  type="button"
                  onClick={onSetOriginalLocale}
                  disabled={isSettingOriginal}
                  className="px-3 py-2 text-sm font-medium text-accent border border-accent rounded-lg hover:bg-accent/5 disabled:opacity-60 whitespace-nowrap"
                >
                  {isSettingOriginal ? savingLabel : setAsOriginalLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isEditMode && translatableCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRegenerateAll}
            disabled={bulkAction !== null}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-accent text-accent hover:bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {regenerateAllLabel}
          </button>
          <button
            type="button"
            onClick={handlePublishAll}
            disabled={bulkAction !== null}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-green-600 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishAllLabel}
          </button>
          {toast && (
            <span
              className={`text-xs ${
                toast.type === "success" ? "text-green-700" : "text-red-700"
              }`}
            >
              {toast.message}
            </span>
          )}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm text-text-secondary">{translateDescription}</p>
        <div className="flex flex-wrap gap-4">
          {Object.values(LANGUAGE_CONFIGS).map((loc) => {
            const isOriginal = loc.code === originalLocale;
            const isExisting = existingLocales.includes(loc.code);
            const isChecked =
              isOriginal || isExisting || targetLocales.includes(loc.code);

            return (
              <label
                key={loc.code}
                className={`flex items-center gap-2 ${
                  isOriginal || isExisting ? "opacity-60" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleTargetLocale(loc.code)}
                  disabled={isOriginal || isExisting}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent disabled:opacity-60"
                />
                <span className="text-sm text-text-primary">
                  {loc.label}
                  {isOriginal && (
                    <span className="ml-1 text-xs text-blue-600 font-medium">
                      {originalChipLabel}
                    </span>
                  )}
                  {isExisting && !isOriginal && (
                    <span className="ml-1 text-xs text-green-600 font-medium">
                      {translatedChipLabel}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </AdminSection>
  );
}
