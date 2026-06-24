import { useState, useEffect, useRef } from "react";
import TiptapEditor from "@/components/editor/TiptapEditor";
import ImageUploadButton from "@/components/editor/ImageUploadButton";
import { AdminSection } from "@/components/admin/AdminSection";
import { TranslationsSection } from "@/components/admin/TranslationsSection";
import { StickyEditorActions } from "@/components/admin/StickyEditorActions";
import BlogPostSelector from "@/components/admin/BlogPostSelector";
import { LANGUAGE_CONFIGS } from "@/lib/config/languages";
import { useAdminEditor } from "@/components/admin/use-admin-editor";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useTagSuggestions } from "@/hooks/use-tag-suggestions";
import {
  useAdminTranslations,
  type AdminTranslations,
} from "@/components/admin/use-admin-translations";

const PROJECT_STATUS_OPTIONS = [
  { value: "production", key: "status.production" as const },
  { value: "development", key: "status.development" as const },
  { value: "planning", key: "status.planning" as const },
  { value: "completed", key: "status.completed" as const },
];

export interface ProjectEditorInitialData {
  id: string;
  locale: string;
  original_locale: string;
  existing_locales: string[];
  title: string;
  description: string | null;
  article: string;
  publish_status: string;
  project_status: string;
  start_date: string | null;
  end_date: string | null;
  team_size: number;
  role: string;
  project_order: number;
  url: string | null;
  source_url: string | null;
  blog_post_id: string | null;
  cover_image_url: string | null;
  tags: string[];
}

interface ProjectEditorProps {
  initialData?: ProjectEditorInitialData;
  translations: AdminTranslations;
}

export default function ProjectEditor({
  initialData,
  translations,
}: ProjectEditorProps) {
  const t = useAdminTranslations(translations);
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [article, setArticle] = useState(
    initialData?.article ?? JSON.stringify({ type: "doc", content: [] }),
  );
  const [projectStatus, setProjectStatus] = useState(
    initialData?.project_status ?? "development",
  );
  const [startDate, setStartDate] = useState(initialData?.start_date ?? "");
  const [endDate, setEndDate] = useState(initialData?.end_date ?? "");
  const [teamSize, setTeamSize] = useState(initialData?.team_size ?? 1);
  const [role, setRole] = useState(initialData?.role ?? "");
  const [projectOrder, setProjectOrder] = useState(
    initialData?.project_order ?? 0,
  );
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [sourceUrl, setSourceUrl] = useState(initialData?.source_url ?? "");
  const [blogPostId, setBlogPostId] = useState<string | null>(
    initialData?.blog_post_id ?? null,
  );
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialData?.cover_image_url ?? "",
  );
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
    entityType: "project",
    listPath: "/admin/projects",
    getSubmitBody: () => ({
      title,
      description: description || null,
      article: article,
      publish_status: publishStatus,
      project_status: projectStatus,
      start_date: startDate || null,
      end_date: endDate || null,
      team_size: teamSize,
      role,
      project_order: projectOrder,
      url: url || null,
      source_url: sourceUrl || null,
      blog_post_id: blogPostId,
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
      setArticle(initialData.article);
      setProjectStatus(initialData.project_status);
      setStartDate(initialData.start_date ?? "");
      setEndDate(initialData.end_date ?? "");
      setTeamSize(initialData.team_size);
      setRole(initialData.role);
      setProjectOrder(initialData.project_order);
      setUrl(initialData.url ?? "");
      setSourceUrl(initialData.source_url ?? "");
      setBlogPostId(initialData.blog_post_id ?? null);
      setCoverImageUrl(initialData.cover_image_url ?? "");
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

  useClickOutside(tagWrapperRef, () => setShowSuggestions(false));

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              {t("admin.projectStatus", "Project Status")}
            </span>
            <select
              value={projectStatus}
              onChange={(e) => setProjectStatus(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {PROJECT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.key, option.value)}
                </option>
              ))}
            </select>
          </label>

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
        </div>
      </AdminSection>

      <AdminSection title={t("admin.projectDetails", "Project Details")}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label htmlFor="start-date" className="block">
            <span className="text-sm font-medium text-text-primary">
              {t("admin.startDate", "Start Date")}
            </span>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </label>

          <label htmlFor="end-date" className="block">
            <span className="text-sm font-medium text-text-primary">
              {t("admin.endDate", "End Date")}
            </span>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              {t("admin.teamSize", "Team Size")}
            </span>
            <input
              type="number"
              min={1}
              value={teamSize}
              onChange={(e) => setTeamSize(Number(e.target.value))}
              required
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              {t("admin.order", "Order")}
            </span>
            <input
              type="number"
              value={projectOrder}
              onChange={(e) => setProjectOrder(Number(e.target.value))}
              required
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </label>
        </div>

        <label className="block mt-4">
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
      </AdminSection>

      <AdminSection title={t("admin.links", "Links")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              {t("admin.url", "URL")}
            </span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              {t("admin.sourceUrl", "Source URL")}
            </span>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 border border-border rounded-lg bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
          </label>
        </div>

        <div className="mt-4">
          <BlogPostSelector
            value={blogPostId}
            onChange={setBlogPostId}
            label={t("admin.blogPost", "Linked Blog Post")}
            locale={locale}
          />
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
              entityType="project"
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

      <AdminSection title={t("admin.article", "Article")}>
        <div className="space-y-2">
          <TiptapEditor
            key={editorKey}
            content={article}
            onChange={setArticle}
            placeholder="Write your project content..."
            entityType="project"
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
        contentType="project"
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

      <StickyEditorActions
        isEditMode={isEditMode}
        isSubmitting={isSubmitting}
        isDeleting={isDeleting}
        showDeleteModal={showDeleteModal}
        cancelHref="/admin/projects"
        itemName={title || id}
        locale={locale}
        translations={translations}
        onSubmit={() => {}}
        onShowDelete={() => setShowDeleteModal(true)}
        onHideDelete={() => setShowDeleteModal(false)}
        onConfirmDelete={handleDelete}
        deleteModalTitle={t("admin.deleteProject", "Delete project?")}
        deleteButtonLabel={t("admin.delete", "Delete")}
        submitLabel={t("admin.updateProject", "Update Project")}
        saveLabel={t("admin.saveProject", "Save Project")}
        savingLabel={t("admin.saving", "Saving...")}
        cancelLabel={t("admin.cancel", "Cancel")}
      />
    </form>
  );
}
