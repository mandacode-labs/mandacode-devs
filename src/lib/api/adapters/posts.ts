import * as postsRepo from "@/lib/db/posts";
import * as tagsRepo from "@/lib/db/tags";
import { createPostSchema, updatePostSchema } from "@/lib/api/validation";
import { ApiError } from "@/lib/api/response";
import { DEFAULT_LANGUAGE } from "@/lib/config/languages";
import type { AdminCrudAdapter } from "@/lib/api/admin-crud";
import type { z } from "zod";

type CreateBody = z.infer<typeof createPostSchema>;
type UpdateBody = z.infer<typeof updatePostSchema>;

interface ExistingPost {
  publish_status: string;
  published_at: string | null;
}

export const postAdapter: AdminCrudAdapter<CreateBody, UpdateBody> = {
  entityType: "post",
  entityName: "Post",
  createSchema: createPostSchema,
  updateSchema: updatePostSchema,
  getById: postsRepo.getPostById,
  create: async (body, user) => {
    const publishedAt =
      body.publish_status === "published" ? new Date().toISOString() : null;

    await postsRepo.createPost({
      id: body.id,
      locale: body.locale,
      origin: body.locale === DEFAULT_LANGUAGE ? null : DEFAULT_LANGUAGE,
      author_id: user.email,
      title: body.title,
      description: body.description ?? null,
      tiptap_json: body.tiptap_json,
      publish_status: body.publish_status,
      pub_date: body.pub_date,
      cover_image_url: body.cover_image_url ?? null,
      published_at: publishedAt,
    });

    await tagsRepo.setPostTags(body.id, body.locale, body.tags);
  },
  update: async (id, locale, body, existing) => {
    if (!existing) {
      throw new ApiError("Post not found", 404);
    }

    const existingPost = existing as ExistingPost;
    const updateData: postsRepo.UpdatePostInput = {
      title: body.title,
      description: body.description,
      tiptap_json: body.tiptap_json,
      publish_status: body.publish_status,
      pub_date: body.pub_date,
      cover_image_url: body.cover_image_url,
    };

    if (
      body.publish_status === "published" &&
      existingPost.publish_status !== "published" &&
      !existingPost.published_at
    ) {
      updateData.published_at = new Date().toISOString();
    }

    await postsRepo.updatePost(id, locale, updateData);

    if (body.tags !== undefined) {
      await tagsRepo.setPostTags(id, locale, body.tags);
    }
  },
  getLocales: postsRepo.getPostLocales,
  getLocalesWithContent: postsRepo.getPostLocalesWithContent,
  delete: async (id, locale) => {
    await tagsRepo.deletePostTags(id, locale);
    await postsRepo.deletePost(id, locale);
  },
  deleteAllLocales: async (id) => {
    await tagsRepo.deletePostTags(id);
    await postsRepo.deleteAllPostLocales(id);
  },
  getImageUrls: (body) => ({
    cover_image_url: body.cover_image_url ?? null,
  }),
};
