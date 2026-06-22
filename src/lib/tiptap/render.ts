import type { JSONContent } from "@tiptap/core";
import { sanitizeUrl } from "@/lib/tiptap-utils";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeHref(href: string): string {
  return sanitizeUrl(href, "");
}

function safeSrc(src: string): string {
  return sanitizeUrl(src, "");
}

function renderStyle(attrs?: Record<string, unknown>): string {
  const styles: string[] = [];

  if (attrs?.textAlign) {
    styles.push(`text-align: ${attrs.textAlign}`);
  }

  return styles.length > 0 ? ` style="${styles.join("; ")}"` : "";
}

function renderMarks(node: JSONContent): string {
  let text = escapeHtml(node.text ?? "");
  const marks = node.marks ?? [];

  const linkMark = marks.find((m) => m.type === "link");
  if (linkMark) {
    const linkIndex = marks.indexOf(linkMark);
    const before = marks.slice(0, linkIndex);
    const after = marks.slice(linkIndex + 1);
    const href = safeHref(String(linkMark.attrs?.href ?? "#"));
    return renderMarkStack(
      { ...node, text, marks: before },
      `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${renderMarkStack({ ...node, text, marks: after })}</a>`,
    );
  }

  return renderMarkStack({ ...node, text, marks });
}

function renderMarkStack(node: JSONContent, inner?: string): string {
  let result = inner ?? escapeHtml(node.text ?? "");
  const marks = node.marks ?? [];

  for (const mark of [...marks].reverse()) {
    switch (mark.type) {
      case "bold":
        result = `<strong>${result}</strong>`;
        break;
      case "italic":
        result = `<em>${result}</em>`;
        break;
      case "strike":
        result = `<s>${result}</s>`;
        break;
      case "code":
        result = `<code>${result}</code>`;
        break;
      case "textStyle": {
        const color = mark.attrs?.color as string | undefined;
        if (color) {
          result = `<span style="color: ${escapeHtml(color)}">${result}</span>`;
        }
        break;
      }
      case "highlight": {
        const color = (mark.attrs?.color as string) || "#fef08a";
        result = `<mark style="background-color: ${escapeHtml(color)}">${result}</mark>`;
        break;
      }
      case "subscript":
        result = `<sub>${result}</sub>`;
        break;
      case "superscript":
        result = `<sup>${result}</sup>`;
        break;
      case "underline":
        result = `<u>${result}</u>`;
        break;
    }
  }

  return result;
}

export function renderTiptapNode(node: JSONContent): string {
  if (!node) {
    return "";
  }

  if (node.type === "text") {
    return renderMarks(node);
  }

  const children = (node.content ?? [])
    .map((child) => renderTiptapNode(child as JSONContent))
    .join("");

  const style = renderStyle(node.attrs as Record<string, unknown> | undefined);

  switch (node.type) {
    case "doc":
      return children;
    case "paragraph":
      return `<p${style}>${children}</p>`;
    case "heading": {
      const level = Number(node.attrs?.level);
      const safeLevel = level >= 1 && level <= 6 ? level : 2;
      return `<h${safeLevel}${style}>${children}</h${safeLevel}>`;
    }
    case "bulletList":
      return `<ul>${children}</ul>`;
    case "orderedList":
      return `<ol>${children}</ol>`;
    case "listItem":
      return `<li>${children}</li>`;
    case "blockquote":
      return `<blockquote>${children}</blockquote>`;
    case "codeBlock": {
      const language = node.attrs?.language as string | undefined;
      const code = children;
      if (language === "mermaid") {
        return `<pre class="mermaid">${code}</pre>`;
      }
      const langAttr =
        language && language !== "plaintext"
          ? ` class="language-${language}"`
          : "";
      return `<pre><code${langAttr}>${code}</code></pre>`;
    }
    case "image": {
      const src = safeSrc(String(node.attrs?.src ?? ""));
      return src
        ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(node.attrs?.alt ?? "")}" />`
        : "";
    }
    case "table":
      return `<table>${children}</table>`;
    case "tableRow":
      return `<tr>${children}</tr>`;
    case "tableCell": {
      const colspan = node.attrs?.colspan as number | undefined;
      const rowspan = node.attrs?.rowspan as number | undefined;
      const colspanAttr = colspan && colspan > 1 ? ` colspan="${colspan}"` : "";
      const rowspanAttr = rowspan && rowspan > 1 ? ` rowspan="${rowspan}"` : "";
      return `<td${colspanAttr}${rowspanAttr}>${children}</td>`;
    }
    case "tableHeader": {
      const colspan = node.attrs?.colspan as number | undefined;
      const rowspan = node.attrs?.rowspan as number | undefined;
      const colspanAttr = colspan && colspan > 1 ? ` colspan="${colspan}"` : "";
      const rowspanAttr = rowspan && rowspan > 1 ? ` rowspan="${rowspan}"` : "";
      return `<th${colspanAttr}${rowspanAttr}>${children}</th>`;
    }
    case "hardBreak":
      return "<br />";
    case "horizontalRule":
      return "<hr />";
    default:
      return children;
  }
}

export function renderTiptapJson(jsonString: string): string {
  try {
    const json = JSON.parse(jsonString) as JSONContent;
    return renderTiptapNode(json);
  } catch {
    return "";
  }
}
