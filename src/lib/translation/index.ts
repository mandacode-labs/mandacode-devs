import { translateFields } from "@/lib/openai/translation";
import * as postsRepo from "@/lib/db/posts";
import * as projectsRepo from "@/lib/db/projects";
import * as developersRepo from "@/lib/db/developers";
import type { Language } from "@/lib/config/languages";

export type ContentType = "post" | "project" | "developer";

export interface TranslationJob {
  contentType: ContentType;
  id: string;
  sourceLocale: Language;
  targetLocale: Language;
  authorId: string;
}

async function translatePost(job: TranslationJob): Promise<void> {
  const source = await postsRepo.getPostById(job.id, job.sourceLocale);
  if (!source) {
    return;
  }

  const translated = await translateFields(
    {
      title: source.title,
      description: source.description,
      role: null,
      tiptapJson: source.tiptap_json,
    },
    job.targetLocale,
  );

  const now = new Date().toISOString();

  await postsRepo.createPost({
    id: source.id,
    locale: job.targetLocale,
    origin: job.sourceLocale,
    author_id: job.authorId,
    title: translated.title,
    description: translated.description,
    tiptap_json: translated.tiptapJson,
    publish_status: source.publish_status,
    pub_date: source.pub_date,
    cover_image_url: source.cover_image_url,
    og_image_url: source.og_image_url,
    published_at: source.published_at ? now : null,
  });
}

async function translateProject(job: TranslationJob): Promise<void> {
  const source = await projectsRepo.getProjectById(job.id, job.sourceLocale);
  if (!source) {
    return;
  }

  const translated = await translateFields(
    {
      title: source.title,
      description: source.description,
      role: source.role,
      tiptapJson: source.tiptap_json,
    },
    job.targetLocale,
  );

  const now = new Date().toISOString();

  await projectsRepo.createProject({
    id: source.id,
    locale: job.targetLocale,
    origin: job.sourceLocale,
    author_id: job.authorId,
    title: translated.title,
    description: translated.description,
    tiptap_json: translated.tiptapJson,
    publish_status: source.publish_status,
    project_status: source.project_status,
    duration: source.duration,
    team_size: source.team_size,
    role: translated.role ?? source.role,
    project_order: source.project_order,
    url: source.url,
    source_url: source.source_url,
    blog_url: source.blog_url,
    cover_image_url: source.cover_image_url,
    published_at: source.published_at ? now : null,
  });
}

async function translateDeveloper(job: TranslationJob): Promise<void> {
  const source = await developersRepo.getDeveloperById(
    job.id,
    job.sourceLocale,
  );
  if (!source) {
    return;
  }

  const translated = await translateFields(
    {
      title: source.name,
      description: source.bio,
      role: source.role,
      tiptapJson: source.tiptap_json,
    },
    job.targetLocale,
  );

  const now = new Date().toISOString();

  await developersRepo.createDeveloper({
    id: source.id,
    locale: job.targetLocale,
    origin: job.sourceLocale,
    author_id: job.authorId,
    name: translated.title,
    role: translated.role ?? source.role,
    bio: translated.description ?? source.bio,
    tiptap_json: translated.tiptapJson,
    avatar_url: source.avatar_url,
    github_url: source.github_url,
    email: source.email,
    website_url: source.website_url,
    tech_stack: source.tech_stack,
    certifications: source.certifications,
    education: source.education,
    published_at: source.published_at ? now : null,
  });
}

export async function runTranslationJob(job: TranslationJob): Promise<void> {
  switch (job.contentType) {
    case "post":
      await translatePost(job);
      break;
    case "project":
      await translateProject(job);
      break;
    case "developer":
      await translateDeveloper(job);
      break;
    default:
      throw new Error(`Unsupported content type: ${job.contentType}`);
  }
}

export function createTranslationJobs(
  contentType: ContentType,
  id: string,
  sourceLocale: Language,
  targetLocales: Language[],
  authorId: string,
): TranslationJob[] {
  return targetLocales.map((targetLocale) => ({
    contentType,
    id,
    sourceLocale,
    targetLocale,
    authorId,
  }));
}
