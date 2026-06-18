import { useState, useEffect } from "react";
import TiptapEditor from "@/components/editor/TiptapEditor";
import ImageUploadButton from "@/components/editor/ImageUploadButton";

const LOCALES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];

export interface PostEditorInitialData {
  id: string;
  locale: string;
  title: string;
  description: string | null;
  tiptap_json: string;
  publish_status: string;
  hidden: boolean;
  pub_date: string;
  cover_image_url: string | null;
  og_image_url: string | null;
}

interface PostEditorProps {
  initialData?: PostEditorInitialData;
}

export default function PostEditor({ initialData }: PostEditorProps) {
  const isEditMode = !!initialData;
  const [id, setId] = useState(initialData?.id ?? "");
  const [locale, setLocale] = useState(initialData?.locale ?? "ko");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [tiptapJson, setTiptapJson] = useState(
    initialData?.tiptap_json ??
      JSON.stringify({ type: "doc", content: [] }),
  );
  const [pubDate, setPubDate] = useState(() => {
    if (initialData?.pub_date) {
      return new Date(initialData.pub_date).toISOString().slice(0, 16);
    }
    return new Date().toISOString().slice(0, 16);
  });
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialData?.cover_image_url ?? "",
  );
  const [ogImageUrl, setOgImageUrl] = useState(
    initialData?.og_image_url ?? "",
  );
  const [insertedImageUrl, setInsertedImageUrl] = useState<
    string | undefined
  >(undefined);
  const [publishStatus, setPublishStatus] = useState(
    initialData?.publish_status ?? "draft",
  );
  const [hidden, setHidden] = useState(initialData?.hidden ?? false);
  const [targetLocales, setTargetLocales] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setId(initialData.id);
      setLocale(initialData.locale);
      setTitle(initialData.title);
      setDescription(initialData.description ?? "");
      setTiptapJson(initialData.tiptap_json);
      setPubDate(new Date(initialData.pub_date).toISOString().slice(0, 16));
      setCoverImageUrl(initialData.cover_image_url ?? "");
      setOgImageUrl(initialData.og_image_url ?? "");
      setPublishStatus(initialData.publish_status);
      setHidden(initialData.hidden);
    }
  }, [initialData]);

  const handleTiptapImage = (url: string) => {
    setInsertedImageUrl(url);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const body = {
      title,
      description: description || null,
      tiptap_json: tiptapJson,
      publish_status: publishStatus,
      hidden,
      pub_date: new Date(pubDate).toISOString(),
      cover_image_url: coverImageUrl || null,
      og_image_url: ogImageUrl || null,
      target_locales: targetLocales,
    };

    try {
      const url = isEditMode
        ? `/api/admin/posts/${id}?locale=${encodeURIComponent(locale)}`
        : "/api/admin/posts";
      const response = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: isEditMode
          ? JSON.stringify(body)
          : JSON.stringify({ id, locale, ...body }),
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
            disabled={isEditMode}
            required
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary disabled:opacity-60"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Locale</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            disabled={isEditMode}
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary disabled:opacity-60"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <label className="flex items-center gap-2 px-3 py-2 border border-border rounded bg-bg-primary">
          <input
            type="checkbox"
            checked={hidden}
            onChange={(e) => setHidden(e.target.checked)}
          />
          <span className="text-sm font-medium">Hidden</span>
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
        {isSubmitting ? "Saving..." : isEditMode ? "Update Post" : "Save Post"}
      </button>
    </form>
  );
}
