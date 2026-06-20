export function extractAssetUrlsFromTiptapJson(tiptapJson: string): string[] {
  try {
    const json = JSON.parse(tiptapJson) as Record<string, unknown>;
    return extractAssetUrlsFromNode(json);
  } catch {
    return [];
  }
}

function extractAssetUrlsFromNode(node: Record<string, unknown>): string[] {
  const urls: string[] = [];

  if (node.type === "image" && typeof node.attrs === "object" && node.attrs) {
    const src = (node.attrs as Record<string, unknown>).src;
    if (typeof src === "string") {
      urls.push(src);
    }
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      if (child && typeof child === "object") {
        urls.push(
          ...extractAssetUrlsFromNode(child as Record<string, unknown>),
        );
      }
    }
  }

  return urls;
}
