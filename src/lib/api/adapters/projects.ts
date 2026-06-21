import * as projectsRepo from "@/lib/db/projects";
import * as tagsRepo from "@/lib/db/tags";
import { createProjectSchema, updateProjectSchema } from "@/lib/api/validation";
import { ApiError } from "@/lib/api/response";
import type { AdminCrudAdapter } from "@/lib/api/admin-crud";
import type { z } from "zod";

type CreateBody = z.infer<typeof createProjectSchema>;
type UpdateBody = z.infer<typeof updateProjectSchema>;

interface ExistingProjectTranslation {
  publish_status: string;
  published_at: string | null;
}

export const projectAdapter: AdminCrudAdapter<CreateBody, UpdateBody> = {
  entityType: "project",
  entityName: "Project",
  createSchema: createProjectSchema,
  updateSchema: updateProjectSchema,
  getById: projectsRepo.getProjectTranslationById,
  create: async (body, user) => {
    const publishedAt =
      body.publish_status === "published" ? new Date().toISOString() : null;

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
      original_locale: body.locale,
    });

    await projectsRepo.createProjectTranslation({
      id: `${body.id}_${body.locale}`,
      project_id: body.id,
      locale: body.locale,
      title: body.title,
      description: body.description ?? null,
      tiptap_json: body.tiptap_json,
      role: body.role,
      cover_image_url: body.cover_image_url ?? null,
      publish_status: body.publish_status,
      published_at: publishedAt,
    });

    await tagsRepo.setProjectTags(body.id, body.tags);
  },
  update: async (id, locale, body, existing) => {
    if (!existing) {
      throw new ApiError("Project translation not found", 404);
    }

    const existingProject = existing as ExistingProjectTranslation;
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
      existingProject.publish_status !== "published" &&
      !existingProject.published_at
    ) {
      translationUpdate.published_at = new Date().toISOString();
    }

    await projectsRepo.updateProjectTranslation(id, locale, translationUpdate);

    if (body.tags !== undefined) {
      await tagsRepo.setProjectTags(id, body.tags);
    }
  },
  getLocales: projectsRepo.getProjectLocales,
  getLocalesWithContent: projectsRepo.getProjectLocalesWithContent,
  delete: async (id, locale) => {
    const project = await projectsRepo.getProjectById(id, locale);
    if (project && project.original_locale === locale) {
      throw new ApiError("Cannot delete original locale translation", 400);
    }
    await tagsRepo.deleteProjectTags(id);
    await projectsRepo.deleteProjectTranslation(id, locale as string);
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
