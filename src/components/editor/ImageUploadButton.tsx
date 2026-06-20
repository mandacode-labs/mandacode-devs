import { useState, useRef } from "react";
import { uploadEntityFile } from "@/lib/api/upload";

export type ImageUploadEntityType = "post" | "project" | "developer";

interface ImageUploadButtonProps {
  onUpload: (url: string) => void;
  entityType: ImageUploadEntityType;
  entityId: string;
}

export default function ImageUploadButton({
  onUpload,
  entityType,
  entityId,
}: ImageUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!entityId) {
      alert("Entity ID is required to upload an image");
      return;
    }

    setIsUploading(true);

    try {
      const uploaded = await uploadEntityFile(entityType, entityId, file);
      onUpload(uploaded.url);
    } catch (error) {
      alert("Image upload failed");
      console.error(error);
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading || !entityId}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-50 transition-colors"
      >
        {isUploading ? (
          <>
            <svg
              className="animate-spin h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Uploading...
          </>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-3.5 h-3.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload
          </>
        )}
      </button>
    </>
  );
}
