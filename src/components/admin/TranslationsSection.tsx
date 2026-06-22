import { AdminSection } from "./AdminSection";
import { LANGUAGE_CONFIGS } from "@/lib/config/languages";

interface TranslationsSectionProps {
  isEditMode: boolean;
  locale: string;
  originalLocale: string;
  existingLocales: string[];
  targetLocales: string[];
  isSettingOriginal: boolean;
  onSetOriginalLocale: () => void;
  onSetOriginalLocaleValue: (value: string) => void;
  onToggleTargetLocale: (code: string) => void;
  title: string;
  originalLocaleLabel: string;
  originalHint: string;
  translatedHint: string;
  setAsOriginalLabel: string;
  savingLabel: string;
  translateDescription: string;
  originalChipLabel: string;
  translatedChipLabel: string;
}

export function TranslationsSection({
  isEditMode,
  locale,
  originalLocale,
  existingLocales,
  targetLocales,
  isSettingOriginal,
  onSetOriginalLocale,
  onSetOriginalLocaleValue,
  onToggleTargetLocale,
  title,
  originalLocaleLabel,
  originalHint,
  translatedHint,
  setAsOriginalLabel,
  savingLabel,
  translateDescription,
  originalChipLabel,
  translatedChipLabel,
}: TranslationsSectionProps) {
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
