import { describe, it, expect } from "vitest";
import { formatDate, formatMonthYear } from "../utils/date";
import { DEFAULT_LANGUAGE } from "../config/languages";

describe("formatDate", () => {
  it("formats a full date in the default locale", () => {
    const date = new Date("2024-01-15");
    const result = formatDate(date, DEFAULT_LANGUAGE);
    expect(result).toContain("2024");
    expect(result).toContain("1");
    expect(result).toContain("15");
  });

  it("formats a date with leading zeros", () => {
    const date = new Date("2024-03-05");
    const result = formatDate(date, "en");
    expect(result).toContain("2024");
  });

  it("handles end-of-year dates", () => {
    const date = new Date("2024-12-31");
    const result = formatDate(date, "ko");
    expect(result).toContain("2024");
    expect(result).toContain("12");
  });

  it("formats date in Japanese locale", () => {
    const date = new Date("2024-06-15");
    const result = formatDate(date, "ja");
    expect(result).toContain("2024");
  });
});

describe("formatMonthYear", () => {
  it("returns '-' for null input", () => {
    expect(formatMonthYear(null, "ko")).toBe("-");
  });

  it("returns '-' for empty string", () => {
    expect(formatMonthYear("", "ko")).toBe("-");
  });

  it("formats an ISO date as year + month in ko", () => {
    const result = formatMonthYear("2024-03-15", "ko");
    expect(result).toContain("2024");
    expect(result).toContain("3");
    expect(result).not.toContain("15");
  });

  it("formats an ISO date as year + month in en", () => {
    const result = formatMonthYear("2024-03-15", "en");
    expect(result).toContain("2024");
    expect(result.toLowerCase()).toContain("march");
    expect(result).not.toContain("15");
  });

  it("formats an ISO date in ja", () => {
    const result = formatMonthYear("2024-06-01", "ja");
    expect(result).toContain("2024");
    expect(result).toContain("6");
    expect(result).not.toContain("01");
  });

  it("handles end-of-month dates", () => {
    const result = formatMonthYear("2024-12-31", "ko");
    expect(result).toContain("2024");
    expect(result).toContain("12");
    expect(result).not.toContain("31");
  });
});
