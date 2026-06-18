import { z } from "zod";
import { SUPPORTED_LANGUAGES } from "@/lib/config/languages";

const localeValues = [...SUPPORTED_LANGUAGES] as [string, ...string[]];
const localeSchema = z.enum(localeValues);

const publishStatusSchema = z.enum(["draft", "published", "archived"]);
const projectStatusSchema = z.enum([
  "production",
  "development",
  "planning",
  "completed",
]);

export const createPostSchema = z.object({
  id: z.string().min(1),
  locale: localeSchema,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  tiptap_json: z.string().min(1),
  publish_status: publishStatusSchema.default("draft"),
  hidden: z.boolean().default(false),
  pub_date: z.string().datetime(),
  cover_image_url: z.string().url().nullable().optional(),
  og_image_url: z.string().url().nullable().optional(),
  target_locales: z.array(localeSchema).default([]),
});

export const updatePostSchema = createPostSchema
  .omit({ id: true, locale: true })
  .partial()
  .extend({
    target_locales: z.array(localeSchema).optional(),
  });

export const createProjectSchema = z.object({
  id: z.string().min(1),
  locale: localeSchema,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  tiptap_json: z.string().min(1),
  publish_status: publishStatusSchema.default("draft"),
  hidden: z.boolean().default(false),
  project_status: projectStatusSchema,
  duration: z.string().min(1),
  team_size: z.number().int().positive(),
  role: z.string().min(1),
  project_order: z.number().int(),
  url: z.string().url().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  blog_url: z.string().url().nullable().optional(),
  cover_image_url: z.string().url().nullable().optional(),
  target_locales: z.array(localeSchema).default([]),
});

export const updateProjectSchema = createProjectSchema
  .omit({ id: true, locale: true })
  .partial()
  .extend({
    target_locales: z.array(localeSchema).optional(),
  });

export const createDeveloperSchema = z.object({
  id: z.string().min(1),
  locale: localeSchema,
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(1),
  tiptap_json: z.string().min(1),
  avatar_url: z.string().url().nullable().optional(),
  github_url: z.string().url().nullable().optional(),
  email: z.string().email().nullable().optional(),
  website_url: z.string().url().nullable().optional(),
  tech_stack: z.array(z.string()).nullable().optional(),
  certifications: z
    .array(z.record(z.string(), z.unknown()))
    .nullable()
    .optional(),
  education: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  published_at: z.string().datetime().nullable().optional(),
  target_locales: z.array(localeSchema).default([]),
});

export const updateDeveloperSchema = createDeveloperSchema
  .omit({ id: true, locale: true })
  .partial()
  .extend({
    target_locales: z.array(localeSchema).optional(),
  });

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateDeveloperInput = z.infer<typeof createDeveloperSchema>;
export type UpdateDeveloperInput = z.infer<typeof updateDeveloperSchema>;
