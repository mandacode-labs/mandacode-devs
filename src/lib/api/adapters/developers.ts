import * as developersRepo from "@/lib/db/developers";
import {
  createDeveloperSchema,
  updateDeveloperSchema,
} from "@/lib/api/validation";
import { ApiError } from "@/lib/api/response";
import type { AdminCrudAdapter } from "@/lib/api/admin-crud";
import type { z } from "zod";

type CreateBody = z.infer<typeof createDeveloperSchema>;
type UpdateBody = z.infer<typeof updateDeveloperSchema>;

interface ExistingDeveloperTranslation {
  publish_status: string;
  published_at: string | null;
}

export const developerAdapter: AdminCrudAdapter<CreateBody, UpdateBody> = {
  entityType: "developer",
  entityName: "Developer",
  createSchema: createDeveloperSchema,
  updateSchema: updateDeveloperSchema,
  getById: developersRepo.getDeveloperTranslationById,
  create: async (body, user) => {
    const publishedAt =
      body.publish_status === "published" ? new Date().toISOString() : null;

    await developersRepo.createDeveloper({
      id: body.id,
      author_id: user.email,
      github_url: body.github_url ?? null,
      email: body.email ?? null,
      website_url: body.website_url ?? null,
      tech_stack: body.tech_stack ? JSON.stringify(body.tech_stack) : null,
      certifications: body.certifications
        ? JSON.stringify(body.certifications)
        : null,
      education: body.education ? JSON.stringify(body.education) : null,
      original_locale: body.locale,
    });

    await developersRepo.createDeveloperTranslation({
      id: `${body.id}_${body.locale}`,
      developer_id: body.id,
      locale: body.locale,
      name: body.name,
      role: body.role,
      bio: body.bio,
      tiptap_json: body.tiptap_json,
      avatar_url: body.avatar_url ?? null,
      publish_status: body.publish_status,
      published_at: publishedAt,
    });
  },
  update: async (id, locale, body, existing, user) => {
    const mainUpdate: developersRepo.UpdateDeveloperInput = {
      github_url: body.github_url,
      email: body.email,
      website_url: body.website_url,
      tech_stack: body.tech_stack ? JSON.stringify(body.tech_stack) : undefined,
      certifications: body.certifications
        ? JSON.stringify(body.certifications)
        : undefined,
      education: body.education ? JSON.stringify(body.education) : undefined,
    };

    await developersRepo.updateDeveloper(id, mainUpdate);

    const translationUpdate: developersRepo.UpdateDeveloperTranslationInput = {
      name: body.name,
      role: body.role,
      bio: body.bio,
      tiptap_json: body.tiptap_json,
      avatar_url: body.avatar_url,
      publish_status: body.publish_status,
    };

    if (existing) {
      const existingDeveloper = existing as ExistingDeveloperTranslation;
      if (
        body.publish_status === "published" &&
        existingDeveloper.publish_status !== "published" &&
        !existingDeveloper.published_at
      ) {
        translationUpdate.published_at = new Date().toISOString();
      }
      await developersRepo.updateDeveloperTranslation(
        id,
        locale,
        translationUpdate,
      );
    } else {
      if (body.publish_status === "published") {
        translationUpdate.published_at = new Date().toISOString();
      }
      await developersRepo.createDeveloperTranslation({
        id: `${id}_${locale}`,
        developer_id: id,
        locale,
        name: body.name ?? "",
        role: body.role ?? "",
        bio: body.bio ?? "",
        tiptap_json:
          body.tiptap_json ?? JSON.stringify({ type: "doc", content: [] }),
        avatar_url: body.avatar_url ?? null,
        publish_status: body.publish_status ?? "draft",
        published_at: translationUpdate.published_at ?? null,
      });
    }
  },
  getLocales: developersRepo.getDeveloperLocales,
  getLocalesWithContent: developersRepo.getDeveloperLocalesWithContent,
  delete: async (id, locale) => {
    const developer = await developersRepo.getDeveloperById(id, locale);
    if (developer && developer.original_locale === locale) {
      throw new ApiError("Cannot delete original locale translation", 400);
    }
    await developersRepo.deleteDeveloperTranslation(id, locale as string);
  },
  deleteAllLocales: async (id) => {
    await developersRepo.deleteAllDeveloperTranslations(id);
    await developersRepo.deleteDeveloper(id);
  },
  getImageUrls: (body) => ({
    avatar_url: body.avatar_url ?? null,
  }),
};
