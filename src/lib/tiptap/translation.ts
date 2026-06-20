export interface TextNode {
  path: number[];
  text: string;
}

export function extractTexts(node: unknown, path: number[] = []): TextNode[] {
  if (typeof node !== "object" || node === null) {
    return [];
  }

  const obj = node as Record<string, unknown>;

  if (obj.type === "text" && typeof obj.text === "string") {
    return [{ path: [...path], text: obj.text }];
  }

  const results: TextNode[] = [];

  if (Array.isArray(obj.content)) {
    for (let i = 0; i < obj.content.length; i++) {
      results.push(...extractTexts(obj.content[i], [...path, i]));
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

  if (
    typeof current === "object" &&
    current !== null &&
    (current as Record<string, unknown>).type === "text"
  ) {
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
    if (target) {
      target.text = textNode.text;
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
