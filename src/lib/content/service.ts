import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import * as postsRepo from "@/lib/db/posts";
import * as projectsRepo from "@/lib/db/projects";
import * as developersRepo from "@/lib/db/developers";
import * as tagsRepo from "@/lib/db/tags";
import type { Post, Project, Developer } from "@/lib/db/schema";
import type {
  UnifiedPost,
  UnifiedProject,
  UnifiedDeveloper,
} from "@/lib/content/types";
import type { Language } from "@/lib/config/languages";
import { getSlugFromEntryId } from "@/lib/content/utils";

async function mapD1Post(post: Post): Promise<UnifiedPost> {
  const tags = await tagsRepo.getPostTags(post.id, post.locale);
  return {
    id: post.id,
    locale: post.locale,
    title: post.title,
    description: post.description,
    pubDate: new Date(post.pub_date),
    coverImage: post.cover_image_url,
    tags,
    hidden: post.publish_status === "archived",
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
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    coverImage: post.data.coverImage ?? null,
    tags: post.data.tags,
    hidden: false,
    markdownContent: post.rendered?.html ?? post.body,
  };
}

async function mapD1Project(project: Project): Promise<UnifiedProject> {
  const tags = await tagsRepo.getProjectTags(project.id, project.locale);
  return {
    id: project.id,
    locale: project.locale,
    title: project.title,
    description: project.description,
    status: project.project_status,
    tags,
    duration: project.duration,
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
    d1Content: project.tiptap_json,
  };
}

function mapCollectionProject(
  project: CollectionEntry<"projects">,
  locale: string,
): UnifiedProject {
  return {
    id: getSlugFromEntryId(project.id),
    locale,
    title: project.data.title,
    description: project.data.description,
    status: project.data.status,
    tags: project.data.tags,
    duration: project.data.duration,
    startDate: null,
    endDate: null,
    teamSize: project.data.teamSize,
    role: project.data.role,
    order: project.data.order,
    url: project.data.url ?? null,
    sourceUrl: project.data.sourceUrl ?? null,
    blogUrl: project.data.blogUrl ?? null,
    coverImage: project.data.coverImage ?? null,
    hidden: false,
    markdownContent: project.rendered?.html ?? project.body,
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

function mapD1Developer(developer: Developer): UnifiedDeveloper {
  return {
    id: developer.id,
    locale: developer.locale,
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
    markdownContent: developer.rendered?.html ?? developer.body,
  };
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

export async function getPosts(lang: Language): Promise<UnifiedPost[]> {
  const [d1Posts, collectionPosts] = await Promise.all([
    postsRepo
      .getPosts(lang, { publishStatus: "published" })
      .then((posts) => Promise.all(posts.map(mapD1Post))),
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
        post?.publish_status === "published" ? await mapD1Post(post) : null,
      ),
    (async () => {
      const post = await getEntry("blog", `${lang}/${slug}`);
      return post && !post.data.draft ? mapCollectionPost(post, lang) : null;
    })(),
  ]);

  const merged = mergeContent(d1Post, collectionPost);
  if (merged) return merged;

  const fallbackPost = await postsRepo.getPostById(slug, "ko");
  if (fallbackPost?.publish_status === "published") {
    return mapD1Post(fallbackPost);
  }

  return null;
}

export async function getProjects(lang: Language): Promise<UnifiedProject[]> {
  const [d1Projects, collectionProjects] = await Promise.all([
    projectsRepo
      .getProjects(lang, { publishStatus: "published" })
      .then((projects) => Promise.all(projects.map(mapD1Project))),
    getCollection("projects", (project) => {
      const entryLang = project.id.split("/")[0];
      return entryLang === lang;
    }).then((projects) =>
      projects.map((project) => mapCollectionProject(project, lang)),
    ),
  ]);

  return mergeById(d1Projects, collectionProjects)
    .filter((project) => !project.hidden)
    .sort((a, b) => a.order - b.order);
}

export async function getProject(
  slug: string,
  lang: Language,
): Promise<UnifiedProject | null> {
  const [d1Project, collectionProject] = await Promise.all([
    projectsRepo
      .getProjectById(slug, lang)
      .then(async (project) =>
        project?.publish_status === "published"
          ? await mapD1Project(project)
          : null,
      ),
    (async () => {
      const project = await getEntry("projects", `${lang}/${slug}`);
      return project ? mapCollectionProject(project, lang) : null;
    })(),
  ]);

  const merged = mergeContent(d1Project, collectionProject);
  if (merged) return merged;

  const fallbackProject = await projectsRepo.getProjectById(slug, "ko");
  if (fallbackProject?.publish_status === "published") {
    return mapD1Project(fallbackProject);
  }

  return null;
}

export async function getDevelopers(
  lang: Language,
): Promise<UnifiedDeveloper[]> {
  const [d1Developers, collectionDevelopers] = await Promise.all([
    developersRepo
      .getDevelopers(lang)
      .then((developers) => developers.map(mapD1Developer)),
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
      .then((developer) => (developer ? mapD1Developer(developer) : null)),
    (async () => {
      const developer = await getEntry("developers", `${lang}/${slug}`);
      return developer ? mapCollectionDeveloper(developer, lang) : null;
    })(),
  ]);

  const merged = mergeContent(d1Developer, collectionDeveloper);
  if (merged) return merged;

  const fallbackDeveloper = await developersRepo.getDeveloperById(slug, "ko");
  if (fallbackDeveloper) {
    return mapD1Developer(fallbackDeveloper);
  }

  return null;
}
