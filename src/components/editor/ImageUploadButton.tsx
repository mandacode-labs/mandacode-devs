import { useState, useRef } from "react";

interface ImageUploadButtonProps {
  onUpload: (url: string) => void;
}

export default function ImageUploadButton({
  onUpload,
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

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = (await response.json()) as { url: string };
      onUpload(data.url);
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
        disabled={isUploading}
        className="px-3 py-1 rounded text-sm bg-bg-primary hover:bg-bg-hover disabled:opacity-50"
      >
        {isUploading ? "Uploading..." : "Upload Image"}
      </button>
    </>
  );
}
