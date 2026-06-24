import type { APIContext, APIRoute } from "astro";
import type { z } from "zod";
import type { AuthUser } from "@/lib/auth";
import { requireAuth } from "@/lib/auth";
import { parseJsonBody } from "@/lib/api/request";
import { errorResponse, jsonResponse, ApiError } from "@/lib/api/response";
import { scheduleTranslations } from "@/lib/translation/scheduler";
import { invalidateContentCache } from "@/lib/cache";
import { SUPPORTED_LANGUAGES } from "@/lib/config/languages";
import {
  cleanupUnusedEntityAssets,
  deleteEntityDirectory,
  type EntityType as AssetEntityType,
} from "@/lib/assets";
import { extractAssetUrlsFromTiptapJson } from "@/lib/tiptap/extract";

export type AdminEntityType = AssetEntityType;

export interface LocaleContentRow {
  locale: string;
  intro: string;
  [field: string]: unknown;
}

interface CreateBody {
  id: string;
  locale: string;
  target_locales?: string[];
}

interface UpdateBody {
  intro?: string;
  body?: string;
  target_locales?: string[];
}

export interface AdminCrudAdapter<
  TCreate extends CreateBody,
  TUpdate extends UpdateBody,
  TExisting = unknown,
> {
  entityType: AdminEntityType;
  entityName: string;
  createSchema: z.ZodType<TCreate>;
  updateSchema: z.ZodType<TUpdate>;
  getById(id: string, locale: string): Promise<TExisting | null>;
  create(body: TCreate, user: AuthUser): Promise<void>;
  update(
    id: string,
    locale: string,
    body: TUpdate,
    existing: TExisting | null,
    user: AuthUser,
  ): Promise<void>;
  getLocales(id: string): Promise<string[]>;
  getLocalesWithContent(id: string): Promise<LocaleContentRow[]>;
  delete(id: string, locale?: string): Promise<void>;
  deleteAllLocales(id: string): Promise<void>;
  getImageUrls(body: TUpdate): Record<string, string | null>;
}

function safeWaitUntil(context: APIContext, promise: Promise<unknown>): void {
  context.locals.cfContext?.waitUntil(
    promise.catch((error) => {
      console.error("Background task failed:", error);
    }),
  );
}

async function cleanupEntityAssets<
  TCreate extends CreateBody,
  TUpdate extends UpdateBody,
  TExisting,
>(
  adapter: AdminCrudAdapter<TCreate, TUpdate, TExisting>,
  id: string,
  locale: string,
  tiptapJson: string | undefined,
  imageUrls: Record<string, string | null>,
): Promise<void> {
  const imageFields = Object.keys(imageUrls);
  const locales = await adapter.getLocalesWithContent(id);
  const usedUrls = new Set<string>();

  for (const row of locales) {
    if (row.locale === locale) {
      if (tiptapJson) {
        for (const url of extractAssetUrlsFromTiptapJson(
          tiptapJson as string,
        )) {
          usedUrls.add(url);
        }
      }
      for (const field of imageFields) {
        const value = imageUrls[field];
        if (value) usedUrls.add(value);
      }
    } else {
      for (const url of extractAssetUrlsFromTiptapJson(
        (row as { intro: string }).intro,
      )) {
        usedUrls.add(url);
      }
      for (const field of imageFields) {
        const value = row[field];
        if (typeof value === "string") usedUrls.add(value);
      }
    }
  }

  await cleanupUnusedEntityAssets(adapter.entityType, id, Array.from(usedUrls));
}

function getIdLocale(context: APIContext): { id: string; locale: string } {
  const id = context.params.id;
  const locale = context.url.searchParams.get("locale");

  if (!id || !locale) {
    throw new ApiError("Missing id or locale", 400);
  }

  return { id, locale };
}

export function createAdminGetHandler<
  TCreate extends CreateBody,
  TUpdate extends UpdateBody,
  TExisting,
>(adapter: AdminCrudAdapter<TCreate, TUpdate, TExisting>): APIRoute {
  return async (context) => {
    try {
      requireAuth(context);
      const { id, locale } = getIdLocale(context);

      const entity = await adapter.getById(id, locale);
      if (!entity) {
        throw new ApiError(`${adapter.entityName} not found`, 404);
      }

      return jsonResponse(entity);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function createAdminPostHandler<
  TCreate extends CreateBody,
  TUpdate extends UpdateBody,
  TExisting,
>(adapter: AdminCrudAdapter<TCreate, TUpdate, TExisting>): APIRoute {
  return async (context) => {
    try {
      const user = requireAuth(context);
      const body = await parseJsonBody(context.request, adapter.createSchema);

      const existing = await adapter.getById(body.id, body.locale);
      if (existing) {
        throw new ApiError(
          `${adapter.entityName} with id "${body.id}" and locale "${body.locale}" already exists`,
          409,
        );
      }

      await adapter.create(body, user);

      await scheduleTranslations(
        context,
        adapter.entityType,
        body.id,
        body.locale,
        body.target_locales ?? [],
        user.email,
      );

      safeWaitUntil(
        context,
        invalidateContentCache(
          adapter.entityType,
          body.id,
          SUPPORTED_LANGUAGES as string[],
        ),
      );

      return jsonResponse({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function createAdminPutHandler<
  TCreate extends CreateBody,
  TUpdate extends UpdateBody,
  TExisting,
>(adapter: AdminCrudAdapter<TCreate, TUpdate, TExisting>): APIRoute {
  return async (context) => {
    try {
      const user = requireAuth(context);
      const { id, locale } = getIdLocale(context);

      const existing = await adapter.getById(id, locale);
      const body = await parseJsonBody(context.request, adapter.updateSchema);

      await adapter.update(id, locale, body, existing, user);

      safeWaitUntil(
        context,
        cleanupEntityAssets(
          adapter,
          id,
          locale,
          body.intro,
          adapter.getImageUrls(body),
        ),
      );

      await scheduleTranslations(
        context,
        adapter.entityType,
        id,
        locale,
        body.target_locales ?? [],
        user.email,
      );

      safeWaitUntil(
        context,
        invalidateContentCache(
          adapter.entityType,
          id,
          SUPPORTED_LANGUAGES as string[],
        ),
      );

      return jsonResponse({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function createAdminDeleteHandler<
  TCreate extends CreateBody,
  TUpdate extends UpdateBody,
  TExisting,
>(adapter: AdminCrudAdapter<TCreate, TUpdate, TExisting>): APIRoute {
  return async (context) => {
    try {
      requireAuth(context);

      const id = context.params.id;
      const locale = context.url.searchParams.get("locale");
      const all = context.url.searchParams.get("all") === "true";
      const confirmation = context.url.searchParams.get("confirmation");

      if (!id) {
        throw new ApiError("Missing id", 400);
      }

      if (confirmation !== "delete") {
        throw new ApiError("Delete confirmation required", 400);
      }

      if (all) {
        await adapter.deleteAllLocales(id);
        safeWaitUntil(context, deleteEntityDirectory(adapter.entityType, id));
      } else {
        if (!locale) {
          throw new ApiError("Missing locale", 400);
        }
        const remainingLocales = await adapter.getLocales(id);
        await adapter.delete(id, locale);
        if (remainingLocales.length <= 1) {
          safeWaitUntil(context, deleteEntityDirectory(adapter.entityType, id));
        }
      }

      safeWaitUntil(
        context,
        invalidateContentCache(
          adapter.entityType,
          id,
          SUPPORTED_LANGUAGES as string[],
        ),
      );

      return jsonResponse({ success: true });
    } catch (error) {
      return errorResponse(error);
    }
  };
}
