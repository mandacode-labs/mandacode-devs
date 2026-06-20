import { useState, useEffect } from "react";
import TiptapEditor from "@/components/editor/TiptapEditor";
import ImageUploadButton from "@/components/editor/ImageUploadButton";
import DeleteModal from "@/components/admin/DeleteModal";
import { AdminSection } from "@/components/admin/AdminSection";
import { LANGUAGE_CONFIGS } from "@/lib/config/languages";
import { useAdminEditor } from "@/components/admin/use-admin-editor";
import {
  useAdminTranslations,
  type AdminTranslations,
} from "@/components/admin/use-admin-translations";

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
  translations: AdminTranslations;
}

export default function DeveloperEditor({
  initialData,
  translations,
}: DeveloperEditorProps) {
  const t = useAdminTranslations(translations);
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

  const {
    id,
    isEditMode,
    locale,
    setLocale,
    targetLocales,
    toggleTargetLocale,
    isSubmitting,
    isDeleting,
    showDeleteModal,
    setShowDeleteModal,
    toast,
    handleSubmit,
    handleDelete,
  } = useAdminEditor({
    initialId: initialData?.id,
    entityType: "developer",
    listPath: "/admin/developers",
    getSubmitBody: () => ({
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
    }),
  });

  useEffect(() => {
    if (initialData) {
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
  }, [initialData, setLocale]);

  const editorKey = `${id || "new"}-${locale}`;

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

      <AdminSection title={t("admin.basicInformation", "Basic Information")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-text-primary">ID</span>
            <input
              type="text"
              value={id}
              disabled
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              {t("admin.locale", "Locale")}
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
            <span className="text-sm font-medium text-text-primary">
              {t("admin.name", "Name")}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              {t("admin.role", "Role")}
            </span>
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
          <span className="text-sm font-medium text-text-primary">
            {t("admin.bio", "Bio")}
          </span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            required
            className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y"
          />
        </label>
      </AdminSection>

      <AdminSection title={t("admin.media", "Media")}>
        <label className="block">
          <span className="text-sm font-medium text-text-primary">
            {t("admin.avatarUrl", "Avatar URL")}
          </span>
          <div className="flex gap-2 mt-1.5">
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <ImageUploadButton
              onUpload={setAvatarUrl}
              entityType="developer"
              entityId={id}
            />
          </div>
        </label>
      </AdminSection>

      <AdminSection title={t("admin.links", "Links")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              {t("admin.githubUrl", "GitHub URL")}
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
              {t("admin.websiteUrl", "Website URL")}
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
          <span className="text-sm font-medium text-text-primary">
            {t("admin.email", "Email")}
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
      </AdminSection>

      <AdminSection title={t("admin.techStack", "Tech Stack")}>
        <label className="block">
          <span className="text-sm font-medium text-text-primary">
            {t("admin.techStack", "Tech Stack")}
          </span>
          <input
            type="text"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            placeholder={t(
              "admin.techStackPlaceholder",
              "React, TypeScript, Node.js",
            )}
            className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
      </AdminSection>

      <AdminSection title={t("admin.content", "Content")}>
        <div className="space-y-2">
          <span className="text-sm font-medium text-text-primary">
            {t("admin.content", "Body")}
          </span>
          <TiptapEditor
            key={editorKey}
            content={tiptapJson}
            onChange={setTiptapJson}
            placeholder="Write additional content..."
            entityType="developer"
            entityId={id}
          />
        </div>
      </AdminSection>

      <AdminSection title={t("admin.translations", "Translations")}>
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">
            {t(
              "admin.translateDescription",
              "Auto-translate to additional languages on save:",
            )}
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
      </AdminSection>

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
              ? t("admin.saving", "Saving...")
              : isEditMode
                ? t("admin.updateProfile", "Update Profile")
                : t("admin.saveProfile", "Save Profile")}
          </button>
          <a
            href="/admin/developers"
            className="px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
          >
            {t("admin.cancel", "Cancel")}
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
            {t("admin.delete", "Delete")}
          </button>
        )}
      </div>

      {showDeleteModal && (
        <DeleteModal
          title={t("admin.deleteProfile", "Delete developer profile?")}
          itemName={name || id}
          locale={locale}
          translations={translations}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </form>
  );
}
