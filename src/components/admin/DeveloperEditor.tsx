import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TiptapEditor from "@/components/editor/TiptapEditor";
import ImageUploadButton from "@/components/editor/ImageUploadButton";
import { AdminSection } from "@/components/admin/AdminSection";
import { TranslationsSection } from "@/components/admin/TranslationsSection";
import { StickyEditorActions } from "@/components/admin/StickyEditorActions";
import { LANGUAGE_CONFIGS } from "@/lib/config/languages";
import { useAdminEditor } from "@/components/admin/use-admin-editor";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useTagSuggestions } from "@/hooks/use-tag-suggestions";
import { apiFetch } from "@/lib/api/client";
import type { EducationStatus } from "@/lib/db/developers";
import type { UIKey } from "@/lib/i18n";
import {
  useAdminTranslations,
  type AdminTranslations,
} from "@/components/admin/use-admin-translations";

type Translator = ReturnType<typeof useAdminTranslations>;

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
  techStack: string[];
}

interface DeveloperEditorProps {
  initialData?: DeveloperEditorInitialData;
  translations: AdminTranslations;
}

interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  badge_url: string | null;
  url: string | null;
}

interface EducationItem {
  id: string;
  start_date: string | null;
  end_date: string | null;
  institution: string;
  department: string | null;
  status: EducationStatus | null;
}

const EDUCATION_STATUS_OPTIONS: Array<{
  value: EducationStatus;
  key: "status.graduated" | "status.enrolled" | "status.withdrawn";
}> = [
  { value: "graduated", key: "status.graduated" },
  { value: "enrolled", key: "status.enrolled" },
  { value: "withdrawn", key: "status.withdrawn" },
];

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
  const [techStack, setTechStack] = useState<string[]>(
    initialData?.techStack ?? [],
  );
  const [tagInput, setTagInput] = useState("");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagWrapperRef = useRef<HTMLDivElement>(null);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [nestedLoading, setNestedLoading] = useState(true);

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
      tech_stack: techStack,
      target_locales: targetLocales,
    }),
  });

  // Hydrate nested state on first mount / locale change.
  const initialDataRef = useRef(initialData);
  useEffect(() => {
    if (!initialData) return;
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
    setTechStack(initialData.techStack ?? []);
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
    if (!normalized || techStack.includes(normalized)) return;
    setTechStack([...techStack, normalized]);
    setTagInput("");
    setTagSuggestions([]);
    setActiveSuggestionIndex(-1);
    setShowSuggestions(false);
    tagInputRef.current?.focus();
  }

  function removeTag(tag: string) {
    setTechStack(techStack.filter((t) => t !== tag));
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
    (suggestion) => !techStack.includes(suggestion),
  );

  // Fetch cert/edu lists from new endpoints on mount / locale change.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setNestedLoading(true);
    Promise.all([
      apiFetch<CertificationItem[]>(
        `/api/admin/developers/${id}/certifications?locale=${encodeURIComponent(locale)}`,
      ),
      apiFetch<EducationItem[]>(
        `/api/admin/developers/${id}/education?locale=${encodeURIComponent(locale)}`,
      ),
    ])
      .then(([certs, edu]) => {
        if (!cancelled) {
          setCertifications(certs);
          setEducation(edu);
        }
      })
      .catch((err) => {
        console.error("Failed to load nested items", err);
      })
      .finally(() => {
        if (!cancelled) setNestedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, locale]);

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
            {t("admin.bio", "Bio (short)")}
          </span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
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
          <div ref={tagWrapperRef} className="relative mt-1.5">
            <div className="flex flex-wrap gap-2 px-3 py-2 border border-border rounded-lg bg-bg-primary focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent">
              {techStack.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-sm bg-accent/10 text-accent rounded-md"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-accent/70"
                    aria-label={`Remove ${tag}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onFocus={handleTagInputFocus}
                onKeyDown={handleTagKeyDown}
                placeholder={
                  techStack.length === 0
                    ? t(
                        "admin.techStackPlaceholder",
                        "React, TypeScript, Node.js",
                      )
                    : ""
                }
                className="flex-1 min-w-[120px] bg-transparent focus:outline-none"
              />
            </div>
            {showSuggestions && filteredSuggestions.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-bg-primary border border-border rounded-lg shadow-lg">
                {filteredSuggestions.map((suggestion, idx) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => addTag(suggestion)}
                      onMouseEnter={() => setActiveSuggestionIndex(idx)}
                      className={`w-full text-left px-3 py-1.5 text-sm ${
                        idx === activeSuggestionIndex
                          ? "bg-accent/10 text-accent"
                          : "hover:bg-bg-secondary"
                      }`}
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-xs text-text-tertiary mt-1">
            {t("admin.tagsHint", "Press Enter to add a tag")}
          </p>
        </label>
      </AdminSection>

      <CertificationsSection
        developerId={id}
        locale={locale}
        items={certifications}
        loading={nestedLoading}
        onChange={setCertifications}
        t={t}
      />

      <EducationSection
        developerId={id}
        locale={locale}
        items={education}
        loading={nestedLoading}
        onChange={setEducation}
        t={t}
      />

      <AdminSection title={t("admin.content", "Content")}>
        <div className="space-y-2">
          <TiptapEditor
            key={editorKey}
            content={tiptapJson}
            onChange={setTiptapJson}
            placeholder="Write the long-form intro (markdown body)..."
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

// =====================================================================
// Certifications (sortable list, multi-locale via current locale field)
// =====================================================================

function CertificationsSection({
  developerId,
  locale,
  items,
  loading,
  onChange,
  t,
}: {
  developerId: string;
  locale: string;
  items: CertificationItem[];
  loading: boolean;
  onChange: (next: CertificationItem[]) => void;
  t: Translator;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    onChange(next);
    try {
      await apiFetch(
        "/api/admin/developers/" + developerId + "/certifications-reorder",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds: next.map((it) => it.id) }),
        },
      );
    } catch (err) {
      console.error("Failed to save cert order", err);
    }
  };

  const handleAdd = async () => {
    try {
      const res = await apiFetch<{ id: string }>(
        `/api/admin/developers/${developerId}/certifications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            translation: {
              name: "New certification",
              issuer: "",
              date: new Date().toISOString().slice(0, 10),
            },
          }),
        },
      );
      if (!res?.id) {
        throw new Error("Add failed: response missing id");
      }
      const today = new Date().toISOString().slice(0, 10);
      onChange([
        ...items,
        {
          id: res.id,
          name: "New certification",
          issuer: "",
          date: today,
          badge_url: null,
          url: null,
        },
      ]);
    } catch (err) {
      console.error("Failed to add certification", err);
      window.alert(
        `Failed to add certification: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.confirmDelete", "Delete this item?"))) return;
    try {
      await apiFetch(
        `/api/admin/developers/${developerId}/certifications/${id}`,
        { method: "DELETE" },
      );
      onChange(items.filter((it) => it.id !== id));
    } catch (err) {
      console.error("Failed to delete cert", err);
    }
  };

  const handleUpdate = async (
    id: string,
    field: "name" | "issuer" | "date" | "badge_url" | "url",
    value: string | null,
  ) => {
    onChange(
      items.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
    try {
      await apiFetch(
        `/api/admin/developers/${developerId}/certifications/${id}/translation`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            translation: {
              name:
                field === "name"
                  ? (value as string)
                  : (items.find((it) => it.id === id)?.name ?? ""),
              issuer:
                field === "issuer"
                  ? (value as string)
                  : (items.find((it) => it.id === id)?.issuer ?? ""),
              date:
                field === "date"
                  ? (value as string)
                  : (items.find((it) => it.id === id)?.date ?? ""),
              badge_url:
                field === "badge_url"
                  ? value
                  : (items.find((it) => it.id === id)?.badge_url ?? null),
              url:
                field === "url"
                  ? value
                  : (items.find((it) => it.id === id)?.url ?? null),
            },
          }),
        },
      );
    } catch (err) {
      console.error("Failed to update cert", err);
    }
  };

  return (
    <AdminSection
      title={t("admin.certifications", "Certifications")}
      action={
        <button
          type="button"
          onClick={handleAdd}
          disabled={!developerId}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          + {t("admin.add", "Add")}
        </button>
      }
    >
      {loading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-muted">
          {t("admin.noCertifications", "No certifications yet.")}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((it) => it.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {items.map((item) => (
                <SortableCertificationItem
                  key={item.id}
                  item={item}
                  developerId={developerId}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  t={t}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </AdminSection>
  );
}

function SortableCertificationItem({
  item,
  developerId,
  onUpdate,
  onDelete,
  t,
}: {
  item: CertificationItem;
  developerId: string;
  onUpdate: (
    id: string,
    field: "name" | "issuer" | "date" | "badge_url" | "url",
    value: string | null,
  ) => void;
  onDelete: (id: string) => void;
  t: Translator;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-2 p-3 border border-border rounded-lg bg-bg-primary ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-1.5 text-text-muted hover:text-text-primary cursor-grab active:cursor-grabbing rounded-md hover:bg-bg-tertiary self-start mt-7"
        aria-label="Drag to reorder"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-4 h-4"
        >
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-text-primary">
            {t("admin.name", "Name")}
          </span>
          <input
            type="text"
            value={item.name}
            onChange={(e) => onUpdate(item.id, "name", e.target.value)}
            className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-text-primary">
            {t("admin.issuer", "Issuer")}
          </span>
          <input
            type="text"
            value={item.issuer}
            onChange={(e) => onUpdate(item.id, "issuer", e.target.value)}
            className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-text-primary">
            {t("admin.date", "Date")}
          </span>
          <input
            type="text"
            value={item.date}
            onChange={(e) => onUpdate(item.id, "date", e.target.value)}
            placeholder="2026-03"
            className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-text-primary">
            {t("admin.url", "URL")}
          </span>
          <input
            type="url"
            value={item.url ?? ""}
            onChange={(e) => onUpdate(item.id, "url", e.target.value || null)}
            className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
        <div className="block md:col-span-2">
          <span className="text-xs font-medium text-text-primary">
            {t("admin.badge", "Badge")}
          </span>
          <div className="flex gap-2 mt-1">
            <input
              type="url"
              value={item.badge_url ?? ""}
              onChange={(e) =>
                onUpdate(item.id, "badge_url", e.target.value || null)
              }
              className="flex-1 px-2 py-1.5 text-sm border border-border rounded bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <ImageUploadButton
              onUpload={(url) => onUpdate(item.id, "badge_url", url)}
              entityType="developer"
              entityId={`${developerId}/certifications/${item.id}`}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="p-1.5 text-text-muted hover:text-red-600 self-start mt-7"
        aria-label="Delete"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-4 h-4"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  );
}

// =====================================================================
// Education (sortable list, dates are shared, translations per-locale)
// =====================================================================

function EducationSection({
  developerId,
  locale,
  items,
  loading,
  onChange,
  t,
}: {
  developerId: string;
  locale: string;
  items: EducationItem[];
  loading: boolean;
  onChange: (next: EducationItem[]) => void;
  t: Translator;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    onChange(next);
    try {
      await apiFetch(
        "/api/admin/developers/" + developerId + "/education-reorder",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds: next.map((it) => it.id) }),
        },
      );
    } catch (err) {
      console.error("Failed to save education order", err);
    }
  };

  const handleAdd = async () => {
    try {
      const res = await apiFetch<{ id: string }>(
        `/api/admin/developers/${developerId}/education`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_date: null,
            end_date: null,
            locale,
            translation: { institution: "New school" },
          }),
        },
      );
      if (!res?.id) {
        throw new Error("Add failed: response missing id");
      }
      onChange([
        ...items,
        {
          id: res.id,
          start_date: null,
          end_date: null,
          institution: "New school",
          department: null,
          status: null,
        },
      ]);
    } catch (err) {
      console.error("Failed to add education", err);
      window.alert(
        `Failed to add education: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.confirmDelete", "Delete this item?"))) return;
    try {
      await apiFetch(`/api/admin/developers/${developerId}/education/${id}`, {
        method: "DELETE",
      });
      onChange(items.filter((it) => it.id !== id));
    } catch (err) {
      console.error("Failed to delete edu", err);
    }
  };

  const updateTranslation = async (
    id: string,
    field: "institution" | "department" | "status",
    value: string | null,
  ) => {
    const current = items.find((it) => it.id === id);
    if (!current) return;
    onChange(
      items.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
    try {
      await apiFetch(`/api/admin/developers/${developerId}/education/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          translation: {
            institution:
              field === "institution" ? (value as string) : current.institution,
            department: field === "department" ? value : current.department,
            status: field === "status" ? value : current.status,
          },
        }),
      });
    } catch (err) {
      console.error("Failed to update edu translation", err);
    }
  };

  const updateDates = async (
    id: string,
    startDate: string | null,
    endDate: string | null,
  ) => {
    onChange(
      items.map((it) =>
        it.id === id ? { ...it, start_date: startDate, end_date: endDate } : it,
      ),
    );
    try {
      await apiFetch(`/api/admin/developers/${developerId}/education/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: startDate, end_date: endDate }),
      });
    } catch (err) {
      console.error("Failed to update edu dates", err);
    }
  };

  return (
    <AdminSection
      title={t("admin.education", "Education")}
      action={
        <button
          type="button"
          onClick={handleAdd}
          disabled={!developerId}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          + {t("admin.add", "Add")}
        </button>
      }
    >
      {loading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-muted">
          {t("admin.noEducation", "No education yet.")}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((it) => it.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {items.map((item) => (
                <SortableEducationItem
                  key={item.id}
                  item={item}
                  onUpdateTranslation={updateTranslation}
                  onUpdateDates={updateDates}
                  onDelete={handleDelete}
                  t={t}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </AdminSection>
  );
}

function SortableEducationItem({
  item,
  onUpdateTranslation,
  onUpdateDates,
  onDelete,
  t,
}: {
  item: EducationItem;
  onUpdateTranslation: (
    id: string,
    field: "institution" | "department" | "status",
    value: string | null,
  ) => void;
  onUpdateDates: (
    id: string,
    startDate: string | null,
    endDate: string | null,
  ) => void;
  onDelete: (id: string) => void;
  t: Translator;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-2 p-3 border border-border rounded-lg bg-bg-primary ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-1.5 text-text-muted hover:text-text-primary cursor-grab active:cursor-grabbing rounded-md hover:bg-bg-tertiary self-start mt-7"
        aria-label="Drag to reorder"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-4 h-4"
        >
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-text-primary">
            {t("admin.institution", "Institution")}
          </span>
          <input
            type="text"
            value={item.institution}
            onChange={(e) =>
              onUpdateTranslation(item.id, "institution", e.target.value)
            }
            className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-text-primary">
            {t("admin.department", "Department")}
          </span>
          <input
            type="text"
            value={item.department ?? ""}
            onChange={(e) =>
              onUpdateTranslation(item.id, "department", e.target.value || null)
            }
            className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-text-primary">
            {t("admin.startDate", "Start date")}
          </span>
          <input
            type="date"
            value={item.start_date ?? ""}
            onChange={(e) =>
              onUpdateDates(item.id, e.target.value || null, item.end_date)
            }
            className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-text-primary">
            {t("admin.endDate", "End date")}
          </span>
          <input
            type="date"
            value={item.end_date ?? ""}
            onChange={(e) =>
              onUpdateDates(item.id, item.start_date, e.target.value || null)
            }
            className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-medium text-text-primary">
            {t("admin.status", "Status")}
          </span>
          <select
            value={item.status ?? ""}
            onChange={(e) =>
              onUpdateTranslation(
                item.id,
                "status",
                (e.target.value || null) as EducationStatus | null,
              )
            }
            className="w-full mt-1 px-2 py-1.5 text-sm border border-border rounded bg-bg-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
          >
            <option value="">—</option>
            {EDUCATION_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key, option.value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="p-1.5 text-text-muted hover:text-red-600 self-start mt-7"
        aria-label="Delete"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-4 h-4"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  );
}
