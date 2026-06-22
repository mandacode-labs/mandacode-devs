import { getEntry } from "astro:content";
import type { Lang } from "@/types";
import { MAIN_DEVELOPER_ID } from "@/lib/config/languages";

export async function getDeveloperByLang(lang: Lang) {
  return getEntry("developers", `${lang}/${MAIN_DEVELOPER_ID}`);
}
