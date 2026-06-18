import { useState } from "react";
import TiptapEditor from "@/components/editor/TiptapEditor";
import ImageUploadButton from "@/components/editor/ImageUploadButton";

const LOCALES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];

export default function DeveloperEditor() {
  const [id, setId] = useState("");
  const [locale, setLocale] = useState("ko");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [tiptapJson, setTiptapJson] = useState(
    JSON.stringify({ type: "doc", content: [] }),
  );
  const [avatarUrl, setAvatarUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [email, setEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [techStack, setTechStack] = useState("");
  const [insertedImageUrl, setInsertedImageUrl] = useState<string | undefined>(
    undefined,
  );
  const [targetLocales, setTargetLocales] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTiptapImage = (url: string) => {
    setInsertedImageUrl(url);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/developers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          locale,
          name,
          role,
          bio,
          tiptap_json: tiptapJson,
          avatar_url: avatarUrl || null,
          github_url: githubUrl || null,
          email: email || null,
          website_url: websiteUrl || null,
          tech_stack: techStack
            ? techStack.split(",").map((s) => s.trim())
            : null,
          certifications: null,
          education: null,
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          />
        </label>

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
      </div>

      <label className="block">
        <span className="text-sm font-medium">Bio</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          required
          className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Avatar URL</span>
          <div className="flex gap-2 mt-1">
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded bg-bg-primary"
            />
            <ImageUploadButton onUpload={setAvatarUrl} />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium">GitHub URL</span>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Website URL</span>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium">
          Tech Stack (comma separated)
        </span>
        <input
          type="text"
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          className="w-full mt-1 px-3 py-2 border border-border rounded bg-bg-primary"
        />
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Content</span>
          <ImageUploadButton onUpload={handleTiptapImage} />
        </div>
        <TiptapEditor
          content={tiptapJson}
          onChange={setTiptapJson}
          placeholder="Write additional content..."
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
        {isSubmitting ? "Saving..." : "Save Developer"}
      </button>
    </form>
  );
}
