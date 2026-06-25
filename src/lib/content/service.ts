import * as postsRepo from "@/lib/db/posts";
import * as projectsRepo from "@/lib/db/projects";
import * as developersRepo from "@/lib/db/developers";
import * as tagsRepo from "@/lib/db/tags";
import type { PostWithTranslation } from "@/lib/db/posts";
import type { ProjectWithTranslation } from "@/lib/db/projects";
import type { DeveloperWithTranslation } from "@/lib/db/developers";
import type {
  DeveloperCertificationFull,
  DeveloperEducationFull,
} from "@/lib/db/developers";
import type {
  UnifiedPost,
  UnifiedProject,
  UnifiedDeveloper,
} from "@/lib/content/types";
import { type Language } from "@/lib/config/languages";

function getDeveloperTags(developerId: string): Promise<string[]> {
  return tagsRepo.getDeveloperTags(developerId);
}

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
    path: post.path,
    tags,
    hidden: post.publish_status === "archived",
    publishStatus: post.publish_status,
    isFallback: post.is_fallback,
    body: post.body,
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
    blogPostId: project.blog_post_id,
    coverImage: project.cover_image_url,
    hidden: project.publish_status === "archived",
    publishStatus: project.publish_status,
    isFallback: project.is_fallback,
    body: project.body,
  };
}

function mapD1Developer(
  developer: DeveloperWithTranslation,
  techStack: string[],
  certs: DeveloperCertificationFull[],
  edu: DeveloperEducationFull[],
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
    techStack,
    certifications: certs.map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer,
      date: c.date,
      badge: c.badge_url,
    })),
    education: edu.map((e) => ({
      id: e.id,
      startDate: e.start_date,
      endDate: e.end_date,
      institution: e.institution,
      department: e.department,
      status: e.status,
    })),
    publishStatus: developer.publish_status,
    isFallback: developer.is_fallback,
    intro: developer.intro,
    body: developer.body,
  };
}

export async function getPosts(
  lang: Language,
  options: { pathPrefix?: string } = {},
): Promise<UnifiedPost[]> {
  const d1Posts = await postsRepo
    .getPosts(lang, {
      publishStatus: "published",
      pathPrefix: options.pathPrefix,
    })
    .then((posts) =>
      Promise.all(
        posts.map(async (post) => {
          const tags = await tagsRepo.getPostTags(post.id);
          return mapD1Post(post, lang, tags);
        }),
      ),
    );

  return d1Posts
    .filter((post) => !post.hidden)
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
}

export async function getPost(
  slug: string,
  lang: Language,
): Promise<UnifiedPost | null> {
  // The DB join already falls back to the post's original translation
  // when the requested lang has none (see buildByIdQuery in
  // src/lib/db/translation-repo.ts).
  const post = await postsRepo
    .getPostById(slug, lang)
    .then(async (p) =>
      p && p.publish_status === "published"
        ? mapD1Post(p, lang, await tagsRepo.getPostTags(p.id))
        : null,
    );
  return post;
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
  // The DB join already falls back to the original when the requested
  // lang has no translation, so a single getProjectById call covers both.
  return projectsRepo
    .getProjectById(slug, lang)
    .then(async (project) =>
      project && project.publish_status === "published"
        ? mapD1Project(project, lang, await tagsRepo.getProjectTags(project.id))
        : null,
    );
}

export async function getPostForAdminPreview(
  id: string,
  lang: Language,
): Promise<UnifiedPost | null> {
  const post = await postsRepo.getPostById(id, lang);
  if (!post) return null;
  return mapD1Post(post, lang, await tagsRepo.getPostTags(post.id));
}

export async function getProjectForAdminPreview(
  id: string,
  lang: Language,
): Promise<UnifiedProject | null> {
  const project = await projectsRepo.getProjectById(id, lang);
  if (!project) return null;
  return mapD1Project(project, lang, await tagsRepo.getProjectTags(project.id));
}

export async function getProjectsForAdminPreview(
  lang: Language,
): Promise<UnifiedProject[]> {
  const d1Projects = await projectsRepo
    .getProjects(lang, { includeUnpublished: true })
    .then((projects) =>
      Promise.all(
        projects.map(async (project) => {
          const tags = await tagsRepo.getProjectTags(project.id);
          return mapD1Project(project, lang, tags);
        }),
      ),
    );

  return d1Projects.sort((a, b) => a.order - b.order);
}

export async function getDeveloperForAdminPreview(
  id: string,
  lang: Language,
): Promise<UnifiedDeveloper | null> {
  const developer = await developersRepo.getDeveloperById(id, lang);
  if (!developer) return null;
  const [certs, edu, techStack] = await Promise.all([
    developersRepo.getDeveloperCertifications(id, lang),
    developersRepo.getDeveloperEducation(id, lang),
    getDeveloperTags(id),
  ]);
  return mapD1Developer(developer, techStack, certs, edu, lang);
}

export async function getPostPaths(): Promise<
  Array<{ path: string; count: number }>
> {
  return postsRepo.listPostPaths();
}

export async function getDevelopers(
  lang: Language,
): Promise<UnifiedDeveloper[]> {
  const d1Developers = await developersRepo
    .getDevelopers(lang)
    .then(async (developers) => {
      return Promise.all(
        developers.map(async (developer) => {
          const [certs, edu, techStack] = await Promise.all([
            developersRepo.getDeveloperCertifications(developer.id, lang),
            developersRepo.getDeveloperEducation(developer.id, lang),
            getDeveloperTags(developer.id),
          ]);
          return mapD1Developer(developer, techStack, certs, edu, lang);
        }),
      );
    });

  return d1Developers.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getDeveloper(
  slug: string,
  lang: Language,
): Promise<UnifiedDeveloper | null> {
  // The DB join already falls back to the original locale when the
  // requested lang has no translation, so a single getDeveloperById call
  // covers both the requested locale and the fallback.
  const developer = await developersRepo.getDeveloperById(slug, lang);
  if (!developer) return null;
  const [certs, edu, techStack] = await Promise.all([
    developersRepo.getDeveloperCertifications(slug, lang),
    developersRepo.getDeveloperEducation(slug, lang),
    getDeveloperTags(slug),
  ]);
  return mapD1Developer(developer, techStack, certs, edu, lang);
}
