import * as projectsRepo from "@/lib/db/projects";
import * as tagsRepo from "@/lib/db/tags";
import { createProjectSchema, updateProjectSchema } from "@/lib/api/validation";
import { ApiError } from "@/lib/api/response";
import { DEFAULT_LANGUAGE } from "@/lib/config/languages";
import type { AdminCrudAdapter } from "@/lib/api/admin-crud";
import type { z } from "zod";

type CreateBody = z.infer<typeof createProjectSchema>;
type UpdateBody = z.infer<typeof updateProjectSchema>;

interface ExistingProject {
  publish_status: string;
  published_at: string | null;
}

export const projectAdapter: AdminCrudAdapter<CreateBody, UpdateBody> = {
  entityType: "project",
  entityName: "Project",
  createSchema: createProjectSchema,
  updateSchema: updateProjectSchema,
  getById: projectsRepo.getProjectById,
  create: async (body, user) => {
    const publishedAt =
      body.publish_status === "published" ? new Date().toISOString() : null;

    await projectsRepo.createProject({
      id: body.id,
      locale: body.locale,
      origin: body.locale === DEFAULT_LANGUAGE ? null : DEFAULT_LANGUAGE,
      author_id: user.email,
      title: body.title,
      description: body.description ?? null,
      tiptap_json: body.tiptap_json,
      publish_status: body.publish_status,
      project_status: body.project_status,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      team_size: body.team_size,
      role: body.role,
      project_order: body.project_order,
      url: body.url ?? null,
      source_url: body.source_url ?? null,
      blog_url: body.blog_url ?? null,
      cover_image_url: body.cover_image_url ?? null,
      published_at: publishedAt,
    });

    await tagsRepo.setProjectTags(body.id, body.locale, body.tags);
  },
  update: async (id, locale, body, existing) => {
    if (!existing) {
      throw new ApiError("Project not found", 404);
    }

    const existingProject = existing as ExistingProject;
    const updateData: projectsRepo.UpdateProjectInput = {
      title: body.title,
      description: body.description,
      tiptap_json: body.tiptap_json,
      publish_status: body.publish_status,
      project_status: body.project_status,
      start_date: body.start_date,
      end_date: body.end_date,
      team_size: body.team_size,
      role: body.role,
      project_order: body.project_order,
      url: body.url,
      source_url: body.source_url,
      blog_url: body.blog_url,
      cover_image_url: body.cover_image_url,
    };

    if (
      body.publish_status === "published" &&
      existingProject.publish_status !== "published" &&
      !existingProject.published_at
    ) {
      updateData.published_at = new Date().toISOString();
    }

    await projectsRepo.updateProject(id, locale, updateData);

    if (body.tags !== undefined) {
      await tagsRepo.setProjectTags(id, locale, body.tags);
    }
  },
  getLocales: projectsRepo.getProjectLocales,
  getLocalesWithContent: projectsRepo.getProjectLocalesWithContent,
  delete: async (id, locale) => {
    await tagsRepo.deleteProjectTags(id, locale);
    await projectsRepo.deleteProject(id, locale);
  },
  deleteAllLocales: async (id) => {
    await tagsRepo.deleteProjectTags(id);
    await projectsRepo.deleteAllProjectLocales(id);
  },
  getImageUrls: (body) => ({
    cover_image_url: body.cover_image_url ?? null,
  }),
};
