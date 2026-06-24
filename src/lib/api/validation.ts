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
export const educationStatusSchema = z.enum([
  "graduated",
  "enrolled",
  "withdrawn",
]);

const urlOrPathSchema = z
  .string()
  .refine(
    (value) =>
      value.startsWith("/") ||
      value.startsWith("http://") ||
      value.startsWith("https://"),
    {
      message: "Must be a URL or absolute path",
    },
  );

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
  .nullable();

export const postTranslationSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  article: z.string().min(1),
  cover_image_url: urlOrPathSchema.nullable().optional(),
  publish_status: publishStatusSchema.default("draft"),
});

export const createPostSchema = z.object({
  id: z.string().min(1),
  locale: localeSchema,
  original_locale: localeSchema.optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  article: z.string().min(1),
  publish_status: publishStatusSchema.default("draft"),
  cover_image_url: urlOrPathSchema.nullable().optional(),
  tags: z.array(z.string()).default([]),
  target_locales: z.array(localeSchema).default([]),
});

export const updatePostSchema = postTranslationSchema.partial().extend({
  original_locale: localeSchema.optional(),
  tags: z.array(z.string()).optional(),
  target_locales: z.array(localeSchema).optional(),
});

export const createProjectSchema = z.object({
  id: z.string().min(1),
  locale: localeSchema,
  original_locale: localeSchema.optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  article: z.string().min(1),
  publish_status: publishStatusSchema.default("draft"),
  project_status: projectStatusSchema,
  start_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
  team_size: z.number().int().positive(),
  role: z.string().min(1),
  project_order: z.number().int(),
  url: z.string().url().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  blog_post_id: z.string().min(1).nullable().optional(),
  cover_image_url: urlOrPathSchema.nullable().optional(),
  tags: z.array(z.string()).default([]),
  target_locales: z.array(localeSchema).default([]),
});

export const updateProjectSchema = z.object({
  original_locale: localeSchema.optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  article: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  cover_image_url: urlOrPathSchema.nullable().optional(),
  publish_status: publishStatusSchema.optional(),
  project_status: projectStatusSchema.optional(),
  start_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
  team_size: z.number().int().positive().optional(),
  project_order: z.number().int().optional(),
  url: z.string().url().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  blog_post_id: z.string().min(1).nullable().optional(),
  tags: z.array(z.string()).optional(),
  target_locales: z.array(localeSchema).optional(),
});

export const createDeveloperSchema = z.object({
  id: z.string().min(1),
  locale: localeSchema,
  original_locale: localeSchema.optional(),
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(1),
  article: z.string().min(1),
  body: z.string().min(1).optional(),
  avatar_url: urlOrPathSchema.nullable().optional(),
  publish_status: publishStatusSchema.default("draft"),
  github_url: z.string().url().nullable().optional(),
  email: z.string().email().nullable().optional(),
  website_url: z.string().url().nullable().optional(),
  tech_stack: z.array(z.string()).nullable().optional(),
  target_locales: z.array(localeSchema).default([]),
});

export const updateDeveloperSchema = z.object({
  original_locale: localeSchema.optional(),
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  bio: z.string().min(1).optional(),
  article: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  avatar_url: urlOrPathSchema.nullable().optional(),
  publish_status: publishStatusSchema.optional(),
  github_url: z.string().url().nullable().optional(),
  email: z.string().email().nullable().optional(),
  website_url: z.string().url().nullable().optional(),
  tech_stack: z.array(z.string()).nullable().optional(),
  target_locales: z.array(localeSchema).optional(),
});

// Certifications and education are managed via separate endpoints
// (see /api/admin/developers/[id]/certifications and .../education).

export const certificationTranslationInputSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().optional(),
  date: dateStringSchema,
  badge_url: urlOrPathSchema.nullable().optional(),
});

export const createCertificationSchema = z.object({
  locale: localeSchema,
  translation: certificationTranslationInputSchema,
});

export const updateCertificationTranslationSchema = z.object({
  locale: localeSchema,
  translation: certificationTranslationInputSchema,
});

export const reorderCertificationsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const educationTranslationInputSchema = z.object({
  institution: z.string().min(1),
  department: z.string().nullable().optional(),
  status: educationStatusSchema.nullable().optional(),
});

export const createEducationSchema = z.object({
  start_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
  locale: localeSchema,
  translation: educationTranslationInputSchema,
});

export const updateEducationSchema = z.object({
  start_date: dateStringSchema.optional(),
  end_date: dateStringSchema.optional(),
});

export const updateEducationTranslationSchema = z.object({
  locale: localeSchema,
  translation: educationTranslationInputSchema,
});

export const reorderEducationSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateDeveloperInput = z.infer<typeof createDeveloperSchema>;
export type UpdateDeveloperInput = z.infer<typeof updateDeveloperSchema>;
