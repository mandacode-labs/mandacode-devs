import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import * as postsRepo from "@/lib/db/posts";
import * as projectsRepo from "@/lib/db/projects";
import * as developersRepo from "@/lib/db/developers";
import * as tagsRepo from "@/lib/db/tags";
import type { PostWithTranslation } from "@/lib/db/posts";
import type { ProjectWithTranslation } from "@/lib/db/projects";
import type { DeveloperWithTranslation } from "@/lib/db/developers";
import type { PublishStatus } from "@/lib/db/schema";
import type {
  UnifiedPost,
  UnifiedProject,
  UnifiedDeveloper,
} from "@/lib/content/types";
import type { Language } from "@/lib/config/languages";
import { getSlugFromEntryId } from "@/lib/content/utils";

function mapD1Post(
  post: PostWithTranslation,
  lang: Language,
  tags: string[],
): UnifiedPost {
  return {
    id: post.id,
    locale: lang,
    originalLocale: post.original_locale,
    title: post.title,
    description: post.description,
    pubDate: post.published_at
      ? new Date(post.published_at)
      : new Date(post.created_at),
    coverImage: post.cover_image_url,
    tags,
    hidden: post.publish_status === "archived",
    publishStatus: post.publish_status,
    isFallback: post.is_fallback,
    d1Content: post.tiptap_json,
  };
}

function mapCollectionPost(
  post: CollectionEntry<"blog">,
  locale: string,
): UnifiedPost {
  return {
    id: getSlugFromEntryId(post.id),
    locale,
    originalLocale: locale,
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    coverImage: post.data.coverImage ?? null,
    tags: post.data.tags,
    hidden: false,
    publishStatus: "published" as PublishStatus,
    isFallback: false,
    markdownContent: post.rendered?.html ?? post.body,
  };
}

function mapD1Project(
  project: ProjectWithTranslation,
  lang: Language,
  tags: string[],
): UnifiedProject {
  return {
    id: project.id,
    locale: lang,
    originalLocale: project.original_locale,
    title: project.title,
    description: project.description,
    status: project.project_status,
    tags,
    startDate: project.start_date,
    endDate: project.end_date,
    teamSize: project.team_size,
    role: project.role,
    order: project.project_order,
    url: project.url,
    sourceUrl: project.source_url,
    blogUrl: project.blog_url,
    coverImage: project.cover_image_url,
    hidden: project.publish_status === "archived",
    publishStatus: project.publish_status,
    isFallback: project.is_fallback,
    d1Content: project.tiptap_json,
  };
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function mapD1Developer(
  developer: DeveloperWithTranslation,
  lang: Language,
): UnifiedDeveloper {
  return {
    id: developer.id,
    locale: lang,
    originalLocale: developer.original_locale,
    name: developer.name,
    role: developer.role,
    bio: developer.bio,
    avatar: developer.avatar_url,
    github: developer.github_url,
    email: developer.email,
    website: developer.website_url,
    techStack: safeJsonParse<string[]>(developer.tech_stack) ?? [],
    certifications:
      safeJsonParse<UnifiedDeveloper["certifications"]>(
        developer.certifications,
      ) ?? [],
    education:
      safeJsonParse<UnifiedDeveloper["education"]>(developer.education) ?? [],
    publishStatus: developer.publish_status,
    isFallback: developer.is_fallback,
    d1Content: developer.tiptap_json,
  };
}

function mapCollectionDeveloper(
  developer: CollectionEntry<"developers">,
  locale: string,
): UnifiedDeveloper {
  return {
    id: getSlugFromEntryId(developer.id),
    locale,
    originalLocale: locale,
    name: developer.data.name,
    role: developer.data.role,
    bio: developer.data.bio,
    avatar: developer.data.avatar ?? null,
    github: developer.data.github ?? null,
    email: developer.data.email ?? null,
    website: developer.data.website ?? null,
    techStack: developer.data.techStack ?? [],
    certifications: developer.data.certifications ?? [],
    education: developer.data.education ?? [],
    publishStatus: "published" as PublishStatus,
    isFallback: false,
    markdownContent: developer.rendered?.html ?? developer.body,
  };
}

export async function getPosts(lang: Language): Promise<UnifiedPost[]> {
  const [d1Posts, collectionPosts] = await Promise.all([
    postsRepo.getPosts(lang, { publishStatus: "published" }).then((posts) =>
      Promise.all(
        posts.map(async (post) => {
          const tags = await tagsRepo.getPostTags(post.id);
          return mapD1Post(post, lang, tags);
        }),
      ),
    ),
    getCollection("blog", (post) => {
      const entryLang = post.id.split("/")[0];
      return entryLang === lang && !post.data.draft;
    }).then((posts) => posts.map((post) => mapCollectionPost(post, lang))),
  ]);

  return mergeById(d1Posts, collectionPosts)
    .filter((post) => !post.hidden)
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
}

export async function getPost(
  slug: string,
  lang: Language,
): Promise<UnifiedPost | null> {
  const [d1Post, collectionPost] = await Promise.all([
    postsRepo
      .getPostById(slug, lang)
      .then(async (post) =>
        post && post.publish_status === "published"
          ? mapD1Post(post, lang, await tagsRepo.getPostTags(post.id))
          : null,
      ),
    (async () => {
      const post = await getEntry("blog", `${lang}/${slug}`);
      return post && !post.data.draft ? mapCollectionPost(post, lang) : null;
    })(),
  ]);

  const merged = mergeContent(d1Post, collectionPost);
  if (merged) return merged;

  const fallbackPost = await postsRepo.getPostById(slug, lang);
  if (fallbackPost && fallbackPost.publish_status === "published") {
    return mapD1Post(
      fallbackPost,
      lang,
      await tagsRepo.getPostTags(fallbackPost.id),
    );
  }

  return null;
}

export async function getProjects(lang: Language): Promise<UnifiedProject[]> {
  const d1Projects = await projectsRepo
    .getProjects(lang, { publishStatus: "published" })
    .then((projects) =>
      Promise.all(
        projects.map(async (project) => {
          const tags = await tagsRepo.getProjectTags(project.id);
          return mapD1Project(project, lang, tags);
        }),
      ),
    );

  return d1Projects
    .filter((project) => !project.hidden)
    .sort((a, b) => a.order - b.order);
}

export async function getProject(
  slug: string,
  lang: Language,
): Promise<UnifiedProject | null> {
  const d1Project = await projectsRepo
    .getProjectById(slug, lang)
    .then(async (project) =>
      project && project.publish_status === "published"
        ? mapD1Project(project, lang, await tagsRepo.getProjectTags(project.id))
        : null,
    );

  if (d1Project) return d1Project;

  const fallbackProject = await projectsRepo.getProjectById(slug, lang);
  if (fallbackProject && fallbackProject.publish_status === "published") {
    return mapD1Project(
      fallbackProject,
      lang,
      await tagsRepo.getProjectTags(fallbackProject.id),
    );
  }

  return null;
}

function mergeById<T extends { id: string; markdownContent?: string }>(
  d1Items: T[],
  collectionItems: T[],
): T[] {
  const d1Map = new Map(d1Items.map((item) => [item.id, item]));
  const collectionMap = new Map(collectionItems.map((item) => [item.id, item]));
  const merged: T[] = [];

  for (const id of new Set([...d1Map.keys(), ...collectionMap.keys()])) {
    const d1Item = d1Map.get(id);
    const collectionItem = collectionMap.get(id);

    if (d1Item && collectionItem) {
      merged.push({
        ...d1Item,
        markdownContent: collectionItem.markdownContent,
      });
    } else if (d1Item) {
      merged.push(d1Item);
    } else if (collectionItem) {
      merged.push(collectionItem);
    }
  }

  return merged;
}

function mergeContent<T extends { id: string; markdownContent?: string }>(
  d1Item: T | null,
  collectionItem: T | null,
): T | null {
  if (!d1Item && !collectionItem) return null;
  if (d1Item && collectionItem) {
    return { ...d1Item, markdownContent: collectionItem.markdownContent };
  }
  return d1Item ?? collectionItem;
}

export async function getDevelopers(
  lang: Language,
): Promise<UnifiedDeveloper[]> {
  const [d1Developers, collectionDevelopers] = await Promise.all([
    developersRepo
      .getDevelopers(lang)
      .then((developers) =>
        developers.map((developer) => mapD1Developer(developer, lang)),
      ),
    getCollection("developers", (developer) => {
      const entryLang = developer.id.split("/")[0];
      return entryLang === lang;
    }).then((developers) =>
      developers.map((developer) => mapCollectionDeveloper(developer, lang)),
    ),
  ]);

  return mergeById(d1Developers, collectionDevelopers).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export async function getDeveloper(
  slug: string,
  lang: Language,
): Promise<UnifiedDeveloper | null> {
  const [d1Developer, collectionDeveloper] = await Promise.all([
    developersRepo
      .getDeveloperById(slug, lang)
      .then((developer) =>
        developer ? mapD1Developer(developer, lang) : null,
      ),
    (async () => {
      const developer = await getEntry("developers", `${lang}/${slug}`);
      return developer ? mapCollectionDeveloper(developer, lang) : null;
    })(),
  ]);

  const merged = mergeContent(d1Developer, collectionDeveloper);
  if (merged) return merged;

  const fallbackDeveloper = await developersRepo.getDeveloperById(slug, lang);
  if (fallbackDeveloper) {
    return mapD1Developer(fallbackDeveloper, lang);
  }

  return null;
}
