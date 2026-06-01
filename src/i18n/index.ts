import ko from "./ko.json";
import en from "./en.json";

export const ui = {
  ko,
  en,
} as const;

export type Lang = keyof typeof ui;
export type UIKey = keyof (typeof ui)["ko"];
