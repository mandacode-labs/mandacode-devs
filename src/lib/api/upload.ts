export type UploadEntityType = "post" | "project" | "developer";

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export async function uploadEntityFile(
  entityType: UploadEntityType,
  entityId: string,
  file: File,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const params = new URLSearchParams();
  params.set("type", entityType);
  params.set("id", entityId);

  const response = await fetch(`/api/admin/upload?${params.toString()}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(body.error || "Upload failed");
  }

  return (await response.json()) as UploadResult;
}
