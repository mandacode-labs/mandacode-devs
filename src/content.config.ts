import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/projects",
    generateId: ({ entry, data }) => {
      const slug = entry.replace(/\/[^/]+\.md$/, "");
      const lang = entry.match(/\/([a-z]+)\.md$/)?.[1] ?? data.lang;
      return `${lang}/${slug}`;
    },
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    url: z.url().optional(),
    sourceUrl: z.url().optional(),
    blogUrl: z.string().optional(),
    coverImage: z.string().optional(),
    status: z.enum(["production", "development", "planning", "completed"]),
    tags: z.array(z.string()),
    duration: z.string(),
    teamSize: z.number(),
    role: z.string(),
    order: z.number(),
  }),
});

const developers = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/developers",
    generateId: ({ entry, data }) => {
      const slug = entry.replace(/\/[^/]+\.md$/, "");
      const lang = entry.match(/\/([a-z]+)\.md$/)?.[1] ?? data.lang;
      return `${lang}/${slug}`;
    },
  }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    avatar: z.string().optional(),
    github: z.url().optional(),
    email: z.email().optional(),
    website: z.url().optional(),
    techStack: z.array(z.string()).optional(),
    certifications: z
      .array(
        z.object({
          name: z.string(),
          issuer: z.string(),
          date: z.string(),
          url: z.url().optional(),
          badge: z.string().optional(),
        }),
      )
      .optional(),
    education: z
      .array(
        z.object({
          period: z.string(),
          institution: z.string(),
          department: z.string(),
          status: z.string(),
        }),
      )
      .optional(),
  }),
});

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/blog",
    generateId: ({ entry, data }) => {
      const slug = entry.replace(/\/[^/]+\.md$/, "");
      const lang = entry.match(/\/([a-z]+)\.md$/)?.[1] ?? data.lang;
      return `${lang}/${slug}`;
    },
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
    coverImage: z.string().optional(),
  }),
});

export const collections = {
  projects,
  developers,
  blog,
};
