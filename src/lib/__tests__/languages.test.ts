import { describe, it, expect } from "vitest";
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_CONFIGS,
  isValidLanguage,
  getLanguageConfig,
  getLocaleFromPath,
  getRelativeLocaleUrl,
} from "../config/languages";

describe("SUPPORTED_LANGUAGES", () => {
  it("includes Korean as the source language", () => {
    expect(SUPPORTED_LANGUAGES).toContain("ko");
  });

  it("includes all translation targets", () => {
    expect(SUPPORTED_LANGUAGES).toContain("en");
    expect(SUPPORTED_LANGUAGES).toContain("ja");
    expect(SUPPORTED_LANGUAGES).toContain("zh");
  });

  it("does not modify the original array", () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(4);
  });
});

describe("DEFAULT_LANGUAGE", () => {
  it("defaults to Korean", () => {
    expect(DEFAULT_LANGUAGE).toBe("ko");
  });
});

describe("LANGUAGE_CONFIGS", () => {
  it("has a valid config for every supported language", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const config = LANGUAGE_CONFIGS[lang];
      expect(config).toBeDefined();
      expect(config.label).toBeTruthy();
      expect(config.locale).toBeTruthy();
      expect(config.dir).toBe("ltr");
    }
  });

  it("provides localized labels", () => {
    expect(LANGUAGE_CONFIGS.ko.label).toBe("한국어");
    expect(LANGUAGE_CONFIGS.en.label).toBe("English");
    expect(LANGUAGE_CONFIGS.ja.label).toBe("日本語");
    expect(LANGUAGE_CONFIGS.zh.label).toBe("中文");
  });
});

describe("isValidLanguage", () => {
  it("returns true for supported languages", () => {
    expect(isValidLanguage("ko")).toBe(true);
    expect(isValidLanguage("en")).toBe(true);
    expect(isValidLanguage("ja")).toBe(true);
    expect(isValidLanguage("zh")).toBe(true);
  });

  it("returns false for unsupported languages", () => {
    expect(isValidLanguage("fr")).toBe(false);
    expect(isValidLanguage("es")).toBe(false);
    expect(isValidLanguage("")).toBe(false);
    expect(isValidLanguage("ko-KR")).toBe(false);
  });
});

describe("getLanguageConfig", () => {
  it("returns the full config for a valid language", () => {
    const config = getLanguageConfig("en");
    expect(config.code).toBe("en");
    expect(config.label).toBe("English");
    expect(config.locale).toBe("en-US");
    expect(config.dir).toBe("ltr");
  });
});

describe("getLocaleFromPath", () => {
  it("extracts language from a simple path", () => {
    expect(getLocaleFromPath("/en/projects")).toBe("en");
  });

  it("extracts language from the root path", () => {
    expect(getLocaleFromPath("/ko")).toBe("ko");
  });

  it("falls back to default when no language prefix", () => {
    expect(getLocaleFromPath("/about")).toBe(DEFAULT_LANGUAGE);
  });

  it("falls back to default for root", () => {
    expect(getLocaleFromPath("/")).toBe(DEFAULT_LANGUAGE);
  });
});

describe("getRelativeLocaleUrl", () => {
  it("prefixes the language code", () => {
    expect(getRelativeLocaleUrl("en", "/projects")).toBe("/en/projects");
  });

  it("handles paths without leading slash", () => {
    expect(getRelativeLocaleUrl("ko", "blog")).toBe("/ko/blog");
  });

  it("handles empty path as root", () => {
    expect(getRelativeLocaleUrl("ja", "/")).toBe("/ja/");
  });
});
