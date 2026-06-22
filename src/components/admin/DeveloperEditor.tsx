import { useState, useEffect } from "react";
import TiptapEditor from "@/components/editor/TiptapEditor";
import ImageUploadButton from "@/components/editor/ImageUploadButton";
import { AdminSection } from "@/components/admin/AdminSection";
import { TranslationsSection } from "@/components/admin/TranslationsSection";
import { StickyEditorActions } from "@/components/admin/StickyEditorActions";
import { LANGUAGE_CONFIGS } from "@/lib/config/languages";
import { useAdminEditor } from "@/components/admin/use-admin-editor";
import {
  useAdminTranslations,
  type AdminTranslations,
} from "@/components/admin/use-admin-translations";

export interface DeveloperEditorInitialData {
  id: string;
  locale: string;
  original_locale: string;
  existing_locales: string[];
  name: string;
  role: string;
  bio: string;
  tiptap_json: string;
  avatar_url: string | null;
  publish_status: string;
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
  const [publishStatus, setPublishStatus] = useState(
    initialData?.publish_status ?? "draft",
  );
  const [githubUrl, setGithubUrl] = useState(initialData?.github_url ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.website_url ?? "");
  const [techStack, setTechStack] = useState(
    initialData?.tech_stack?.join(", ") ?? "",
  );
  const [certifications, setCertifications] = useState<Array<
    Record<string, unknown>
  > | null>(initialData?.certifications ?? null);
  const [education, setEducation] = useState<Array<
    Record<string, unknown>
  > | null>(initialData?.education ?? null);

  const {
    id,
    isEditMode,
    locale,
    setLocale,
    originalLocale,
    setOriginalLocale,
    existingLocales,
    targetLocales,
    toggleTargetLocale,
    isSubmitting,
    isSettingOriginal,
    setAsOriginalLocale,
    isDeleting,
    showDeleteModal,
    setShowDeleteModal,
    toast,
    handleSubmit,
    handleDelete,
  } = useAdminEditor({
    initialId: initialData?.id,
    initialLocale: initialData?.locale,
    initialOriginalLocale: initialData?.original_locale,
    existingLocales: initialData?.existing_locales ?? [],
    entityType: "developer",
    listPath: "/admin/developers",
    getSubmitBody: () => ({
      name,
      role,
      bio,
      tiptap_json: tiptapJson,
      avatar_url: avatarUrl || null,
      publish_status: publishStatus,
      github_url: githubUrl || null,
      email: email || null,
      website_url: websiteUrl || null,
      tech_stack: techStack ? techStack.split(",").map((s) => s.trim()) : null,
      certifications,
      education,
      target_locales: targetLocales,
    }),
  });

  useEffect(() => {
    if (initialData) {
      setLocale(initialData.locale);
      setOriginalLocale(initialData.original_locale);
      setName(initialData.name);
      setRole(initialData.role);
      setBio(initialData.bio);
      setTiptapJson(initialData.tiptap_json);
      setAvatarUrl(initialData.avatar_url ?? "");
      setPublishStatus(initialData.publish_status);
      setGithubUrl(initialData.github_url ?? "");
      setEmail(initialData.email ?? "");
      setWebsiteUrl(initialData.website_url ?? "");
      setTechStack(initialData.tech_stack?.join(", ") ?? "");
      setCertifications(initialData.certifications);
      setEducation(initialData.education);
    }
  }, [initialData, setLocale, setOriginalLocale]);

  useEffect(() => {
    if (!isEditMode) {
      setOriginalLocale(locale);
    }
  }, [isEditMode, locale, setOriginalLocale]);

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

      <AdminSection title={t("admin.publishing", "Publishing")}>
        <label className="block">
          <span className="text-sm font-medium text-text-primary">
            {t("admin.status", "Publish Status")}
          </span>
          <select
            value={publishStatus}
            onChange={(e) => setPublishStatus(e.target.value)}
            className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="draft">{t("admin.draft", "Draft")}</option>
            <option value="published">
              {t("admin.published", "Published")}
            </option>
            <option value="archived">{t("admin.archived", "Archived")}</option>
          </select>
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

      <TranslationsSection
        isEditMode={isEditMode}
        locale={locale}
        originalLocale={originalLocale}
        existingLocales={existingLocales}
        targetLocales={targetLocales}
        isSettingOriginal={isSettingOriginal}
        onSetOriginalLocale={setAsOriginalLocale}
        onSetOriginalLocaleValue={setOriginalLocale}
        onToggleTargetLocale={toggleTargetLocale}
        title={t("admin.translations", "Translations")}
        originalLocaleLabel={t("admin.originalLocale", "Original Language")}
        originalHint={t(
          "admin.originalLocaleHint",
          "This is the original language version.",
        )}
        translatedHint={t(
          "admin.translatedLocaleHint",
          "You are editing the {locale} translation. Original is {original}.",
        )}
        setAsOriginalLabel={t("admin.setAsOriginalLocale", "Set as original")}
        savingLabel={t("admin.saving", "Saving...")}
        translateDescription={t(
          "admin.translateDescription",
          "Auto-translate to additional languages on save:",
        )}
        originalChipLabel={t("admin.original", "Original")}
        translatedChipLabel={t("admin.translated", "Translated")}
      />

      <StickyEditorActions
        isEditMode={isEditMode}
        isSubmitting={isSubmitting}
        isDeleting={isDeleting}
        showDeleteModal={showDeleteModal}
        cancelHref="/admin/developers"
        itemName={name || id}
        locale={locale}
        translations={translations}
        onSubmit={() => {}}
        onShowDelete={() => setShowDeleteModal(true)}
        onHideDelete={() => setShowDeleteModal(false)}
        onConfirmDelete={handleDelete}
        deleteModalTitle={t("admin.deleteProfile", "Delete developer profile?")}
        deleteButtonLabel={t("admin.delete", "Delete")}
        submitLabel={t("admin.updateProfile", "Update Profile")}
        saveLabel={t("admin.saveProfile", "Save Profile")}
        savingLabel={t("admin.saving", "Saving...")}
        cancelLabel={t("admin.cancel", "Cancel")}
      />
    </form>
  );
}
