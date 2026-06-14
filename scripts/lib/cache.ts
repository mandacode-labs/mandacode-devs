import fs from "node:fs";
import { PATHS } from "./config.js";

interface CacheData {
  translate?: Record<string, string>;
  proofread?: Record<string, string>;
  style?: Record<string, string>;
}

function loadCache(): CacheData {
  try {
    return JSON.parse(fs.readFileSync(PATHS.cache, "utf-8"));
  } catch {
    return {};
  }
}

function saveCache(cache: CacheData): void {
  fs.writeFileSync(PATHS.cache, JSON.stringify(cache, null, 2) + "\n");
}

export function getCacheHash(
  section: keyof CacheData,
  key: string,
): string | undefined {
  const cache = loadCache();
  return cache[section]?.[key];
}

export function setCacheHash(
  section: keyof CacheData,
  key: string,
  hash: string,
): void {
  const cache = loadCache();
  if (!cache[section]) cache[section] = {};
  cache[section]![key] = hash;
  saveCache(cache);
}

export function removeCacheKey(section: keyof CacheData, key: string): void {
  const cache = loadCache();
  if (cache[section]) {
    delete cache[section]![key];
    saveCache(cache);
  }
}

export function getContentCacheKey(
  collection: string,
  slug: string,
  lang: string,
  operation: keyof CacheData,
): string {
  return `${collection}/${slug}/${lang}:${operation}`;
}

export function getUICacheKey(
  lang: string,
  operation: keyof CacheData,
): string {
  return `ui:${lang}:${operation}`;
}
