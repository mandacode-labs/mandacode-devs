import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    title_en: z.string(),
    description: z.string(),
    description_en: z.string(),
    url: z.string().url(),
    ogImage: z.string().optional(),
    coverImage: z.string().optional(),
    status: z.enum(["production", "development", "planning"]),
    techStack: z.array(z.string()),
    order: z.number(),
  }),
});

const developers = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/developers" }),
  schema: z.object({
    name: z.string(),
    name_en: z.string(),
    role: z.string(),
    role_en: z.string(),
    bio: z.string(),
    bio_en: z.string(),
    avatar: z.string().optional(),
    github: z.string().url().optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    title_en: z.string(),
    description: z.string(),
    description_en: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  projects,
  developers,
  blog,
};
