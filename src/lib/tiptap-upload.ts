import { uploadEntityFile } from "@/lib/api/upload";
import type { UploadEntityType } from "@/lib/api/upload";
import { MAX_FILE_SIZE } from "@/lib/tiptap-utils";

export interface EntityUploadConfig {
  entityType: UploadEntityType;
  entityId: string;
}

export function createHandleImageUpload(config: EntityUploadConfig) {
  return async (
    file: File,
    onProgress?: (event: { progress: number }) => void,
    abortSignal?: AbortSignal,
  ): Promise<string> => {
    if (!file) {
      throw new Error("No file provided");
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`,
      );
    }

    if (abortSignal?.aborted) {
      throw new Error("Upload cancelled");
    }

    onProgress?.({ progress: 0 });

    const result = await uploadEntityFile(
      config.entityType,
      config.entityId,
      file,
    );

    onProgress?.({ progress: 100 });

    return result.url;
  };
}
