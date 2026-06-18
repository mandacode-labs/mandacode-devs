import { useState } from "react";
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

export default function ProjectEditor() {
  const [id, setId] = useState("");
  const [locale, setLocale] = useState("ko");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tiptapJson, setTiptapJson] = useState(
    JSON.stringify({ type: "doc", content: [] }),
  );
  const [projectStatus, setProjectStatus] = useState("development");
  const [duration, setDuration] = useState("");
  const [teamSize, setTeamSize] = useState(1);
  const [role, setRole] = useState("");
  const [projectOrder, setProjectOrder] = useState(0);
  const [url, setUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [blogUrl, setBlogUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
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
      const response = await fetch("/api/admin/projects", {
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
        {isSubmitting ? "Saving..." : "Save Project"}
      </button>
    </form>
  );
}
