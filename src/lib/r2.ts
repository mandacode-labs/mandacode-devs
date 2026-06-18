import { env } from "cloudflare:workers";
import { ApiError } from "@/lib/api/response";

function generateKey(filename: string): string {
  const random = crypto.randomUUID();
  const extension = filename.split(".").pop() || "";
  return extension ? `assets/${random}.${extension}` : `assets/${random}`;
}

function getPublicUrl(key: string): string {
  const baseUrl = env.R2_PUBLIC_URL;

  if (!baseUrl) {
    throw new ApiError("R2_PUBLIC_URL is not configured", 500);
  }

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}/${key}`;
}

export interface UploadedAsset {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export async function uploadFile(file: File): Promise<UploadedAsset> {
  const bucket = env.BUCKET;
  if (!bucket) {
    throw new ApiError("R2 bucket is not configured", 500);
  }

  const key = generateKey(file.name);
  const arrayBuffer = await file.arrayBuffer();

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
