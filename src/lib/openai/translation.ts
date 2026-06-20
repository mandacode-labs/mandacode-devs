import { OpenAI } from "openai";
import { env } from "cloudflare:workers";
import { ApiError } from "@/lib/api/response";
import {
  extractTexts,
  insertTexts,
  type TextNode,
} from "@/lib/tiptap/translation";
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
Translate the given content into the target language while preserving the original meaning and technical terminology.
Maintain a natural, fluent tone appropriate for a developer blog.
Do not add or remove information.
Return JSON matching the requested schema exactly.`;

function getOpenAIClient(): OpenAI {
  const { OPENAI_API_KEY } = env as Env & { OPENAI_API_KEY?: string };

  if (!OPENAI_API_KEY) {
    throw new ApiError("OPENAI_API_KEY is not configured", 500);
  }

  return new OpenAI({ apiKey: OPENAI_API_KEY });
}

function safeJsonParse<T>(value: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new ApiError("Invalid JSON content", 400);
  }
}

function buildTranslationPayload(fields: TranslatableFields): {
  title: string;
  description: string | null;
  role: string | null;
  tiptapTexts: TextNode[];
} {
  const tiptapJson = safeJsonParse<unknown>(fields.tiptapJson);
  const textNodes = extractTexts(tiptapJson);

  return {
    title: fields.title,
    description: fields.description ?? null,
    role: fields.role ?? null,
    tiptapTexts: textNodes,
  };
}

function assembleTranslatedFields(
  payload: ReturnType<typeof buildTranslationPayload>,
  translated: {
    title: string;
    description: string | null;
    role: string | null;
    tiptapTexts: string[];
  },
  originalTiptapJson: string,
): TranslatedFields {
  const originalJson = safeJsonParse<unknown>(originalTiptapJson);

  const textNodes = payload.tiptapTexts.map((node, index) => ({
    path: node.path,
    text: translated.tiptapTexts[index] ?? node.text,
  }));

  const translatedJson = insertTexts(originalJson, textNodes);

  return {
    title: translated.title,
    description: translated.description,
    role: translated.role,
    tiptapJson: JSON.stringify(translatedJson),
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
              items: { type: "string" },
            },
          },
          required: ["title", "description", "role", "tiptapTexts"],
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
  }>(content);

  return assembleTranslatedFields(payload, parsed, fields.tiptapJson);
}
