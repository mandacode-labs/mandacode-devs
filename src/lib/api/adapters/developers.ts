import * as developersRepo from "@/lib/db/developers";
import {
  createDeveloperSchema,
  updateDeveloperSchema,
} from "@/lib/api/validation";
import { DEFAULT_LANGUAGE } from "@/lib/config/languages";
import type { AdminCrudAdapter } from "@/lib/api/admin-crud";
import type { z } from "zod";

type CreateBody = z.infer<typeof createDeveloperSchema>;
type UpdateBody = z.infer<typeof updateDeveloperSchema>;

export const developerAdapter: AdminCrudAdapter<CreateBody, UpdateBody> = {
  entityType: "developer",
  entityName: "Developer",
  createSchema: createDeveloperSchema,
  updateSchema: updateDeveloperSchema,
  getById: developersRepo.getDeveloperById,
  create: async (body, user) => {
    const publishedAt =
      body.published_at !== undefined && body.published_at !== null
        ? body.published_at
        : new Date().toISOString();

    await developersRepo.createDeveloper({
      id: body.id,
      locale: body.locale,
      origin: body.locale === DEFAULT_LANGUAGE ? null : DEFAULT_LANGUAGE,
      author_id: user.email,
      name: body.name,
      role: body.role,
      bio: body.bio,
      tiptap_json: body.tiptap_json,
      avatar_url: body.avatar_url ?? null,
      github_url: body.github_url ?? null,
      email: body.email ?? null,
      website_url: body.website_url ?? null,
      tech_stack: body.tech_stack ? JSON.stringify(body.tech_stack) : null,
      certifications: body.certifications
        ? JSON.stringify(body.certifications)
        : null,
      education: body.education ? JSON.stringify(body.education) : null,
      published_at: publishedAt,
    });
  },
  update: async (id, locale, body, existing, user) => {
    if (existing) {
      const updateData: developersRepo.UpdateDeveloperInput = {
        name: body.name,
        role: body.role,
        bio: body.bio,
        tiptap_json: body.tiptap_json,
        avatar_url: body.avatar_url,
        github_url: body.github_url,
        email: body.email,
        website_url: body.website_url,
        tech_stack: body.tech_stack
          ? JSON.stringify(body.tech_stack)
          : undefined,
        certifications: body.certifications
          ? JSON.stringify(body.certifications)
          : undefined,
        education: body.education ? JSON.stringify(body.education) : undefined,
        published_at: body.published_at,
      };

      await developersRepo.updateDeveloper(id, locale, updateData);
    } else {
      const publishedAt =
        body.published_at !== undefined && body.published_at !== null
          ? body.published_at
          : new Date().toISOString();

      await developersRepo.createDeveloper({
        id,
        locale,
        origin: locale === DEFAULT_LANGUAGE ? null : DEFAULT_LANGUAGE,
        author_id: user.email,
        name: body.name ?? "",
        role: body.role ?? "",
        bio: body.bio ?? "",
        tiptap_json:
          body.tiptap_json ?? JSON.stringify({ type: "doc", content: [] }),
        avatar_url: body.avatar_url ?? null,
        github_url: body.github_url ?? null,
        email: body.email ?? null,
        website_url: body.website_url ?? null,
        tech_stack: body.tech_stack ? JSON.stringify(body.tech_stack) : null,
        certifications: body.certifications
          ? JSON.stringify(body.certifications)
          : null,
        education: body.education ? JSON.stringify(body.education) : null,
        published_at: publishedAt,
      });
    }
  },
  getLocales: developersRepo.getDeveloperLocales,
  getLocalesWithContent: developersRepo.getDeveloperLocalesWithContent,
  delete: developersRepo.deleteDeveloper,
  deleteAllLocales: developersRepo.deleteAllDeveloperLocales,
  getImageUrls: (body) => ({
    avatar_url: body.avatar_url ?? null,
  }),
};
