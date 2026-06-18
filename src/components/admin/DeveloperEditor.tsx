import { useCallback, useState, useEffect } from "react";
import TiptapEditor from "@/components/editor/TiptapEditor";
import ImageUploadButton from "@/components/editor/ImageUploadButton";
import DeleteModal from "@/components/admin/DeleteModal";
import { LANGUAGE_CONFIGS } from "@/lib/config/languages";

export interface DeveloperEditorInitialData {
  id: string;
  locale: string;
  name: string;
  role: string;
  bio: string;
  tiptap_json: string;
  avatar_url: string | null;
  github_url: string | null;
  email: string | null;
  website_url: string | null;
  tech_stack: string[] | null;
  certifications: Array<Record<string, unknown>> | null;
  education: Array<Record<string, unknown>> | null;
}

interface DeveloperEditorProps {
  initialData?: DeveloperEditorInitialData;
}

interface Toast {
  type: "success" | "error";
  message: string;
}

export default function DeveloperEditor({ initialData }: DeveloperEditorProps) {
  const isEditMode = !!initialData;
  const [id, setId] = useState(initialData?.id ?? "");
  const [locale, setLocale] = useState(initialData?.locale ?? "ko");
  const [name, setName] = useState(initialData?.name ?? "");
  const [role, setRole] = useState(initialData?.role ?? "");
  const [bio, setBio] = useState(initialData?.bio ?? "");
  const [tiptapJson, setTiptapJson] = useState(
    initialData?.tiptap_json ?? JSON.stringify({ type: "doc", content: [] }),
  );
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatar_url ?? "");
  const [githubUrl, setGithubUrl] = useState(initialData?.github_url ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.website_url ?? "");
  const [techStack, setTechStack] = useState(
    initialData?.tech_stack?.join(", ") ?? "",
  );
  const [insertedImageUrl, setInsertedImageUrl] = useState<string | undefined>(
    undefined,
  );
  const [targetLocales, setTargetLocales] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (initialData) {
      setId(initialData.id);
      setLocale(initialData.locale);
      setName(initialData.name);
      setRole(initialData.role);
      setBio(initialData.bio);
      setTiptapJson(initialData.tiptap_json);
      setAvatarUrl(initialData.avatar_url ?? "");
      setGithubUrl(initialData.github_url ?? "");
      setEmail(initialData.email ?? "");
      setWebsiteUrl(initialData.website_url ?? "");
      setTechStack(initialData.tech_stack?.join(", ") ?? "");
    }
  }, [initialData]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleTiptapImage = (url: string) => {
    setInsertedImageUrl(url);
  };

  const handleTiptapChange = useCallback((json: string) => {
    setTiptapJson(json);
  }, []);

  const editorKey = `${id || "new"}-${locale}`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const body = {
      name,
      role,
      bio,
      tiptap_json: tiptapJson,
      avatar_url: avatarUrl || null,
      github_url: githubUrl || null,
      email: email || null,
      website_url: websiteUrl || null,
      tech_stack: techStack ? techStack.split(",").map((s) => s.trim()) : null,
      certifications: null,
      education: null,
      target_locales: targetLocales,
    };

    try {
      const url = isEditMode
        ? `/api/admin/developers/${id}?locale=${encodeURIComponent(locale)}`
        : "/api/admin/developers";
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

      setToast({ type: "success", message: "Saved successfully" });
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to save",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (allLocales: boolean) => {
    if (!id || !locale) return;
    setIsDeleting(true);
    try {
      const params = new URLSearchParams();
      params.set("confirmation", "delete");
      if (!allLocales) params.set("locale", locale);
      else params.set("all", "true");

      const response = await fetch(
        `/api/admin/developers/${id}?${params.toString()}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to delete");
      }

      window.location.href = "/admin/developers";
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to delete",
      });
    }
  };

  const toggleTargetLocale = (code: string) => {
    setTargetLocales((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-border last:border-0 pb-6 last:pb-0">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
        {title}
      </h3>
      {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <Section title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              ID (Slug)
            </span>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={isEditMode}
              required
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              Locale
            </span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              disabled={isEditMode}
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {Object.values(LANGUAGE_CONFIGS).map((loc) => (
                <option key={loc.code} value={loc.code}>
                  {loc.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <label className="block">
            <span className="text-sm font-medium text-text-primary">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-primary">Role</span>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </label>
        </div>

        <label className="block mt-4">
          <span className="text-sm font-medium text-text-primary">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            required
            className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y"
          />
        </label>
      </Section>

      <Section title="Media">
        <label className="block">
          <span className="text-sm font-medium text-text-primary">
            Avatar URL
          </span>
          <div className="flex gap-2 mt-1.5">
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <ImageUploadButton onUpload={setAvatarUrl} />
          </div>
        </label>
      </Section>

      <Section title="Links">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              GitHub URL
            </span>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              Website URL
            </span>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </label>
        </div>

        <label className="block mt-4">
          <span className="text-sm font-medium text-text-primary">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
      </Section>

      <Section title="Tech Stack">
        <label className="block">
          <span className="text-sm font-medium text-text-primary">
            Tech Stack (comma separated)
          </span>
          <input
            type="text"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            placeholder="React, TypeScript, Node.js"
            className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
      </Section>

      <Section title="Content">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">Body</span>
            <ImageUploadButton onUpload={handleTiptapImage} />
          </div>
          <TiptapEditor
            key={editorKey}
            content={tiptapJson}
            onChange={handleTiptapChange}
            placeholder="Write additional content..."
            insertedImageUrl={insertedImageUrl}
          />
        </div>
      </Section>

      <Section title="Translations">
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">
            Auto-translate to additional languages on save:
          </p>
          <div className="flex flex-wrap gap-4">
              {Object.values(LANGUAGE_CONFIGS)
                .filter((loc) => loc.code !== locale)
                .map((loc) => (
                  <label key={loc.code} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={targetLocales.includes(loc.code)}
                      onChange={() => toggleTargetLocale(loc.code)}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="text-sm text-text-primary">{loc.label}</span>
                  </label>
                ))}
          </div>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-bg-secondary border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {isSubmitting && (
              <svg
                className="animate-spin h-4 w-4"
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
            )}
            {isSubmitting
              ? "Saving..."
              : isEditMode
                ? "Update Profile"
                : "Save Profile"}
          </button>
          <a
            href="/admin/developers"
            className="px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            Cancel
          </a>
        </div>

        {isEditMode && (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4"
            >
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete
          </button>
        )}
      </div>

      {showDeleteModal && (
        <DeleteModal
          title="Delete developer profile?"
          itemName={name || id}
          locale={locale}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </form>
  );
}
