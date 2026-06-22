import type { AstroIntegration } from "astro";
import { unified } from "@astrojs/markdown-remark";
import { visit } from "unist-util-visit";
import type { Root, Html as MdastHtml } from "mdast";
import type { Root as HastRoot, ElementContent } from "hast";

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] ?? char,
  );
}

function remarkMermaid(): (tree: Root) => void {
  return (tree: Root) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang === "mermaid" && parent && typeof index === "number") {
        const replacement: MdastHtml = {
          type: "html",
          value: `<pre class="mermaid">${escapeHtml(node.value)}</pre>`,
        };
        parent.children[index] = replacement;
      }
    });
  };
}

function rehypeMermaid(): (tree: HastRoot) => void {
  return (tree: HastRoot) => {
    visit(tree, "element", (node) => {
      const firstChild = node.children?.[0];
      if (
        node.tagName === "pre" &&
        node.children?.length === 1 &&
        firstChild?.type === "element" &&
        firstChild.tagName === "code"
      ) {
        const codeNode = firstChild;
        const className = codeNode.properties?.className;
        if (
          Array.isArray(className) &&
          className.includes("language-mermaid")
        ) {
          const diagramContent = (codeNode.children ?? [])
            .map((child: ElementContent) =>
              child.type === "text" ? child.value : "",
            )
            .join("");
          node.properties = { ...node.properties, className: ["mermaid"] };
          node.children = [{ type: "text", value: escapeHtml(diagramContent) }];
        }
      }
    });
  };
}

export default function mermaidIntegration(): AstroIntegration {
  return {
    name: "mermaid",
    hooks: {
      "astro:config:setup": ({ updateConfig }) => {
        updateConfig({
          markdown: {
            processor: unified({
              remarkPlugins: [remarkMermaid],
              rehypePlugins: [rehypeMermaid],
            }),
          },
        });
      },
    },
  };
}
