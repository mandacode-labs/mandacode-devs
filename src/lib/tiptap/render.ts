import type { JSONContent } from "@tiptap/core";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarks(node: JSONContent): string {
  let text = escapeHtml(node.text ?? "");

  if (node.marks) {
    for (const mark of node.marks) {
      switch (mark.type) {
        case "bold":
          text = `<strong>${text}</strong>`;
          break;
        case "italic":
          text = `<em>${text}</em>`;
          break;
        case "link":
          text = `<a href="${escapeHtml(mark.attrs?.href ?? "#")}" target="_blank" rel="noopener noreferrer">${text}</a>`;
          break;
        case "code":
          text = `<code>${text}</code>`;
          break;
      }
    }
  }

  return text;
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

  switch (node.type) {
    case "doc":
      return children;
    case "paragraph":
      return `<p>${children}</p>`;
    case "heading":
      return `<h${node.attrs?.level}>${children}</h${node.attrs?.level}>`;
    case "bulletList":
      return `<ul>${children}</ul>`;
    case "orderedList":
      return `<ol>${children}</ol>`;
    case "listItem":
      return `<li>${children}</li>`;
    case "blockquote":
      return `<blockquote>${children}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${children}</code></pre>`;
    case "image":
      return `<img src="${escapeHtml(node.attrs?.src ?? "")}" alt="${escapeHtml(node.attrs?.alt ?? "")}" />`;
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
