import { translateFields } from "@/lib/openai/translation";
import * as postsRepo from "@/lib/db/posts";
import * as projectsRepo from "@/lib/db/projects";
import * as developersRepo from "@/lib/db/developers";
import { updateTranslationJobStatus } from "@/lib/db/translation-jobs";
import type { Language } from "@/lib/config/languages";
import type { TranslationContentType } from "@/lib/db/schema";

export type ContentType = TranslationContentType;

export interface TranslationJobInput {
  contentType: ContentType;
  id: string;
  sourceLocale: Language;
  targetLocale: Language;
  authorId: string;
}

async function translatePost(job: TranslationJobInput): Promise<void> {
  const source = await postsRepo.getPostById(job.id, job.sourceLocale);
  if (!source) {
    throw new Error(`Source post not found: ${job.id}/${job.sourceLocale}`);
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

async function translateProject(job: TranslationJobInput): Promise<void> {
  const source = await projectsRepo.getProjectById(job.id, job.sourceLocale);
  if (!source) {
    throw new Error(`Source project not found: ${job.id}/${job.sourceLocale}`);
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

async function translateDeveloper(job: TranslationJobInput): Promise<void> {
  const source = await developersRepo.getDeveloperById(
    job.id,
    job.sourceLocale,
  );
  if (!source) {
    throw new Error(
      `Source developer not found: ${job.id}/${job.sourceLocale}`,
    );
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

async function executeTranslation(job: TranslationJobInput): Promise<void> {
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

export async function runTranslationJob(
  jobInput: TranslationJobInput,
  jobId?: string,
): Promise<void> {
  const updateStatus = async (
    status: "running" | "completed" | "failed",
    errorMessage?: string,
  ) => {
    if (jobId) {
      await updateTranslationJobStatus(jobId, status, errorMessage);
    }
  };

  await updateStatus("running");

  try {
    await executeTranslation(jobInput);
    await updateStatus("completed");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown translation error";
    await updateStatus("failed", message);
    throw error;
  }
}

export function createTranslationJobInputs(
  contentType: ContentType,
  id: string,
  sourceLocale: Language,
  targetLocales: Language[],
  authorId: string,
): TranslationJobInput[] {
  return targetLocales.map((targetLocale) => ({
    contentType,
    id,
    sourceLocale,
    targetLocale,
    authorId,
  }));
}
