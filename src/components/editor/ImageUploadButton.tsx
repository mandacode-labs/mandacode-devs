import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
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
            <Loader2 className="animate-spin h-3.5 w-3.5" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5" />
            Upload
          </>
        )}
      </button>
    </>
  );
}
