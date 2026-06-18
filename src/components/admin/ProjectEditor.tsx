import { useState, useEffect } from "react";
import TiptapEditor from "@/components/editor/TiptapEditor";
import ImageUploadButton from "@/components/editor/ImageUploadButton";

const LOCALES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];

const PROJECT_STATUS_OPTIONS = [
  { value: "production", label: "Production" },
  { value: "development", label: "Development" },
  { value: "planning", label: "Planning" },
  { value: "completed", label: "Completed" },
];

export interface ProjectEditorInitialData {
  id: string;
  locale: string;
  title: string;
  description: string | null;
  tiptap_json: string;
  publish_status: string;
  hidden: boolean;
  project_status: string;
  duration: string;
  team_size: number;
  role: string;
  project_order: number;
  url: string | null;
  source_url: string | null;
  blog_url: string | null;
  cover_image_url: string | null;
}

interface ProjectEditorProps {
  initialData?: ProjectEditorInitialData;
}

export default function ProjectEditor({ initialData }: ProjectEditorProps) {
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
  const [projectStatus, setProjectStatus] = useState(
    initialData?.project_status ?? "development",
  );
  const [duration, setDuration] = useState(initialData?.duration ?? "");
  const [teamSize, setTeamSize] = useState(initialData?.team_size ?? 1);
  const [role, setRole] = useState(initialData?.role ?? "");
  const [projectOrder, setProjectOrder] = useState(
    initialData?.project_order ?? 0,
  );
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [sourceUrl, setSourceUrl] = useState(initialData?.source_url ?? "");
  const [blogUrl, setBlogUrl] = useState(initialData?.blog_url ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialData?.cover_image_url ?? "",
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
      setProjectStatus(initialData.project_status);
      setDuration(initialData.duration);
      setTeamSize(initialData.team_size);
      setRole(initialData.role);
      setProjectOrder(initialData.project_order);
      setUrl(initialData.url ?? "");
      setSourceUrl(initialData.source_url ?? "");
      setBlogUrl(initialData.blog_url ?? "");
      setCoverImageUrl(initialData.cover_image_url ?? "");
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
      project_status: projectStatus,
      duration,
      team_size: teamSize,
      role,
      project_order: projectOrder,
      url: url || null,
      source_url: sourceUrl || null,
      blog_url: blogUrl || null,
      cover_image_url: coverImageUrl || null,
      target_locales: targetLocales,
    };

    try {
      const url = isEditMode
        ? `/api/admin/projects/${id}?locale=${encodeURIComponent(locale)}`
        : "/api/admin/projects";
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
          <span className="text-sm font-medium">Project Status</span>
          <select
            value={projectStatus}
            onChange={(e) => setProjectStatus(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          >
            {PROJECT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

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

        <label className="flex items-center gap-2 px-3 py-2 border border-border rounded bg-bg-primary">
          <input
            type="checkbox"
            checked={hidden}
            onChange={(e) => setHidden(e.target.checked)}
          />
          <span className="text-sm font-medium">Hidden</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Duration</span>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Team Size</span>
          <input
            type="number"
            min={1}
            value={teamSize}
            onChange={(e) => setTeamSize(Number(e.target.value))}
            required
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Order</span>
          <input
            type="number"
            value={projectOrder}
            onChange={(e) => setProjectOrder(Number(e.target.value))}
            required
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium">Role</span>
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
          className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="block">
          <span className="text-sm font-medium">URL</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Source URL</span>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Blog URL</span>
          <input
            type="url"
            value={blogUrl}
            onChange={(e) => setBlogUrl(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          />
        </label>
      </div>

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Content</span>
          <ImageUploadButton onUpload={handleTiptapImage} />
        </div>
        <TiptapEditor
          content={tiptapJson}
          onChange={setTiptapJson}
          placeholder="Write your project content..."
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
        {isSubmitting
          ? "Saving..."
          : isEditMode
            ? "Update Project"
            : "Save Project"}
      </button>
    </form>
  );
}
