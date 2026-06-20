import { env } from "cloudflare:workers";
import { ApiError } from "@/lib/api/response";
import { generateEntityId } from "@/lib/id";

export type EntityType = "post" | "project" | "developer";

export interface UploadedAsset {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

const ENTITY_PREFIX: Record<EntityType, string> = {
  post: "post-images",
  project: "project-images",
  developer: "developer-images",
};

const DEV_PREFIX = "dev/";

function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function getEnvPrefix(): string {
  return import.meta.env.DEV ? DEV_PREFIX : "";
}

function generateKey(
  entityType: EntityType,
  entityId: string,
  filename: string,
): string {
  const extension = getExtension(filename);
  const base = `${getEnvPrefix()}${ENTITY_PREFIX[entityType]}/${entityId}/${generateEntityId()}`;
  return extension ? `${base}.${extension}` : base;
}

function getPublicUrl(key: string): string {
  const baseUrl = env.R2_PUBLIC_URL;

  if (!baseUrl) {
    throw new ApiError("R2_PUBLIC_URL is not configured", 500);
  }

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}/${key}`;
}

function getEntityPrefix(entityType: EntityType): string {
  return `${getEnvPrefix()}${ENTITY_PREFIX[entityType]}`;
}

export async function uploadEntityFile(
  entityType: EntityType,
  entityId: string,
  file: File,
): Promise<UploadedAsset> {
  const key = generateKey(entityType, entityId, file.name);
  const arrayBuffer = await file.arrayBuffer();

  const bucket = env.BUCKET;
  if (!bucket) {
    throw new ApiError("R2 bucket is not configured", 500);
  }

  await bucket.put(key, arrayBuffer, {
    httpMetadata: {
      contentType: file.type || "application/octet-stream",
    },
  });

  return {
    key,
    url: getPublicUrl(key),
    size: arrayBuffer.byteLength,
    contentType: file.type || "application/octet-stream",
  };
}

export async function deleteEntityDirectory(
  entityType: EntityType,
  entityId: string,
): Promise<void> {
  const prefix = `${getEntityPrefix(entityType)}/${entityId}/`;

  const bucket = env.BUCKET;
  if (!bucket) {
    return;
  }

  const listed = await bucket.list({ prefix });
  const keys = listed.objects.map((object: { key: string }) => object.key);

  if (keys.length === 0) {
    return;
  }

  await bucket.delete(keys);
}

export function getEntityPrefixFromUrl(url: string): {
  entityType: EntityType;
  entityId: string;
} | null {
  for (const [type, prefix] of Object.entries(ENTITY_PREFIX)) {
    if (url.includes(`/${prefix}/`)) {
      const match = url.match(new RegExp(`/${prefix}/([^/]+)/`));
      if (match) {
        return {
          entityType: type as EntityType,
          entityId: match[1],
        };
      }
    }
  }
  return null;
}

export async function cleanupUnusedEntityAssets(
  entityType: EntityType,
  entityId: string,
  usedUrls: string[],
): Promise<void> {
  const prefix = `${getEntityPrefix(entityType)}/${entityId}/`;
  const usedSet = new Set(usedUrls);

  const bucket = env.BUCKET;
  if (!bucket) {
    return;
  }

  const listed = await bucket.list({ prefix });
  const keysToDelete = listed.objects
    .map((object: { key: string }) => ({
      key: object.key,
      url: getPublicUrl(object.key),
    }))
    .filter(({ url }: { url: string }) => !usedSet.has(url))
    .map(({ key }: { key: string }) => key);

  if (keysToDelete.length > 0) {
    await bucket.delete(keysToDelete);
  }
}
