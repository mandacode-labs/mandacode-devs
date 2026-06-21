import { describe, expect, it, vi } from "vitest";
import { rowToPostWithTranslation } from "@/lib/db/posts";
import { rowToProjectWithTranslation } from "@/lib/db/projects";
import { rowToDeveloperWithTranslation } from "@/lib/db/developers";

vi.mock("cloudflare:workers", () => ({
  env: {},
}));

function baseRow() {
  return {
    id: "post-1",
    author_id: "user-1",
    original_locale: "ko",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
  };
}

describe("rowToPostWithTranslation", () => {
  it("uses the target translation when present", () => {
    const row = {
      ...baseRow(),
      original_title: "원본 제목",
      original_description: "원본 설명",
      original_tiptap_json: '{"type":"doc"}',
      original_cover_image_url: "https://example.com/original.jpg",
      original_publish_status: "published",
      original_published_at: "2026-01-01T00:00:00Z",
      translation_title: "English Title",
      translation_description: "English description",
      translation_tiptap_json: '{"type":"doc","content":[]}',
      translation_cover_image_url: "https://example.com/en.jpg",
      translation_publish_status: "published",
      translation_published_at: "2026-01-02T00:00:00Z",
    };

    const result = rowToPostWithTranslation(row);

    expect(result.title).toBe("English Title");
    expect(result.description).toBe("English description");
    expect(result.tiptap_json).toBe('{"type":"doc","content":[]}');
    expect(result.cover_image_url).toBe("https://example.com/en.jpg");
    expect(result.publish_status).toBe("published");
    expect(result.published_at).toBe("2026-01-02T00:00:00Z");
    expect(result.is_fallback).toBe(false);
  });

  it("falls back to the original translation when target is missing", () => {
    const row = {
      ...baseRow(),
      original_title: "원본 제목",
      original_description: "원본 설명",
      original_tiptap_json: '{"type":"doc"}',
      original_cover_image_url: "https://example.com/original.jpg",
      original_publish_status: "published",
      original_published_at: "2026-01-01T00:00:00Z",
      translation_title: null,
      translation_description: null,
      translation_tiptap_json: null,
      translation_cover_image_url: null,
      translation_publish_status: null,
      translation_published_at: null,
    };

    const result = rowToPostWithTranslation(row);

    expect(result.title).toBe("원본 제목");
    expect(result.description).toBe("원본 설명");
    expect(result.tiptap_json).toBe('{"type":"doc"}');
    expect(result.cover_image_url).toBe("https://example.com/original.jpg");
    expect(result.publish_status).toBe("published");
    expect(result.published_at).toBe("2026-01-01T00:00:00Z");
    expect(result.is_fallback).toBe(true);
  });

  it("handles null descriptions and cover images", () => {
    const row = {
      ...baseRow(),
      original_title: "원본",
      original_description: null,
      original_tiptap_json: '{"type":"doc"}',
      original_cover_image_url: null,
      original_publish_status: "draft",
      original_published_at: null,
      translation_title: "Translated",
      translation_description: null,
      translation_tiptap_json: '{"type":"doc"}',
      translation_cover_image_url: null,
      translation_publish_status: "draft",
      translation_published_at: null,
    };

    const result = rowToPostWithTranslation(row);

    expect(result.description).toBeNull();
    expect(result.cover_image_url).toBeNull();
    expect(result.published_at).toBeNull();
  });
});

describe("rowToProjectWithTranslation", () => {
  it("maps project fields and prefers target translation", () => {
    const row = {
      id: "project-1",
      author_id: "user-1",
      project_status: "completed",
      start_date: "2025-01",
      end_date: "2025-12",
      team_size: 3,
      project_order: 1,
      url: "https://example.com",
      source_url: null,
      blog_url: null,
      original_locale: "ko",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
      original_title: "원본 프로젝트",
      original_description: "원본 설명",
      original_tiptap_json: '{"type":"doc"}',
      original_role: "Backend",
      original_cover_image_url: null,
      original_publish_status: "published",
      original_published_at: "2026-01-01T00:00:00Z",
      translation_title: "English Project",
      translation_description: "English description",
      translation_tiptap_json: '{"type":"doc"}',
      translation_role: "Full Stack",
      translation_cover_image_url: "https://example.com/cover.jpg",
      translation_publish_status: "published",
      translation_published_at: "2026-01-02T00:00:00Z",
    };

    const result = rowToProjectWithTranslation(row);

    expect(result.title).toBe("English Project");
    expect(result.role).toBe("Full Stack");
    expect(result.project_status).toBe("completed");
    expect(result.team_size).toBe(3);
    expect(result.is_fallback).toBe(false);
  });

  it("falls back to original project translation", () => {
    const row = {
      id: "project-1",
      author_id: "user-1",
      project_status: "in_progress",
      start_date: null,
      end_date: null,
      team_size: 1,
      project_order: 2,
      url: null,
      source_url: null,
      blog_url: null,
      original_locale: "ko",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
      original_title: "원본 프로젝트",
      original_description: null,
      original_tiptap_json: '{"type":"doc"}',
      original_role: "Solo",
      original_cover_image_url: null,
      original_publish_status: "draft",
      original_published_at: null,
      translation_title: null,
      translation_description: null,
      translation_tiptap_json: null,
      translation_role: null,
      translation_cover_image_url: null,
      translation_publish_status: null,
      translation_published_at: null,
    };

    const result = rowToProjectWithTranslation(row);

    expect(result.title).toBe("원본 프로젝트");
    expect(result.role).toBe("Solo");
    expect(result.is_fallback).toBe(true);
  });
});

describe("rowToDeveloperWithTranslation", () => {
  it("parses JSON fields and prefers target translation", () => {
    const row = {
      id: "dev-1",
      author_id: "user-1",
      github_url: "https://github.com/foo",
      email: "foo@example.com",
      website_url: null,
      tech_stack: '["TypeScript","React"]',
      certifications: '[{"name":"AWS","issuer":"Amazon"}]',
      education:
        '[{"period":"2020-2024","institution":"Foo Univ","department":"CS","status":"graduated"}]',
      original_locale: "ko",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
      original_name: "원본 이름",
      original_role: "Developer",
      original_bio: "원본 소개",
      original_tiptap_json: '{"type":"doc"}',
      original_avatar_url: null,
      original_publish_status: "published",
      original_published_at: "2026-01-01T00:00:00Z",
      translation_name: "English Name",
      translation_role: "Engineer",
      translation_bio: "English bio",
      translation_tiptap_json: '{"type":"doc"}',
      translation_avatar_url: "https://example.com/avatar.jpg",
      translation_publish_status: "published",
      translation_published_at: "2026-01-02T00:00:00Z",
    };

    const result = rowToDeveloperWithTranslation(row);

    expect(result.name).toBe("English Name");
    expect(result.role).toBe("Engineer");
    expect(result.is_fallback).toBe(false);
  });

  it("falls back to original developer translation", () => {
    const row = {
      id: "dev-1",
      author_id: "user-1",
      github_url: null,
      email: null,
      website_url: null,
      tech_stack: null,
      certifications: null,
      education: null,
      original_locale: "ko",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
      original_name: "원본 이름",
      original_role: "Developer",
      original_bio: "원본 소개",
      original_tiptap_json: '{"type":"doc"}',
      original_avatar_url: null,
      original_publish_status: "published",
      original_published_at: "2026-01-01T00:00:00Z",
      translation_name: null,
      translation_role: null,
      translation_bio: null,
      translation_tiptap_json: null,
      translation_avatar_url: null,
      translation_publish_status: null,
      translation_published_at: null,
    };

    const result = rowToDeveloperWithTranslation(row);

    expect(result.name).toBe("원본 이름");
    expect(result.is_fallback).toBe(true);
  });
});
