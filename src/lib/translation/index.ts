import { translateFields } from "@/lib/openai/translation";
import * as postsRepo from "@/lib/db/posts";
import * as projectsRepo from "@/lib/db/projects";
import * as developersRepo from "@/lib/db/developers";
import {
  markAllStaleRunningJobsFailed,
  updateTranslationJobStatus,
} from "@/lib/db/translation-jobs";
import { hashContent } from "@/lib/hash";
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
  const source = await postsRepo.getPostTranslationById(
    job.id,
    job.sourceLocale,
  );
  if (!source) {
    throw new Error(`Source post not found: ${job.id}/${job.sourceLocale}`);
  }

  const translated = await translateFields(
    {
      title: source.title,
      description: source.description,
      role: null,
      body: source.body,
    },
    job.targetLocale,
  );

  const sourceHash = await hashContent(source.body);
  const existing = await postsRepo.getPostTranslationById(
    job.id,
    job.targetLocale,
  );

  if (existing) {
    await postsRepo.updatePostTranslation(job.id, job.targetLocale, {
      title: translated.title,
      description: translated.description,
      body: translated.body,
      source_hash: sourceHash,
    });
    return;
  }

  const now = new Date().toISOString();
  await postsRepo.createPostTranslation({
    id: `${source.post_id}_${job.targetLocale}`,
    post_id: source.post_id,
    locale: job.targetLocale,
    title: translated.title,
    description: translated.description,
    body: translated.body,
    cover_image_url: source.cover_image_url,
    publish_status: source.publish_status,
    published_at: source.published_at ? now : null,
    source_hash: sourceHash,
  });
}

async function translateProject(job: TranslationJobInput): Promise<void> {
  const source = await projectsRepo.getProjectTranslationById(
    job.id,
    job.sourceLocale,
  );
  if (!source) {
    throw new Error(`Source project not found: ${job.id}/${job.sourceLocale}`);
  }

  const translated = await translateFields(
    {
      title: source.title,
      description: source.description,
      role: source.role,
      body: source.body,
    },
    job.targetLocale,
  );

  const sourceHash = await hashContent(source.body);
  const existing = await projectsRepo.getProjectTranslationById(
    job.id,
    job.targetLocale,
  );

  if (existing) {
    await projectsRepo.updateProjectTranslation(job.id, job.targetLocale, {
      title: translated.title,
      description: translated.description,
      body: translated.body,
      role: translated.role ?? source.role,
      source_hash: sourceHash,
    });
    return;
  }

  const now = new Date().toISOString();
  await projectsRepo.createProjectTranslation({
    id: `${source.project_id}_${job.targetLocale}`,
    project_id: source.project_id,
    locale: job.targetLocale,
    title: translated.title,
    description: translated.description,
    body: translated.body,
    role: translated.role ?? source.role,
    cover_image_url: source.cover_image_url,
    publish_status: source.publish_status,
    published_at: source.published_at ? now : null,
    source_hash: sourceHash,
  });
}

async function translateDeveloper(job: TranslationJobInput): Promise<void> {
  const source = await developersRepo.getDeveloperTranslationById(
    job.id,
    job.sourceLocale,
  );
  if (!source) {
    throw new Error(
      `Source developer not found: ${job.id}/${job.sourceLocale}`,
    );
  }

  const [translated, translatedAfter] = await Promise.all([
    translateFields(
      {
        title: source.name,
        description: source.bio,
        role: source.role,
        body: source.intro,
      },
      job.targetLocale,
    ),
    source.body
      ? translateFields(
          {
            title: source.name,
            description: source.bio,
            role: source.role,
            body: source.body,
          },
          job.targetLocale,
        )
      : Promise.resolve(null),
  ]);

  const sourceHash = await hashContent(source.intro);
  const existing = await developersRepo.getDeveloperTranslationById(
    job.id,
    job.targetLocale,
  );

  const updates = {
    name: translated.title,
    role: translated.role ?? source.role,
    bio: translated.description ?? source.bio,
    intro: translated.body,
    body: translatedAfter?.body ?? source.body,
  };

  if (existing) {
    await developersRepo.updateDeveloperTranslation(job.id, job.targetLocale, {
      ...updates,
      source_hash: sourceHash,
    });
    return;
  }

  const now = new Date().toISOString();
  await developersRepo.createDeveloperTranslation({
    id: `${source.developer_id}_${job.targetLocale}`,
    developer_id: source.developer_id,
    locale: job.targetLocale,
    ...updates,
    avatar_url: source.avatar_url,
    publish_status: source.publish_status,
    published_at: source.published_at ? now : null,
    source_hash: sourceHash,
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

// Under Cloudflare's ~5 min waitUntil wall time, with buffer for
// catch handler to flush the status update.
const JOB_TIMEOUT_MS = 4 * 60 * 1000;

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

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      executeTranslation(jobInput),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(
          () =>
            reject(
              new Error(
                `Translation timed out after ${JOB_TIMEOUT_MS / 1000}s`,
              ),
            ),
          JOB_TIMEOUT_MS,
        );
      }),
    ]);
    await updateStatus("completed");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown translation error";
    await updateStatus("failed", message);
    // If our own job hit a wall-time kill, siblings likely did too.
    await markAllStaleRunningJobsFailed(
      5,
      "Worker terminated before completion (swept after sibling failure)",
    );
    throw error;
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
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
