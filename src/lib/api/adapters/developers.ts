import * as developersRepo from "@/lib/db/developers";
import * as tagsRepo from "@/lib/db/tags";
import {
  createDeveloperSchema,
  updateDeveloperSchema,
} from "@/lib/api/validation";
import { ApiError } from "@/lib/api/response";
import type { AdminCrudAdapter } from "@/lib/api/admin-crud";
import { hashContent } from "@/lib/hash";
import type { DeveloperTranslation } from "@/lib/db/schema";
import type { z } from "zod";

type CreateBody = z.infer<typeof createDeveloperSchema>;
type UpdateBody = z.infer<typeof updateDeveloperSchema>;

export const developerAdapter: AdminCrudAdapter<
  CreateBody,
  UpdateBody,
  DeveloperTranslation
> = {
  entityType: "developer",
  entityName: "Developer",
  createSchema: createDeveloperSchema,
  updateSchema: updateDeveloperSchema,
  getById: developersRepo.getDeveloperTranslationById,
  create: async (body, user) => {
    const publishedAt =
      body.publish_status === "published" ? new Date().toISOString() : null;
    const originalLocale = body.original_locale ?? body.locale;

    await developersRepo.createDeveloper({
      id: body.id,
      author_id: user.email,
      github_url: body.github_url ?? null,
      email: body.email ?? null,
      website_url: body.website_url ?? null,
      original_locale: originalLocale,
    });

    await tagsRepo.setDeveloperTags(body.id, body.tech_stack ?? []);

    await developersRepo.createDeveloperTranslation({
      id: `${body.id}_${originalLocale}`,
      developer_id: body.id,
      locale: originalLocale,
      name: body.name,
      role: body.role,
      bio: body.bio,
      tiptap_json: body.tiptap_json,
      avatar_url: body.avatar_url ?? null,
      publish_status: body.publish_status,
      published_at: publishedAt,
      source_hash: await hashContent(body.tiptap_json),
    });
  },
  update: async (id, locale, body, existing, user) => {
    const mainUpdate: developersRepo.UpdateDeveloperInput = {
      github_url: body.github_url,
      email: body.email,
      website_url: body.website_url,
      original_locale: body.original_locale,
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
      if (
        body.publish_status === "published" &&
        existing.publish_status !== "published" &&
        !existing.published_at
      ) {
        translationUpdate.published_at = new Date().toISOString();
      }
      const developerOriginalLocale =
        await developersRepo.getDeveloperOriginalLocale(id);
      let newSourceHash: string | null = null;
      if (
        locale === developerOriginalLocale &&
        body.tiptap_json !== undefined
      ) {
        newSourceHash = await hashContent(body.tiptap_json);
        translationUpdate.source_hash = newSourceHash;
      }
      await developersRepo.updateDeveloperTranslation(
        id,
        locale,
        translationUpdate,
      );

      if (newSourceHash !== null) {
        await developersRepo.updateDeveloperTranslationsCascade(
          id,
          locale,
          newSourceHash,
        );
      }
    } else {
      if (body.publish_status === "published") {
        translationUpdate.published_at = new Date().toISOString();
      }
      const newTiprapJson =
        body.tiptap_json ?? JSON.stringify({ type: "doc", content: [] });
      const developerOriginalLocale =
        await developersRepo.getDeveloperOriginalLocale(id);
      const originalDev = await developersRepo.getDeveloperTranslationById(
        id,
        developerOriginalLocale,
      );
      const sourceHash = originalDev
        ? await hashContent(originalDev.tiptap_json)
        : await hashContent(newTiprapJson);
      await developersRepo.createDeveloperTranslation({
        id: `${id}_${locale}`,
        developer_id: id,
        locale,
        name: body.name ?? "",
        role: body.role ?? "",
        bio: body.bio ?? "",
        tiptap_json: newTiprapJson,
        avatar_url: body.avatar_url ?? null,
        publish_status: body.publish_status ?? "draft",
        published_at: translationUpdate.published_at ?? null,
        source_hash: sourceHash,
      });
    }

    if (body.tech_stack !== undefined && body.tech_stack !== null) {
      await tagsRepo.setDeveloperTags(id, body.tech_stack);
    }
  },
  getLocales: developersRepo.getDeveloperLocales,
  getLocalesWithContent: developersRepo.getDeveloperLocalesWithContent,
  delete: async (id, locale) => {
    if (!locale) {
      throw new ApiError("Missing locale", 400);
    }
    const developer = await developersRepo.getDeveloperById(id, locale);
    if (developer && developer.original_locale === locale) {
      throw new ApiError("Cannot delete original locale translation", 400);
    }
    await developersRepo.deleteDeveloperTranslation(id, locale);
  },
  deleteAllLocales: async (id) => {
    await developersRepo.deleteAllDeveloperTranslations(id);
    await developersRepo.deleteDeveloper(id);
  },
  getImageUrls: (body) => ({
    avatar_url: body.avatar_url ?? null,
  }),
};
