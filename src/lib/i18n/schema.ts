import { z } from "zod";

export const localeSchema = z.record(z.string(), z.string());

export type Locale = z.infer<typeof localeSchema>;
