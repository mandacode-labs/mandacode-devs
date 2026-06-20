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

export interface PostEditorInitialData {
  id: string;
  locale: string;
  title: string;
  description: string | null;
  tiptap_json: string;
  publish_status: string;
  pub_date: string;
  cover_image_url: string | null;
  og_image_url: string | null;
}

interface PostEditorProps {
  initialData?: PostEditorInitialData;
  translations: AdminTranslations;
}

export default function PostEditor({
  initialData,
  translations,
}: PostEditorProps) {
  const t = useAdminTranslations(translations);
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [tiptapJson, setTiptapJson] = useState(
    initialData?.tiptap_json ?? JSON.stringify({ type: "doc", content: [] }),
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
  const [ogImageUrl, setOgImageUrl] = useState(initialData?.og_image_url ?? "");
  const [publishStatus, setPublishStatus] = useState(
    initialData?.publish_status ?? "draft",
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
    entityType: "post",
    listPath: "/admin/posts",
    getSubmitBody: () => ({
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

  useEffect(() => {
    if (initialData) {
      setLocale(initialData.locale);
      setTitle(initialData.title);
      setDescription(initialData.description ?? "");
      setTiptapJson(initialData.tiptap_json);
      setPubDate(new Date(initialData.pub_date).toISOString().slice(0, 16));
      setCoverImageUrl(initialData.cover_image_url ?? "");
      setOgImageUrl(initialData.og_image_url ?? "");
      setPublishStatus(initialData.publish_status);
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

        <label className="block mt-4">
          <span className="text-sm font-medium text-text-primary">
            {t("admin.titleLabel", "Title")}
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>

        <label className="block mt-4">
          <span className="text-sm font-medium text-text-primary">
            {t("admin.description", "Description")}
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y"
          />
        </label>
      </AdminSection>

      <AdminSection title={t("admin.publishing", "Publishing")}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value="archived">
                {t("admin.archived", "Archived")}
              </option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              {t("admin.publishDate", "Publish Date")}
            </span>
            <input
              type="datetime-local"
              value={pubDate}
              onChange={(e) => setPubDate(e.target.value)}
              required
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </label>
        </div>
      </AdminSection>

      <AdminSection title={t("admin.media", "Media")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              {t("admin.coverImage", "Cover Image URL")}
            </span>
            <div className="flex gap-2 mt-1.5">
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <ImageUploadButton
                onUpload={setCoverImageUrl}
                entityType="post"
                entityId={id}
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              {t("admin.ogImage", "OG Image URL")}
            </span>
            <div className="flex gap-2 mt-1.5">
              <input
                type="url"
                value={ogImageUrl}
                onChange={(e) => setOgImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
              <ImageUploadButton
                onUpload={setOgImageUrl}
                entityType="post"
                entityId={id}
              />
            </div>
          </label>
        </div>
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
            placeholder="Write your post content..."
            entityType="post"
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
                ? t("admin.updatePost", "Update Post")
                : t("admin.savePost", "Save Post")}
          </button>
          <a
            href="/admin/posts"
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
          title={t("admin.deletePost", "Delete post?")}
          itemName={title || id}
          locale={locale}
          translations={translations}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </form>
  );
}
