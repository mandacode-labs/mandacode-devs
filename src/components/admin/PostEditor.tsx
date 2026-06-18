import { useState } from "react";
import TiptapEditor from "@/components/editor/TiptapEditor";
import ImageUploadButton from "@/components/editor/ImageUploadButton";

const LOCALES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];

interface PostEditorProps {
  initialId?: string;
}

export default function PostEditor({ initialId = "" }: PostEditorProps) {
  const [id, setId] = useState(initialId);
  const [locale, setLocale] = useState("ko");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tiptapJson, setTiptapJson] = useState(
    JSON.stringify({ type: "doc", content: [] }),
  );
  const [pubDate, setPubDate] = useState(new Date().toISOString().slice(0, 16));
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [insertedImageUrl, setInsertedImageUrl] = useState<string | undefined>(
    undefined,
  );
  const [publishStatus, setPublishStatus] = useState("draft");
  const [targetLocales, setTargetLocales] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTiptapImage = (url: string) => {
    setInsertedImageUrl(url);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          locale,
          title,
          description: description || null,
          tiptap_json: tiptapJson,
          publish_status: publishStatus,
          pub_date: new Date(pubDate).toISOString(),
          cover_image_url: coverImageUrl || null,
          og_image_url: ogImageUrl || null,
          target_locales: targetLocales,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to save");
      }

      alert("Saved successfully");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTargetLocale = (code: string) => {
    setTargetLocales((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">ID (Slug)</span>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Locale</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          >
            {LOCALES.map((loc) => (
              <option key={loc.code} value={loc.code}>
                {loc.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Publish Status</span>
          <select
            value={publishStatus}
            onChange={(e) => setPublishStatus(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Publish Date</span>
          <input
            type="datetime-local"
            value={pubDate}
            onChange={(e) => setPubDate(e.target.value)}
            required
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Cover Image URL</span>
          <div className="flex gap-2 mt-1">
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded bg-bg-primary"
            />
            <ImageUploadButton onUpload={setCoverImageUrl} />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium">OG Image URL</span>
          <div className="flex gap-2 mt-1">
            <input
              type="url"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded bg-bg-primary"
            />
            <ImageUploadButton onUpload={setOgImageUrl} />
          </div>
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Content</span>
          <ImageUploadButton onUpload={handleTiptapImage} />
        </div>
        <TiptapEditor
          content={tiptapJson}
          onChange={setTiptapJson}
          placeholder="Write your post content..."
          insertedImageUrl={insertedImageUrl}
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Auto-translate to:</span>
        <div className="flex gap-3">
          {LOCALES.filter((loc) => loc.code !== locale).map((loc) => (
            <label key={loc.code} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={targetLocales.includes(loc.code)}
                onChange={() => toggleTargetLocale(loc.code)}
              />
              <span>{loc.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-2 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Save Post"}
      </button>
    </form>
  );
}
