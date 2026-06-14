import { getEntry } from "astro:content";
import type { Lang } from "@/types";

export async function getDeveloperByLang(lang: Lang) {
  return getEntry("developers", `${lang}/main-developer`);
}
