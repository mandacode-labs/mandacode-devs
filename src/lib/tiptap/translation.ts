export type TextBlockType =
  | "paragraph"
  | "heading"
  | "listItem"
  | "blockquote"
  | "codeBlock"
  | "tableCell"
  | "other";

export interface TextMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TextNode {
  path: number[];
  type: TextBlockType;
  level?: number;
  text: string;
  marks: TextMark[];
}

export interface ImageAltNode {
  path: number[];
  alt: string;
}

function mapToBlockType(t: unknown): TextBlockType {
  switch (t) {
    case "paragraph":
      return "paragraph";
    case "heading":
      return "heading";
    case "listItem":
      return "listItem";
    case "blockquote":
      return "blockquote";
    case "codeBlock":
      return "codeBlock";
    case "tableCell":
      return "tableCell";
    default:
      return "other";
  }
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

/**
 * Walk a Tiptap JSON document and return every text node with its path
 * and the immediate parent block type (paragraph / heading / listItem /
 * blockquote / codeBlock / tableCell / other). Headings also carry a
 * `level` (1-4). Each text node additionally carries the inline marks
 * (bold, italic, code, link, etc.) so the AI can preserve formatting
 * when translating.
 */
export function extractTexts(
  node: unknown,
  path: number[] = [],
  parentType: TextBlockType = "other",
  headingLevel: number | undefined = undefined,
): TextNode[] {
  if (typeof node !== "object" || node === null) return [];
  const obj = node as Record<string, unknown>;

  if (obj.type === "text" && typeof obj.text === "string") {
    return [
      {
        path: [...path],
        type: parentType,
        level: headingLevel,
        text: obj.text,
        marks: extractMarks(obj),
      },
    ];
  }

  const results: TextNode[] = [];
  const ownType = mapToBlockType(obj.type);
  const ownLevel =
    ownType === "heading" &&
    obj.attrs &&
    typeof obj.attrs === "object" &&
    typeof (obj.attrs as Record<string, unknown>).level === "number"
      ? ((obj.attrs as Record<string, unknown>).level as number)
      : headingLevel;
  if (Array.isArray(obj.content)) {
    for (let i = 0; i < obj.content.length; i++) {
      results.push(
        ...extractTexts(obj.content[i], [...path, i], ownType, ownLevel),
      );
    }
  }
  return results;
}

/**
 * Walk a Tiptap JSON document and return every image's alt text with
 * its path. Used by the translator to localize image alts (SEO +
 * accessibility).
 */
export function extractImageAlts(
  node: unknown,
  path: number[] = [],
): ImageAltNode[] {
  if (typeof node !== "object" || node === null) return [];
  const obj = node as Record<string, unknown>;

  if (obj.type === "image" && obj.attrs && typeof obj.attrs === "object") {
    const alt = (obj.attrs as Record<string, unknown>).alt;
    if (typeof alt === "string" && alt.length > 0) {
      return [{ path: [...path], alt }];
    }
  }

  const results: ImageAltNode[] = [];
  if (Array.isArray(obj.content)) {
    for (let i = 0; i < obj.content.length; i++) {
      results.push(...extractImageAlts(obj.content[i], [...path, i]));
    }
  }
  return results;
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

export function insertTexts(node: unknown, textNodes: TextNode[]): unknown {
  if (
    typeof node !== "object" ||
    node === null ||
    !Array.isArray((node as Record<string, unknown>).content)
  ) {
    return node;
  }

  const root = structuredClone(node) as Record<string, unknown>;

  for (const textNode of textNodes) {
    const target = getNodeAtPath(root, textNode.path);
    if (target && target.type === "text") {
      target.text = textNode.text;
    }
  }

  return root;
}

export function insertImageAlts(
  node: unknown,
  altNodes: ImageAltNode[],
): unknown {
  if (typeof node !== "object" || node === null) return node;
  const root = structuredClone(node) as Record<string, unknown>;

  for (const { path, alt } of altNodes) {
    const target = getNodeAtPath(root, path);
    if (target && target.type === "image" && target.attrs) {
      (target.attrs as Record<string, unknown>).alt = alt;
    }
  }

  return root;
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
