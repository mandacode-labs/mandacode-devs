import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import crypto from "node:crypto";
import { PATHS, SOURCE_LANGUAGE } from "./config.js";

export interface MarkdownFile {
  collection: string;
  slug: string;
  lang: string;
  filePath: string;
  data: Record<string, unknown>;
  content: string;
  raw: string;
}

export function getHash(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

export function readMarkdown(filePath: string): matter.GrayMatterFile<string> {
  const raw = fs.readFileSync(filePath, "utf-8");
  return matter(raw);
}

export function writeMarkdown(
  filePath: string,
  data: Record<string, unknown>,
  content: string,
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, matter.stringify(content, data));
}

export function getContentFiles(): MarkdownFile[] {
  const files: MarkdownFile[] = [];

  for (const collection of fs.readdirSync(PATHS.content)) {
    const collectionPath = path.join(PATHS.content, collection);
    if (!fs.statSync(collectionPath).isDirectory()) continue;

    for (const slug of fs.readdirSync(collectionPath)) {
      const slugPath = path.join(collectionPath, slug);
      if (!fs.statSync(slugPath).isDirectory()) continue;

      for (const file of fs.readdirSync(slugPath)) {
        if (!file.endsWith(".md")) continue;

        const lang = file.replace(".md", "");
        const filePath = path.join(slugPath, file);
        const parsed = readMarkdown(filePath);

        files.push({
          collection,
          slug,
          lang,
          filePath,
          data: parsed.data,
          content: parsed.content,
          raw: fs.readFileSync(filePath, "utf-8"),
        });
      }
    }
  }

  return files;
}

export function getSourceContentFiles(): MarkdownFile[] {
  return getContentFiles().filter((file) => file.lang === SOURCE_LANGUAGE);
}

export function getTargetContentFiles(targetLang: string): MarkdownFile[] {
  return getContentFiles().filter((file) => file.lang === targetLang);
}

export function getSourceFileForTarget(
  targetFile: MarkdownFile,
): MarkdownFile | undefined {
  const sourcePath = targetFile.filePath.replace(
    new RegExp(`/${targetFile.lang}\\.md$`),
    `/${SOURCE_LANGUAGE}.md`,
  );
  if (!fs.existsSync(sourcePath)) return undefined;

  const parsed = readMarkdown(sourcePath);
  return {
    ...targetFile,
    lang: SOURCE_LANGUAGE,
    filePath: sourcePath,
    data: parsed.data,
    content: parsed.content,
    raw: fs.readFileSync(sourcePath, "utf-8"),
  };
}

export function getTargetPath(
  sourceFile: MarkdownFile,
  targetLang: string,
): string {
  return sourceFile.filePath.replace(
    new RegExp(`/${sourceFile.lang}\\.md$`),
    `/${targetLang}.md`,
  );
}
