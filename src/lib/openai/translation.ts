import { OpenAI } from "openai";
import { env } from "cloudflare:workers";
import { ApiError } from "@/lib/api/response";
import {
  extractTexts,
  extractImageAlts,
  insertTexts,
  insertImageAlts,
  type TextNode,
  type ImageAltNode,
} from "@/lib/tiptap/translation";
import { parseJsonOrThrow } from "@/lib/utils/json";
import type { Language } from "@/lib/config/languages";

export interface TranslatableFields {
  title: string;
  description?: string | null;
  role?: string | null;
  tiptapJson: string;
}

export interface TranslatedFields {
  title: string;
  description: string | null;
  role: string | null;
  tiptapJson: string;
}

const TRANSLATION_SYSTEM_PROMPT = `You are a professional translator for a Korean tech blog.
Translate the given content into the target language while preserving the
original meaning and technical terminology.

The tiptapTexts array contains body content where each item has:
- type: the block kind (paragraph | heading | listItem | blockquote |
       codeBlock | tableCell | other)
- level (1-4): heading level when type=heading
- text: the text to translate
- marks: inline marks to preserve (bold | italic | code | link | underline |
         strike | highlight). Preserve the mark type and attrs; only the
         text field is translated.

Translation rules per type:
- heading: keep short, title-case where natural
- listItem: keep concise (often just a noun phrase)
- blockquote: preserve voice (e.g., first person)
- codeBlock: do NOT translate code syntax; translate inline comments
             and prose inside the code block
- tableCell: keep brief, similar to listItem
- paragraph: full natural translation

The imageAlts array contains image alt text. Translate each alt as a
concise descriptive caption in the target language.

For every text item, return the same path, type, level, and marks
arrays exactly as given. Only text should change. Return JSON matching
the requested schema exactly. Do not add or remove information.`;

function getOpenAIClient(): OpenAI {
  const { OPENAI_API_KEY } = env as Env & { OPENAI_API_KEY?: string };

  if (!OPENAI_API_KEY) {
    throw new ApiError("OPENAI_API_KEY is not configured", 500);
  }

  return new OpenAI({ apiKey: OPENAI_API_KEY });
}

const safeJsonParse = <T>(value: string): T =>
  parseJsonOrThrow<T>(value, "Invalid JSON content");

interface TranslationPayload {
  title: string;
  description: string | null;
  role: string | null;
  tiptapTexts: TextNode[];
  imageAlts: ImageAltNode[];
}

function buildTranslationPayload(
  fields: TranslatableFields,
): TranslationPayload {
  const tiptapJson = safeJsonParse<unknown>(fields.tiptapJson);

  return {
    title: fields.title,
    description: fields.description ?? null,
    role: fields.role ?? null,
    tiptapTexts: extractTexts(tiptapJson),
    imageAlts: extractImageAlts(tiptapJson),
  };
}

function assembleTranslatedFields(
  payload: TranslationPayload,
  translated: {
    title: string;
    description: string | null;
    role: string | null;
    tiptapTexts: string[];
    imageAlts: string[];
  },
  originalTiptapJson: string,
): TranslatedFields {
  const originalJson = safeJsonParse<unknown>(originalTiptapJson);

  const textNodes = payload.tiptapTexts.map((node, index) => ({
    path: node.path,
    type: node.type,
    level: node.level,
    text: translated.tiptapTexts[index] ?? node.text,
    marks: node.marks,
  }));
  const translatedJson = insertTexts(originalJson, textNodes);

  const altNodes = payload.imageAlts.map((node, index) => ({
    path: node.path,
    alt: translated.imageAlts[index] ?? node.alt,
  }));
  const withAlts = insertImageAlts(translatedJson, altNodes);

  return {
    title: translated.title,
    description: translated.description,
    role: translated.role,
    tiptapJson: JSON.stringify(withAlts),
  };
}

export async function translateFields(
  fields: TranslatableFields,
  targetLanguage: Language,
): Promise<TranslatedFields> {
  const client = getOpenAIClient();
  const payload = buildTranslationPayload(fields);

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: TRANSLATION_SYSTEM_PROMPT,
      },
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
            tiptapTexts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: {
                    type: "array",
                    items: { type: "number" },
                  },
                  type: {
                    type: "string",
                    enum: [
                      "paragraph",
                      "heading",
                      "listItem",
                      "blockquote",
                      "codeBlock",
                      "tableCell",
                      "other",
                    ],
                  },
                  level: { type: ["number", "null"] },
                  text: { type: "string" },
                  marks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        attrs: {
                          type: "object",
                          additionalProperties: true,
                        },
                      },
                      required: ["type"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["path", "type", "text", "marks"],
                additionalProperties: false,
              },
            },
            imageAlts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  path: {
                    type: "array",
                    items: { type: "number" },
                  },
                  alt: { type: "string" },
                },
                required: ["path", "alt"],
                additionalProperties: false,
              },
            },
          },
          required: [
            "title",
            "description",
            "role",
            "tiptapTexts",
            "imageAlts",
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new ApiError("Translation response is empty", 500);
  }

  const parsed = safeJsonParse<{
    title: string;
    description: string | null;
    role: string | null;
    tiptapTexts: string[];
    imageAlts: string[];
  }>(content);

  return assembleTranslatedFields(payload, parsed, fields.tiptapJson);
}
