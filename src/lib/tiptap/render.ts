import { getSchema, type JSONContent } from "@tiptap/core";
import { DOMSerializer, Node } from "@tiptap/pm/model";
import { parseHTML } from "linkedom";
import { toHtml } from "hast-util-to-html";
import { createLowlight, common } from "lowlight";
import { tiptapExtensions } from "@/lib/tiptap/extensions";

const schema = getSchema(tiptapExtensions);
const lowlight = createLowlight(common);

let cachedDocument: Document | null = null;

function getDocument(): Document {
  if (cachedDocument) return cachedDocument;
  const { document } = parseHTML("<!doctype html><html><body></body></html>");
  cachedDocument = document as unknown as Document;
  return cachedDocument;
}

// Some Tiptap code-block language values differ from highlight.js
// aliases. Map the common ones so a user picking "js" still gets
// the JavaScript grammar.
const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  yml: "yaml",
  md: "markdown",
  html: "xml",
  "c++": "cpp",
  golang: "go",
  rb: "ruby",
  rs: "rust",
  kt: "kotlin",
  objc: "objectivec",
  cs: "csharp",
};

function resolveLanguage(lang: string): string | null {
  const normalized = lang.toLowerCase();
  const resolved = LANGUAGE_ALIASES[normalized] ?? normalized;
  if (resolved === "plaintext" || resolved === "mermaid") return null;
  return lowlight.listLanguages().includes(resolved) ? resolved : null;
}

// Wrap lowlight's hast tree back into a code element so the produced
// HTML matches ProseMirror's default codeBlock markup.
function highlightCode(code: string, lang: string | null): string {
  if (!lang) {
    return escapeHtml(code);
  }
  try {
    const tree = lowlight.highlight(lang, code);
    const inner = toHtml(tree);
    // `inner` is the highlighted body. Wrap in <span class="hljs"> so
    // highlight.js / GitHub-like CSS themes (which we ship below) can
    // target the root.
    return `<span class="hljs">${inner}</span>`;
  } catch {
    return escapeHtml(code);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ProseMirror's default rendering for `codeBlock` produces
// `<pre class="language-"><code class="language-XYZ">RAW</code></pre>`.
// For non-mermaid code blocks we replace the raw content with
// lowlight's highlighted HTML. For mermaid we keep the raw content;
// the client-side MermaidLoader script (src/components/MermaidLoader.astro)
// looks for `pre.mermaid` and renders the diagram.
function highlightCodeBlocks(html: string): string {
  return html.replace(
    /<pre class="language-"><code class="language-([a-zA-Z0-9_-]+)">([\s\S]*?)<\/code><\/pre>/g,
    (_match, lang: string, raw: string) => {
      if (lang.toLowerCase() === "mermaid") {
        return `<pre class="mermaid">${raw}</pre>`;
      }
      const resolved = resolveLanguage(lang);
      const code = decodeHtmlEntities(raw);
      const highlighted = highlightCode(code, resolved);
      const langClass = resolved ?? lang.toLowerCase();
      return `<pre class="language-${langClass}"><code class="language-${langClass} hljs">${highlighted}</code></pre>`;
    },
  );
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
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
  return highlightCodeBlocks(wrap.innerHTML);
}

export function renderTiptapJson(jsonString: string): string {
  try {
    const json = JSON.parse(jsonString) as JSONContent;
    return addHeadingIds(renderTiptapNode(json));
  } catch {
    return "";
  }
}

function slugify(text: string): string {
  return text
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣぁ-んァ-ヶ一-龯\-_]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function addHeadingIds(html: string): string {
  const seen = new Map<string, number>();
  return html.replace(
    /<h([1-3])(\b[^>]*)>([\s\S]*?)<\/h\1>/g,
    (_match, level: string, attrs: string, inner: string) => {
      const text = inner.replace(/<[^>]+>/g, "").trim();
      if (!text) return _match;
      const base = slugify(text) || `heading-${level}`;
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      const id = n === 0 ? base : `${base}-${n + 1}`;
      const idAttr = ` id="${id}"`;
      return `<h${level}${idAttr}${attrs}>${inner}</h${level}>`;
    },
  );
}

export interface HeadingInfo {
  id: string;
  level: number;
  text: string;
}

export function extractHeadings(html: string): HeadingInfo[] {
  const out: HeadingInfo[] = [];
  const re = /<h([1-3])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const level = Number(m[1]);
    const id = m[2]!;
    const text = m[3]!.replace(/<[^>]+>/g, "").trim();
    out.push({ id, level, text });
  }
  return out;
}
