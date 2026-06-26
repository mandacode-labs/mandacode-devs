export type TextBlockType =
  | "paragraph"
  | "heading"
  | "listItem"
  | "blockquote"
  | "codeBlock"
  | "tableCell"
  | "other";

export type ListKind = "bullet" | "ordered";

export interface TextMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TextNode {
  id: string;
  path: number[];
  block: TextBlockType;
  text: string;
  marks: TextMark[];
  level?: number;
  list?: ListKind;
  listDepth?: number;
  listIndex?: number;
  row?: number;
  col?: number;
  isHeader?: boolean;
  language?: string;
}

export interface ImageAltNode {
  id: string;
  path: number[];
  alt: string;
}

interface SegmentContext {
  block: TextBlockType;
  level?: number;
  list?: ListKind;
  listDepth?: number;
  listIndex?: number;
  row?: number;
  col?: number;
  isHeader?: boolean;
  language?: string;
}

const defaultContext: SegmentContext = { block: "other" };

let idCounter = 0;
function resetIdCounter(): void {
  idCounter = 0;
}

function nextId(): string {
  idCounter += 1;
  return `s${idCounter}`;
}

function nextAltId(): string {
  idCounter += 1;
  return `a${idCounter}`;
}

function getNodeType(node: unknown): string | undefined {
  if (typeof node !== "object" || node === null) return undefined;
  const t = (node as Record<string, unknown>).type;
  return typeof t === "string" ? t : undefined;
}

function getAttrs(node: unknown): Record<string, unknown> | undefined {
  if (typeof node !== "object" || node === null) return undefined;
  const a = (node as Record<string, unknown>).attrs;
  if (a && typeof a === "object") return a as Record<string, unknown>;
  return undefined;
}

function readLevel(node: unknown): number | undefined {
  const attrs = getAttrs(node);
  if (!attrs) return undefined;
  const v = attrs.level;
  if (typeof v === "number" && v >= 1 && v <= 6) return v;
  return undefined;
}

function readStringAttr(node: unknown, key: string): string | undefined {
  const attrs = getAttrs(node);
  if (!attrs) return undefined;
  const v = attrs[key];
  if (typeof v === "string" && v.length > 0) return v;
  return undefined;
}

function readListType(node: unknown): ListKind | undefined {
  const attrs = getAttrs(node);
  if (!attrs) return "bullet";
  const t = attrs.type;
  if (t === "ordered") return "ordered";
  return "bullet";
}

function extractMarks(node: Record<string, unknown>): TextMark[] {
  const marks = node.marks;
  if (!Array.isArray(marks)) return [];
  const result: TextMark[] = [];
  for (const m of marks) {
    if (m && typeof m === "object" && typeof m.type === "string") {
      const mark: TextMark = { type: m.type };
      if (m.attrs && typeof m.attrs === "object") {
        mark.attrs = m.attrs as Record<string, unknown>;
      }
      result.push(mark);
    }
  }
  return result;
}

function buildContext(
  type: string,
  obj: Record<string, unknown>,
  parentCtx: SegmentContext,
): SegmentContext {
  switch (type) {
    case "heading": {
      const level = readLevel(obj);
      const next: SegmentContext = { ...parentCtx, block: "heading" };
      if (level !== undefined) next.level = level;
      return next;
    }
    case "paragraph":
      if (
        parentCtx.block === "listItem" ||
        parentCtx.block === "blockquote" ||
        parentCtx.block === "tableCell"
      ) {
        return parentCtx;
      }
      return { ...parentCtx, block: "paragraph" };
    case "blockquote":
      return { ...parentCtx, block: "blockquote" };
    case "codeBlock": {
      const language = readStringAttr(obj, "language");
      const next: SegmentContext = { ...parentCtx, block: "codeBlock" };
      if (language !== undefined) next.language = language;
      return next;
    }
    case "bulletList": {
      const listDepth = (parentCtx.listDepth ?? -1) + 1;
      const next: SegmentContext = { ...parentCtx, list: "bullet", listDepth };
      delete (next as Partial<SegmentContext>).listIndex;
      return next;
    }
    case "orderedList": {
      const listDepth = (parentCtx.listDepth ?? -1) + 1;
      const next: SegmentContext = { ...parentCtx, list: "ordered", listDepth };
      delete (next as Partial<SegmentContext>).listIndex;
      return next;
    }
    case "listItem":
      return { ...parentCtx, block: "listItem" };
    case "tableCell":
    case "tableHeader":
      return { ...parentCtx, block: "tableCell" };
    case "tableRow":
    case "table":
    default:
      return parentCtx;
  }
}

function childContextFor(
  parentType: string,
  childType: string | undefined,
  index: number,
  parentCtx: SegmentContext,
): SegmentContext {
  if (
    (parentType === "bulletList" || parentType === "orderedList") &&
    childType === "listItem"
  ) {
    return { ...parentCtx, listIndex: index };
  }
  if (parentType === "table" && childType === "tableRow") {
    return { ...parentCtx, row: index };
  }
  if (parentType === "tableRow" && childType === "tableHeader") {
    return { ...parentCtx, col: index, isHeader: true };
  }
  if (parentType === "tableRow" && childType === "tableCell") {
    return { ...parentCtx, col: index, isHeader: false };
  }
  return parentCtx;
}

function contextToNode(
  ctx: SegmentContext,
  path: number[],
  id: string,
  text: string,
  marks: TextMark[],
): TextNode {
  const node: TextNode = {
    id,
    path: [...path],
    block: ctx.block,
    text,
    marks,
  };
  if (ctx.level !== undefined) node.level = ctx.level;
  if (ctx.list !== undefined) node.list = ctx.list;
  if (ctx.listDepth !== undefined) node.listDepth = ctx.listDepth;
  if (ctx.listIndex !== undefined) node.listIndex = ctx.listIndex;
  if (ctx.row !== undefined) node.row = ctx.row;
  if (ctx.col !== undefined) node.col = ctx.col;
  if (ctx.isHeader !== undefined) node.isHeader = ctx.isHeader;
  if (ctx.language !== undefined) node.language = ctx.language;
  return node;
}

function walkTexts(
  node: unknown,
  path: number[],
  ctx: SegmentContext,
): TextNode[] {
  const type = getNodeType(node);
  if (!type) return [];

  if (type === "text") {
    const obj = node as Record<string, unknown>;
    if (typeof obj.text !== "string") return [];
    return [contextToNode(ctx, path, nextId(), obj.text, extractMarks(obj))];
  }

  const obj = node as Record<string, unknown>;
  const newCtx = buildContext(type, obj, ctx);

  if (!Array.isArray(obj.content)) return [];
  const results: TextNode[] = [];
  (obj.content as unknown[]).forEach((child, i) => {
    const childType = getNodeType(child);
    const childCtx = childContextFor(type, childType, i, newCtx);
    results.push(...walkTexts(child, [...path, i], childCtx));
  });
  return results;
}

export function extractTexts(node: unknown): TextNode[] {
  resetIdCounter();
  return walkTexts(node, [], defaultContext);
}

function walkImageAlts(
  node: unknown,
  path: number[],
  out: ImageAltNode[],
): void {
  const type = getNodeType(node);
  if (!type) return;

  if (type === "image") {
    const obj = node as Record<string, unknown>;
    const attrs = obj.attrs;
    if (attrs && typeof attrs === "object") {
      const alt = (attrs as Record<string, unknown>).alt;
      if (typeof alt === "string" && alt.length > 0) {
        out.push({ id: nextAltId(), path: [...path], alt });
      }
    }
  }

  if (typeof node === "object" && node !== null) {
    const content = (node as Record<string, unknown>).content;
    if (Array.isArray(content)) {
      content.forEach((child, i) => {
        walkImageAlts(child, [...path, i], out);
      });
    }
  }
}

export function extractImageAlts(node: unknown): ImageAltNode[] {
  resetIdCounter();
  const out: ImageAltNode[] = [];
  walkImageAlts(node, [], out);
  return out;
}

function getNodeAtPath(
  node: Record<string, unknown>,
  path: number[],
): Record<string, unknown> | null {
  let current: unknown = node;

  for (const index of path) {
    if (
      typeof current !== "object" ||
      current === null ||
      !Array.isArray((current as Record<string, unknown>).content)
    ) {
      return null;
    }

    const content = (current as Record<string, unknown>).content as unknown[];
    current = content[index];
  }

  if (typeof current === "object" && current !== null) {
    return current as Record<string, unknown>;
  }

  return null;
}

export interface TranslatedSegment {
  id: string;
  text: string;
}

export interface TranslatedAlt {
  id: string;
  alt: string;
}

export interface TranslationResponse {
  segments: TranslatedSegment[];
  alts: TranslatedAlt[];
}

export interface ApplyResult {
  body: string;
  missingSegmentIds: string[];
  unknownSegmentIds: string[];
  missingAltIds: string[];
  unknownAltIds: string[];
}

function splitTextNodeByNewlines(node: Record<string, unknown>): unknown[] {
  const text = node.text as string;
  const marks = node.marks;
  const parts = text.split("\n");
  const result: unknown[] = [];

  parts.forEach((part, index) => {
    if (part.length > 0) {
      const textNode: Record<string, unknown> = { type: "text", text: part };
      if (marks) {
        textNode.marks = marks;
      }
      result.push(textNode);
    }
    if (index < parts.length - 1) {
      result.push({ type: "hardBreak" });
    }
  });

  return result;
}

function replaceNodeAtPath(
  root: Record<string, unknown>,
  path: number[],
  replacements: unknown[],
): boolean {
  if (path.length === 0) return false;

  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  const parent = getNodeAtPath(root, parentPath);

  if (
    !parent ||
    !Array.isArray(parent.content) ||
    index < 0 ||
    index >= parent.content.length
  ) {
    return false;
  }

  parent.content.splice(index, 1, ...replacements);
  return true;
}

export function applyTranslations(
  originalTiptapJson: string,
  originalSegments: TextNode[],
  originalAlts: ImageAltNode[],
  translated: TranslationResponse,
): ApplyResult {
  const originalJson = safeJsonParse(originalTiptapJson);
  const root = structuredClone(originalJson) as Record<string, unknown>;

  const segmentIds = new Set(originalSegments.map((s) => s.id));
  const altIds = new Set(originalAlts.map((a) => a.id));

  const translatedById = new Map(
    translated.segments.map((s) => [s.id, s.text]),
  );
  const translatedAltById = new Map(translated.alts.map((a) => [a.id, a.alt]));

  const missingSegmentIds = originalSegments
    .filter((s) => !translatedById.has(s.id))
    .map((s) => s.id);
  const unknownSegmentIds = translated.segments
    .filter((s) => !segmentIds.has(s.id))
    .map((s) => s.id);
  const missingAltIds = originalAlts
    .filter((a) => !translatedAltById.has(a.id))
    .map((a) => a.id);
  const unknownAltIds = translated.alts
    .filter((a) => !altIds.has(a.id))
    .map((a) => a.id);

  for (const segment of originalSegments) {
    const translatedText = translatedById.get(segment.id);
    if (translatedText === undefined) continue;
    const target = getNodeAtPath(root, segment.path);
    if (target && target.type === "text") {
      if (translatedText.includes("\n")) {
        target.text = translatedText;
        const replacements = splitTextNodeByNewlines(target);
        replaceNodeAtPath(root, segment.path, replacements);
      } else {
        target.text = translatedText;
      }
    }
  }

  for (const alt of originalAlts) {
    const translatedAlt = translatedAltById.get(alt.id);
    if (translatedAlt === undefined) continue;
    const target = getNodeAtPath(root, alt.path);
    if (target && target.type === "image" && target.attrs) {
      (target.attrs as Record<string, unknown>).alt = translatedAlt;
    }
  }

  return {
    body: JSON.stringify(root),
    missingSegmentIds,
    unknownSegmentIds,
    missingAltIds,
    unknownAltIds,
  };
}

function safeJsonParse(value: string): unknown {
  return JSON.parse(value);
}

export function isValidTiptapJson(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).type === "doc"
  );
}
