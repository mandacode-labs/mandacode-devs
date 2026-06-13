import OpenAI from "openai";
import { SOURCE_LANGUAGE } from "./config.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export interface ChatOptions {
  system: string;
  user: string;
  model?: "gpt-4o-mini" | "gpt-4o";
  jsonMode?: boolean;
  temperature?: number;
}

export async function chat({
  system,
  user,
  model = "gpt-4o-mini",
  jsonMode = false,
  temperature = 0.3,
}: ChatOptions): Promise<string> {
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: jsonMode ? { type: "json_object" } : undefined,
    temperature,
  });

  return response.choices[0]?.message.content?.trim() || "";
}

export function getBaseSystemPrompt(
  operation: string,
  targetLang: string,
): string {
  return `You are a professional ${operation} assistant.
Work with ${targetLang === SOURCE_LANGUAGE ? "Korean" : targetLang} content.

Guidelines:
- Preserve all markdown formatting, code blocks, URLs, frontmatter metadata, and technical terms
- Do not translate content inside backticks or code fences
- Keep frontmatter structure intact
- Maintain the original meaning and tone unless instructed otherwise`;
}
