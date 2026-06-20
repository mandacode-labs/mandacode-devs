import { useState, useEffect, useRef, useCallback } from "react";
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
  tags: string[];
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
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagWrapperRef = useRef<HTMLDivElement>(null);
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
      tags,
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
      setTags(initialData.tags ?? []);
      setPublishStatus(initialData.publish_status);
    }
  }, [initialData, setLocale]);

  const fetchTagSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setTagSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/tags?q=${encodeURIComponent(query)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { tags?: string[] };
      setTagSuggestions(data.tags ?? []);
    } catch {
      setTagSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTagSuggestions(tagInput);
    }, 150);
    return () => clearTimeout(handler);
  }, [tagInput, fetchTagSuggestions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tagWrapperRef.current &&
        !tagWrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addTag(value?: string) {
    const normalized = (value ?? tagInput).trim();
    if (!normalized || tags.includes(normalized)) return;
    setTags([...tags, normalized]);
    setTagInput("");
    setTagSuggestions([]);
    setActiveSuggestionIndex(-1);
    setShowSuggestions(false);
    tagInputRef.current?.focus();
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (
        showSuggestions &&
        activeSuggestionIndex >= 0 &&
        activeSuggestionIndex < tagSuggestions.length
      ) {
        addTag(tagSuggestions[activeSuggestionIndex]);
      } else {
        addTag();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowSuggestions(true);
      setActiveSuggestionIndex((prev) =>
        prev < tagSuggestions.length - 1 ? prev + 1 : prev,
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
      return;
    }

    if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  }

  function handleTagInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTagInput(e.target.value);
    setShowSuggestions(true);
    setActiveSuggestionIndex(-1);
  }

  function handleTagInputFocus() {
    if (tagInput.trim()) {
      setShowSuggestions(true);
    }
  }

  const filteredSuggestions = tagSuggestions.filter(
    (suggestion) => !tags.includes(suggestion),
  );

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
      </AdminSection>

      <AdminSection title={t("admin.tags", "Tags")}>
        <label className="block relative">
          <span className="text-sm font-medium text-text-primary">
            {t("admin.tagsPlaceholder", "Add tags")}
          </span>
          <div
            ref={tagWrapperRef}
            className="relative flex flex-wrap items-center gap-2 mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent"
          >
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-bg-tertiary text-text-primary rounded"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-text-secondary hover:text-red-600"
                  aria-label={t("admin.removeTag", "Remove tag")}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleTagKeyDown}
              onFocus={handleTagInputFocus}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 150);
              }}
              placeholder={t("admin.tagsPlaceholder", "Add tags")}
              className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-bg-primary shadow-lg">
                {filteredSuggestions.map((suggestion, index) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addTag(suggestion);
                      }}
                      onMouseEnter={() => setActiveSuggestionIndex(index)}
                      className={`w-full px-3 py-2 text-left text-sm ${
                        index === activeSuggestionIndex
                          ? "bg-bg-tertiary text-text-primary"
                          : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                      }`}
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            {t("admin.tagsHint", "Press Enter to add a tag")}
          </p>
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
