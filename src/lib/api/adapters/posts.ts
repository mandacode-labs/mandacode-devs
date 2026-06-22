import { ulid } from "ulid";
import * as postsRepo from "@/lib/db/posts";
import * as tagsRepo from "@/lib/db/tags";
import { createPostSchema, updatePostSchema } from "@/lib/api/validation";
import { ApiError } from "@/lib/api/response";
import type { AdminCrudAdapter } from "@/lib/api/admin-crud";
import { hashContent } from "@/lib/hash";
import type { PostTranslation } from "@/lib/db/schema";
import type { z } from "zod";

type CreateBody = z.infer<typeof createPostSchema>;
type UpdateBody = z.infer<typeof updatePostSchema>;

export const postAdapter: AdminCrudAdapter<
  CreateBody,
  UpdateBody,
  PostTranslation
> = {
  entityType: "post",
  entityName: "Post",
  createSchema: createPostSchema,
  updateSchema: updatePostSchema,
  getById: postsRepo.getPostTranslationById,
  create: async (body, user) => {
    const publishedAt =
      body.publish_status === "published" ? new Date().toISOString() : null;
    const originalLocale = body.original_locale ?? body.locale;

    await postsRepo.createPost({
      id: body.id,
      author_id: user.email,
      original_locale: originalLocale,
    });

    await postsRepo.createPostTranslation({
      id: `${body.id}_${originalLocale}`,
      post_id: body.id,
      locale: originalLocale,
      title: body.title,
      description: body.description ?? null,
      tiptap_json: body.tiptap_json,
      cover_image_url: body.cover_image_url ?? null,
      publish_status: body.publish_status,
      published_at: publishedAt,
    });

    await tagsRepo.setPostTags(body.id, body.tags);
  },
  update: async (id, locale, body, existing) => {
    if (!existing) {
      throw new ApiError("Post translation not found", 404);
    }

    const updateData: postsRepo.UpdatePostTranslationInput = {
      title: body.title,
      description: body.description,
      tiptap_json: body.tiptap_json,
      cover_image_url: body.cover_image_url,
      publish_status: body.publish_status,
    };

    if (
      body.publish_status === "published" &&
      existing.publish_status !== "published" &&
      !existing.published_at
    ) {
      updateData.published_at = new Date().toISOString();
    }

    await postsRepo.updatePostTranslation(id, locale, updateData);

    const postOriginalLocale = await postsRepo.getPostOriginalLocale(id);
    if (locale === postOriginalLocale && body.tiptap_json !== undefined) {
      const newSourceHash = await hashContent(body.tiptap_json);
      await postsRepo.updatePostTranslationsCascade(id, locale, newSourceHash);
    }

    if (body.original_locale !== undefined) {
      await postsRepo.updatePost(id, { original_locale: body.original_locale });
    }

    if (body.tags !== undefined) {
      await tagsRepo.setPostTags(id, body.tags);
    }
  },
  getLocales: postsRepo.getPostLocales,
  getLocalesWithContent: postsRepo.getPostLocalesWithContent,
  delete: async (id, locale) => {
    if (!locale) {
      throw new ApiError("Missing locale", 400);
    }
    const post = await postsRepo.getPostById(id, locale);
    if (post && post.original_locale === locale) {
      throw new ApiError("Cannot delete original locale translation", 400);
    }
    await tagsRepo.deletePostTags(id);
    await postsRepo.deletePostTranslation(id, locale);
  },
  deleteAllLocales: async (id) => {
    await tagsRepo.deletePostTags(id);
    await postsRepo.deleteAllPostTranslations(id);
    await postsRepo.deletePost(id);
  },
  getImageUrls: (body) => ({
    cover_image_url: body.cover_image_url ?? null,
  }),
};

export function generatePostTranslationId(
  postId: string,
  locale: string,
): string {
  return `${postId}_${locale}_${ulid()}`;
}
