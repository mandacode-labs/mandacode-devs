import * as projectsRepo from "@/lib/db/projects";
import * as tagsRepo from "@/lib/db/tags";
import { createProjectSchema, updateProjectSchema } from "@/lib/api/validation";
import { ApiError } from "@/lib/api/response";
import type { AdminCrudAdapter } from "@/lib/api/admin-crud";
import { hashContent } from "@/lib/hash";
import type { ProjectTranslation } from "@/lib/db/schema";
import type { z } from "zod";

type CreateBody = z.infer<typeof createProjectSchema>;
type UpdateBody = z.infer<typeof updateProjectSchema>;

export const projectAdapter: AdminCrudAdapter<
  CreateBody,
  UpdateBody,
  ProjectTranslation
> = {
  entityType: "project",
  entityName: "Project",
  createSchema: createProjectSchema,
  updateSchema: updateProjectSchema,
  getById: projectsRepo.getProjectTranslationById,
  create: async (body, user) => {
    const publishedAt =
      body.publish_status === "published" ? new Date().toISOString() : null;
    const originalLocale = body.original_locale ?? body.locale;

    await projectsRepo.createProject({
      id: body.id,
      author_id: user.email,
      project_status: body.project_status,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      team_size: body.team_size,
      project_order: body.project_order,
      url: body.url ?? null,
      source_url: body.source_url ?? null,
      blog_url: body.blog_url ?? null,
      blog_post_id: body.blog_post_id ?? null,
      original_locale: originalLocale,
    });

    await projectsRepo.createProjectTranslation({
      id: `${body.id}_${originalLocale}`,
      project_id: body.id,
      locale: originalLocale,
      title: body.title,
      description: body.description ?? null,
      tiptap_json: body.tiptap_json,
      role: body.role,
      cover_image_url: body.cover_image_url ?? null,
      publish_status: body.publish_status,
      published_at: publishedAt,
      source_hash: await hashContent(body.tiptap_json),
    });

    await tagsRepo.setProjectTags(body.id, body.tags);
  },
  update: async (id, locale, body, existing) => {
    if (!existing) {
      throw new ApiError("Project translation not found", 404);
    }

    const translationUpdate: projectsRepo.UpdateProjectTranslationInput = {
      title: body.title,
      description: body.description,
      tiptap_json: body.tiptap_json,
      role: body.role,
      cover_image_url: body.cover_image_url,
      publish_status: body.publish_status,
    };

    if (
      body.publish_status === "published" &&
      existing.publish_status !== "published" &&
      !existing.published_at
    ) {
      translationUpdate.published_at = new Date().toISOString();
    }

    const projectOriginalLocale =
      await projectsRepo.getProjectOriginalLocale(id);
    let newSourceHash: string | null = null;
    if (locale === projectOriginalLocale && body.tiptap_json !== undefined) {
      newSourceHash = await hashContent(body.tiptap_json);
      translationUpdate.source_hash = newSourceHash;
    }

    await projectsRepo.updateProjectTranslation(id, locale, translationUpdate);

    if (newSourceHash !== null) {
      await projectsRepo.updateProjectTranslationsCascade(
        id,
        locale,
        newSourceHash,
      );
    }

    const mainUpdate: projectsRepo.UpdateProjectInput = {};
    if (body.original_locale !== undefined)
      mainUpdate.original_locale = body.original_locale;
    if (body.project_status !== undefined)
      mainUpdate.project_status = body.project_status;
    if (body.start_date !== undefined) mainUpdate.start_date = body.start_date;
    if (body.end_date !== undefined) mainUpdate.end_date = body.end_date;
    if (body.team_size !== undefined) mainUpdate.team_size = body.team_size;
    if (body.project_order !== undefined)
      mainUpdate.project_order = body.project_order;
    if (body.url !== undefined) mainUpdate.url = body.url;
    if (body.source_url !== undefined) mainUpdate.source_url = body.source_url;
    if (body.blog_url !== undefined) mainUpdate.blog_url = body.blog_url;
    if (body.blog_post_id !== undefined)
      mainUpdate.blog_post_id = body.blog_post_id;

    if (Object.keys(mainUpdate).length > 0) {
      await projectsRepo.updateProject(id, mainUpdate);
    }

    if (body.tags !== undefined) {
      await tagsRepo.setProjectTags(id, body.tags);
    }
  },
  getLocales: projectsRepo.getProjectLocales,
  getLocalesWithContent: projectsRepo.getProjectLocalesWithContent,
  delete: async (id, locale) => {
    if (!locale) {
      throw new ApiError("Missing locale", 400);
    }
    const project = await projectsRepo.getProjectById(id, locale);
    if (project && project.original_locale === locale) {
      throw new ApiError("Cannot delete original locale translation", 400);
    }
    await tagsRepo.deleteProjectTags(id);
    await projectsRepo.deleteProjectTranslation(id, locale);
  },
  deleteAllLocales: async (id) => {
    await tagsRepo.deleteProjectTags(id);
    await projectsRepo.deleteAllProjectTranslations(id);
    await projectsRepo.deleteProject(id);
  },
  getImageUrls: (body) => ({
    cover_image_url: body.cover_image_url ?? null,
  }),
};
