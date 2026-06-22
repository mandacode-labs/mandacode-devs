import { getSchema, type JSONContent } from "@tiptap/core";
import { DOMSerializer, Node } from "@tiptap/pm/model";
import { parseHTML } from "linkedom";
import { tiptapExtensions } from "@/lib/tiptap/extensions";

const schema = getSchema(tiptapExtensions);

let cachedDocument: Document | null = null;

function getDocument(): Document {
  if (cachedDocument) return cachedDocument;
  const { document } = parseHTML("<!doctype html><html><body></body></html>");
  cachedDocument = document as unknown as Document;
  return cachedDocument;
}

// ProseMirror's default rendering for `codeBlock` with a language
// attribute produces `<pre class="language-"><code class="language-XYZ">`.
// The mermaid client-side script (src/integrations/mermaid.ts) looks
// for `pre.mermaid` directly, so we rewrite the markup for that case
// into `<pre class="mermaid">RAW_CONTENT</pre>`.
function normalizeMermaidBlocks(html: string): string {
  return html.replace(
    /<pre class="language-"><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_match, content) => `<pre class="mermaid">${content}</pre>`,
  );
}

export function renderTiptapNode(node: JSONContent): string {
  const contentNode = Node.fromJSON(schema, node);
  const document = getDocument();
  const fragment = contentNode.content;
  const wrap = document.createElement("div");
  DOMSerializer.fromSchema(schema).serializeFragment(
    fragment,
    { document },
    wrap,
  );
  return normalizeMermaidBlocks(wrap.innerHTML);
}

export function renderTiptapJson(jsonString: string): string {
  try {
    const json = JSON.parse(jsonString) as JSONContent;
    return renderTiptapNode(json);
  } catch {
    return "";
  }
}
