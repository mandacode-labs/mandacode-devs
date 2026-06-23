import type { Language } from "../config/languages";
import { getLanguageConfig } from "../config/languages";

const SHORT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const MONTH_YEAR_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
};

const formatters = new Map<string, Intl.DateTimeFormat>();

function getShortDateFormatter(locale: string): Intl.DateTimeFormat {
  let f = formatters.get(locale);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, SHORT_DATE_OPTIONS);
    formatters.set(locale, f);
  }
  return f;
}

function getMonthYearFormatter(locale: string): Intl.DateTimeFormat {
  let f = formatters.get(`my:${locale}`);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, MONTH_YEAR_OPTIONS);
    formatters.set(`my:${locale}`, f);
  }
  return f;
}

export function formatDate(date: Date, lang: Language): string {
  const config = getLanguageConfig(lang);
  return new Intl.DateTimeFormat(config.locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatShortDate(
  iso: string | null,
  lang: Language = "ko",
): string {
  if (!iso) return "-";
  return getShortDateFormatter(getLanguageConfig(lang).locale).format(
    new Date(iso),
  );
}

export function formatMonthYear(
  iso: string | null,
  lang: Language = "ko",
): string {
  if (!iso) return "-";
  return getMonthYearFormatter(getLanguageConfig(lang).locale).format(
    new Date(iso),
  );
}
