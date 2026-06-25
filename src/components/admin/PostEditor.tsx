import { useState, useEffect, useRef } from "react";
import TiptapEditor from "@/components/editor/TiptapEditor";
import ImageUploadButton from "@/components/editor/ImageUploadButton";
import { AdminSection } from "@/components/admin/AdminSection";
import { TranslationsSection } from "@/components/admin/TranslationsSection";
import { StickyEditorActions } from "@/components/admin/StickyEditorActions";
import { AdminDangerZone } from "@/components/admin/AdminDangerZone";
import DeleteModal from "@/components/admin/DeleteModal";
import { LANGUAGE_CONFIGS } from "@/lib/config/languages";
import { useAdminEditor } from "@/components/admin/use-admin-editor";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useTagSuggestions } from "@/hooks/use-tag-suggestions";
import { usePathSuggestions } from "@/hooks/use-path-suggestions";
import { normalizePostPath } from "@/lib/api/validation";
import {
  useAdminTranslations,
  type AdminTranslations,
} from "@/components/admin/use-admin-translations";

export interface PostEditorInitialData {
  id: string;
  locale: string;
  original_locale: string;
  existing_locales: string[];
  title: string;
  description: string | null;
  body: string;
  path: string;
  publish_status: string;
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
  const [body, setIntro] = useState(
    initialData?.body ?? JSON.stringify({ type: "doc", content: [] }),
  );
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialData?.cover_image_url ?? "",
  );
  const [path, setPath] = useState(initialData?.path ?? "/");
  const [pathInput, setPathInput] = useState("");
  const [showPathSuggestions, setShowPathSuggestions] = useState(false);
  const pathWrapperRef = useRef<HTMLDivElement>(null);
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
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
    entityType: "post",
    listPath: "/admin/posts",
    getSubmitBody: () => ({
      title,
      description: description || null,
      body: body,
      path: normalizePostPath(path || pathInput),
      publish_status: publishStatus,
      cover_image_url: coverImageUrl || null,
      tags,
      target_locales: targetLocales,
    }),
  });

  useEffect(() => {
    if (initialData) {
      setLocale(initialData.locale);
      setOriginalLocale(initialData.original_locale);
      setTitle(initialData.title);
      setDescription(initialData.description ?? "");
      setIntro(initialData.body);
      setCoverImageUrl(initialData.cover_image_url ?? "");
      setPath(initialData.path ?? "/");
      setTags(initialData.tags ?? []);
      setPublishStatus(initialData.publish_status);
    }
  }, [initialData, setLocale, setOriginalLocale]);

  useEffect(() => {
    if (!isEditMode) {
      setOriginalLocale(locale);
    }
  }, [isEditMode, locale, setOriginalLocale]);

  const [tagSuggestions, setTagSuggestions] = useTagSuggestions(tagInput);
  const [pathSuggestions, setPathSuggestions] = usePathSuggestions(pathInput);

  useClickOutside(tagWrapperRef, () => setShowSuggestions(false));
  useClickOutside(pathWrapperRef, () => setShowPathSuggestions(false));

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
            {t("admin.coverImage", "Cover Image URL")}
          </span>
          <div className="flex flex-wrap gap-2 mt-1.5">
            <input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <ImageUploadButton
              onUpload={setCoverImageUrl}
              entityType="post"
              entityId={id}
            />
          </div>
        </label>
      </AdminSection>

      <AdminSection title={t("admin.path", "Path")}>
        <label className="block relative">
          <span className="text-sm font-medium text-text-primary">
            {t("admin.path", "Path")}
          </span>
          <div
            ref={pathWrapperRef}
            className="relative flex items-center gap-2 mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent"
          >
            <input
              type="text"
              value={pathInput || path}
              onChange={(e) => {
                setPathInput(e.target.value);
                setShowPathSuggestions(true);
              }}
              onFocus={() => setShowPathSuggestions(true)}
              onBlur={() => {
                setTimeout(() => setShowPathSuggestions(false), 150);
                if (pathInput) {
                  setPath(normalizePostPath(pathInput));
                  setPathInput("");
                }
              }}
              placeholder={t("admin.pathPlaceholder", "/ai/platform/")}
              className="flex-1 min-w-[120px] bg-transparent outline-none text-sm font-mono"
            />
            {showPathSuggestions && pathSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-bg-primary shadow-lg">
                {pathSuggestions.map((suggestion) => (
                  <li key={suggestion.path}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setPath(suggestion.path);
                        setPathInput("");
                        setShowPathSuggestions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm font-mono hover:bg-bg-tertiary"
                    >
                      {suggestion.path}
                      <span className="ml-2 text-xs text-text-muted">
                        ({suggestion.count})
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            {t("admin.pathHint", "e.g. /ai/platform/something/")}
          </p>
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

      <AdminSection title={t("admin.body", "Body")}>
        <div className="space-y-2">
          <TiptapEditor
            key={editorKey}
            content={body}
            onChange={setIntro}
            placeholder="Write your post content..."
            entityType="post"
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
        contentType="post"
        contentId={id}
        onAfterBulkAction={() => window.location.reload()}
        regenerateAllLabel={t("admin.regenerateAll", "전체 재번역")}
        regenerateAllConfirmLabel={t(
          "admin.regenerateAllConfirm",
          "{count}개 언어의 번역을 다시 생성하시겠어요?",
        )}
        publishAllLabel={t("admin.publishAll", "전체 개시")}
        publishAllConfirmLabel={t(
          "admin.publishAllConfirm",
          "{count}개 언어를 published로 변경하시겠어요?",
        )}
        runningLabel={t("admin.running", "진행 중...")}
      />

      {isEditMode && (
        <AdminDangerZone
          title={t("admin.dangerZone", "Danger zone")}
          description={t(
            "admin.deletePostDescription",
            "Deleting this post removes all its language versions. This action cannot be undone.",
          )}
          buttonLabel={t("admin.delete", "Delete")}
          deleting={isDeleting}
          onDelete={() => setShowDeleteModal(true)}
        />
      )}

      <StickyEditorActions
        isSubmitting={isSubmitting}
        cancelHref="/admin/posts"
        submitLabel={t("admin.updatePost", "Update Post")}
        saveLabel={t("admin.savePost", "Save Post")}
        savingLabel={t("admin.saving", "Saving...")}
        cancelLabel={t("admin.cancel", "Cancel")}
        onSubmit={() => {}}
      />

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
