import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    url: z.url(),
    coverImage: z.string().optional(),
    status: z.enum(["production", "development", "planning", "completed"]),
    techStack: z.array(z.string()),
    order: z.number(),
    lang: z.string(),
  }),
});

const developers = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/developers" }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    avatar: z.string().optional(),
    github: z.url().optional(),
    email: z.email().optional(),
    website: z.url().optional(),
    lang: z.string(),
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
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
    coverImage: z.string().optional(),
    ogImage: z.string().optional(),
    lang: z.string(),
  }),
});

export const collections = {
  projects,
  developers,
  blog,
};
