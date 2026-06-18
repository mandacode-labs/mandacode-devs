import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import * as postsRepo from "@/lib/db/posts";
import * as projectsRepo from "@/lib/db/projects";
import * as developersRepo from "@/lib/db/developers";
import type { Post, Project, Developer } from "@/lib/db/schema";
import type {
  UnifiedPost,
  UnifiedProject,
  UnifiedDeveloper,
} from "@/lib/content/types";
import type { Language } from "@/lib/config/languages";

function mapD1Post(post: Post): UnifiedPost {
  return {
    id: post.id,
    locale: post.locale,
    title: post.title,
    description: post.description,
    pubDate: new Date(post.pub_date),
    coverImage: post.cover_image_url,
    ogImage: post.og_image_url,
    tags: [],
    hidden: post.hidden === 1,
    source: "d1",
    content: post.tiptap_json,
  };
}

function mapCollectionPost(
  post: CollectionEntry<"blog">,
  locale: string,
): UnifiedPost {
  return {
    id: post.id,
    locale,
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    coverImage: post.data.coverImage ?? null,
    ogImage: post.data.ogImage ?? null,
    tags: post.data.tags,
    hidden: false,
    source: "collection",
    content: post.rendered?.html ?? post.body,
  };
}

export async function getPosts(lang: Language): Promise<UnifiedPost[]> {
  const [d1Posts, collectionPosts] = await Promise.all([
    postsRepo
      .getPosts(lang, { publishStatus: "published" })
      .then((posts) => posts.map(mapD1Post)),
    getCollection("blog", (post) => {
      const entryLang = post.id.split("/")[0];
      return entryLang === lang && !post.data.draft;
    }).then((posts) => posts.map((post) => mapCollectionPost(post, lang))),
  ]);

  const d1Ids = new Set(d1Posts.map((post) => post.id));
  const merged = [
    ...d1Posts,
    ...collectionPosts.filter((post) => !d1Ids.has(post.id) && !post.hidden),
  ];

  return merged.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
}

export async function getPost(
  slug: string,
  lang: Language,
): Promise<UnifiedPost | null> {
  const d1Post = await postsRepo.getPostByIdWithFallback(slug, lang, "ko");

  if (d1Post?.publish_status === "published" && !d1Post.hidden) {
    return mapD1Post(d1Post);
  }

  const collectionId = `${lang}/${slug}`;
  const collectionPost = await getEntry("blog", collectionId);

  if (collectionPost && !collectionPost.data.draft) {
    return mapCollectionPost(collectionPost, lang);
  }

  return null;
}

function mapD1Project(project: Project): UnifiedProject {
  return {
    id: project.id,
    locale: project.locale,
    title: project.title,
    description: project.description,
    status: project.project_status,
    techStack: [],
    duration: project.duration,
    teamSize: project.team_size,
    role: project.role,
    order: project.project_order,
    url: project.url,
    sourceUrl: project.source_url,
    blogUrl: project.blog_url,
    coverImage: project.cover_image_url,
    hidden: project.hidden === 1,
    source: "d1",
    content: project.tiptap_json,
  };
}

function mapCollectionProject(
  project: CollectionEntry<"projects">,
  locale: string,
): UnifiedProject {
  return {
    id: project.id,
    locale,
    title: project.data.title,
    description: project.data.description,
    status: project.data.status,
    techStack: project.data.techStack,
    duration: project.data.duration,
    teamSize: project.data.teamSize,
    role: project.data.role,
    order: project.data.order,
    url: project.data.url ?? null,
    sourceUrl: project.data.sourceUrl ?? null,
    blogUrl: project.data.blogUrl ?? null,
    coverImage: project.data.coverImage ?? null,
    hidden: false,
    source: "collection",
    content: project.rendered?.html ?? project.body,
  };
}

export async function getProjects(lang: Language): Promise<UnifiedProject[]> {
  const [d1Projects, collectionProjects] = await Promise.all([
    projectsRepo
      .getProjects(lang, { publishStatus: "published" })
      .then((projects) => projects.map(mapD1Project)),
    getCollection("projects", (project) => {
      const entryLang = project.id.split("/")[0];
      return entryLang === lang;
    }).then((projects) =>
      projects.map((project) => mapCollectionProject(project, lang)),
    ),
  ]);

  const d1Ids = new Set(d1Projects.map((project) => project.id));
  const merged = [
    ...d1Projects,
    ...collectionProjects.filter(
      (project) => !d1Ids.has(project.id) && !project.hidden,
    ),
  ];

  return merged.sort((a, b) => a.order - b.order);
}

export async function getProject(
  slug: string,
  lang: Language,
): Promise<UnifiedProject | null> {
  const d1Project = await projectsRepo.getProjectByIdWithFallback(
    slug,
    lang,
    "ko",
  );

  if (d1Project?.publish_status === "published" && !d1Project.hidden) {
    return mapD1Project(d1Project);
  }

  const collectionId = `${lang}/${slug}`;
  const collectionProject = await getEntry("projects", collectionId);

  if (collectionProject) {
    return mapCollectionProject(collectionProject, lang);
  }

  return null;
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
    techStack: developer.tech_stack
      ? (JSON.parse(developer.tech_stack) as string[])
      : [],
    certifications: developer.certifications
      ? (JSON.parse(
          developer.certifications,
        ) as UnifiedDeveloper["certifications"])
      : [],
    education: developer.education
      ? (JSON.parse(developer.education) as UnifiedDeveloper["education"])
      : [],
    source: "d1",
    content: developer.tiptap_json,
  };
}

function mapCollectionDeveloper(
  developer: CollectionEntry<"developers">,
  locale: string,
): UnifiedDeveloper {
  return {
    id: developer.id,
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
    source: "collection",
    content: developer.rendered?.html ?? developer.body,
  };
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

  const d1Ids = new Set(d1Developers.map((developer) => developer.id));
  const merged = [
    ...d1Developers,
    ...collectionDevelopers.filter((developer) => !d1Ids.has(developer.id)),
  ];

  return merged.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getDeveloper(
  slug: string,
  lang: Language,
): Promise<UnifiedDeveloper | null> {
  const d1Developer = await developersRepo.getDeveloperByIdWithFallback(
    slug,
    lang,
    "ko",
  );

  if (d1Developer) {
    return mapD1Developer(d1Developer);
  }

  const collectionId = `${lang}/${slug}`;
  const collectionDeveloper = await getEntry("developers", collectionId);

  if (collectionDeveloper) {
    return mapCollectionDeveloper(collectionDeveloper, lang);
  }

  return null;
}
