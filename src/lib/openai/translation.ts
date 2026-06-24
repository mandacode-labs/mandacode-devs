import { OpenAI } from "openai";
import { env } from "cloudflare:workers";
import { ApiError } from "@/lib/api/response";
import {
  extractTexts,
  extractImageAlts,
  applyTranslations,
  type TextNode,
  type ImageAltNode,
  type TranslationResponse,
} from "@/lib/tiptap/translation";
import { z } from "zod";
import type { Language } from "@/lib/config/languages";

export interface TranslatableFields {
  title: string;
  description?: string | null;
  role?: string | null;
  intro: string;
}

export interface TranslatedFields {
  title: string;
  description: string | null;
  role: string | null;
  intro: string;
}

const TRANSLATION_SYSTEM_PROMPT = `You are a professional translator for a Korean tech blog.
Translate the given content into the target language while preserving
the original meaning and technical terminology.

Each segment is a self-contained piece of text. For every segment, the
input has a unique id and contextual metadata:

  - block: paragraph | heading | listItem | blockquote | codeBlock | tableCell
  - For headings: level (1-6) indicates the heading rank
  - For listItems: list (bullet|ordered), listDepth (0 = outermost),
    listIndex (0-based position within the immediate list)
  - For codeBlocks: language; do NOT translate code syntax; translate
    only natural-language comments inside the code
  - For tableCells: row (0-based), col (0-based), isHeader (true for
    header row cells); keep the term style consistent across cells in
    the same column

Each segment also carries inline marks (bold, italic, code, link,
underline, strike, highlight). Preserve the mark type and attrs; only
the text field is translated.

Translation rules per block:
  - heading: keep short, title-case where natural
  - listItem: keep concise (often just a noun phrase)
  - blockquote: preserve voice (e.g., first person)
  - codeBlock: do NOT translate code; translate inline comments only
  - tableCell: keep brief, similar to listItem
  - paragraph: full natural translation

Output rules:
  - Echo the id of every segment exactly as given
  - Translate only the text field; leave marks unchanged
  - Return one entry per input segment in the segments array
  - Return one entry per input image in the alts array
  - Do not add, remove, or reorder items`;

function getOpenAIClient(): OpenAI {
  const { OPENAI_API_KEY } = env as Env & { OPENAI_API_KEY?: string };

  if (!OPENAI_API_KEY) {
    throw new ApiError("OPENAI_API_KEY is not configured", 500);
  }

  return new OpenAI({ apiKey: OPENAI_API_KEY });
}

interface SegmentForPrompt {
  id: string;
  block: string;
  level?: number;
  list?: string;
  listDepth?: number;
  listIndex?: number;
  row?: number;
  col?: number;
  isHeader?: boolean;
  language?: string;
  text: string;
  marks: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

interface AltForPrompt {
  id: string;
  alt: string;
}

interface TranslationPayload {
  title: string;
  description: string | null;
  role: string | null;
  segments: SegmentForPrompt[];
  alts: AltForPrompt[];
}

function buildPayload(
  fields: TranslatableFields,
  segments: TextNode[],
  alts: ImageAltNode[],
): TranslationPayload {
  return {
    title: fields.title,
    description: fields.description ?? null,
    role: fields.role ?? null,
    segments: segments.map((s) => {
      const seg: SegmentForPrompt = {
        id: s.id,
        block: s.block,
        text: s.text,
        marks: s.marks,
      };
      if (s.level !== undefined) seg.level = s.level;
      if (s.list !== undefined) seg.list = s.list;
      if (s.listDepth !== undefined) seg.listDepth = s.listDepth;
      if (s.listIndex !== undefined) seg.listIndex = s.listIndex;
      if (s.row !== undefined) seg.row = s.row;
      if (s.col !== undefined) seg.col = s.col;
      if (s.isHeader !== undefined) seg.isHeader = s.isHeader;
      if (s.language !== undefined) seg.language = s.language;
      return seg;
    }),
    alts: alts.map((a) => ({ id: a.id, alt: a.alt })),
  };
}

const translatedSegmentSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    text: { type: "string" },
  },
  required: ["id", "text"],
  additionalProperties: false,
} as const;

const translatedAltSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    alt: { type: "string" },
  },
  required: ["id", "alt"],
  additionalProperties: false,
} as const;

export async function translateFields(
  fields: TranslatableFields,
  targetLanguage: Language,
): Promise<TranslatedFields> {
  const client = getOpenAIClient();
  const intro = JSON.parse(fields.intro) as unknown;
  const segments = extractTexts(intro);
  const alts = extractImageAlts(intro);
  const payload = buildPayload(fields, segments, alts);

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: TRANSLATION_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Translate the following content from Korean to ${targetLanguage}.\n\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "translation_response",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: ["string", "null"] },
            role: { type: ["string", "null"] },
            segments: {
              type: "array",
              items: translatedSegmentSchema,
            },
            alts: {
              type: "array",
              items: translatedAltSchema,
            },
          },
          required: ["title", "description", "role", "segments", "alts"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new ApiError("Translation response is empty", 500);
  }

  const responseSchema = z.object({
    title: z.string(),
    description: z.string().nullable(),
    role: z.string().nullable(),
    segments: z.array(z.object({ id: z.string(), text: z.string() })),
    alts: z.array(z.object({ id: z.string(), alt: z.string() })),
  });

  let parsed: z.infer<typeof responseSchema>;
  try {
    parsed = responseSchema.parse(JSON.parse(content));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";
    throw new ApiError(`Invalid translation response: ${message}`, 500);
  }

  const translationResponse: TranslationResponse = {
    segments: parsed.segments,
    alts: parsed.alts,
  };

  const applied = applyTranslations(
    fields.intro,
    segments,
    alts,
    translationResponse,
  );

  if (applied.missingSegmentIds.length > 0) {
    throw new ApiError(
      `Translation missing segments: ${applied.missingSegmentIds.join(", ")}`,
      500,
    );
  }
  if (applied.unknownSegmentIds.length > 0) {
    throw new ApiError(
      `Translation returned unknown segments: ${applied.unknownSegmentIds.join(", ")}`,
      500,
    );
  }
  if (applied.missingAltIds.length > 0) {
    throw new ApiError(
      `Translation missing alts: ${applied.missingAltIds.join(", ")}`,
      500,
    );
  }
  if (applied.unknownAltIds.length > 0) {
    throw new ApiError(
      `Translation returned unknown alts: ${applied.unknownAltIds.join(", ")}`,
      500,
    );
  }

  return {
    title: parsed.title,
    description: parsed.description,
    role: parsed.role,
    intro: applied.intro,
  };
}
