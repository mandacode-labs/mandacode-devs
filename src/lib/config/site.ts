import { z } from "zod";

const siteConfigSchema = z.object({
  baseUrl: z.string().url(),
  r2PublicUrl: z.string().url(),
  staticAssetPath: z.string(),
});

import rawConfig from "../../../config/site.json";

const parsed = siteConfigSchema.parse({
  baseUrl: process.env.SITE_URL || rawConfig.baseUrl,
  r2PublicUrl: process.env.R2_PUBLIC_URL || rawConfig.r2PublicUrl,
  staticAssetPath: rawConfig.staticAssetPath,
});

export const SITE_CONFIG = parsed;

export function getSiteUrl(path = ""): string {
  return new URL(path, parsed.baseUrl).toString();
}

export function getStaticAssetUrl(asset: string): string {
  return `${parsed.r2PublicUrl}${parsed.staticAssetPath}/${asset}`;
}

export function getStaticAssetHost(): string {
  return parsed.r2PublicUrl;
}
