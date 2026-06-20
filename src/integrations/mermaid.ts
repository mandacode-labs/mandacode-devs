import type { AstroIntegration } from "astro";
import { unified } from "@astrojs/markdown-remark";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import type { Element, Root as HastRoot } from "hast";

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] ?? char,
  );
}

function sanitizeJsonForScript(jsonStr: string): string {
  return jsonStr.replace(/<\//g, "<\\/").replace(/<!--/g, "<\\!--");
}

function remarkMermaid(): (tree: Root) => void {
  return (tree: Root) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang === "mermaid" && parent && typeof index === "number") {
        parent.children[index] = {
          type: "html",
          value: `<pre class="mermaid">${escapeHtml(node.value)}</pre>`,
        } as any;
      }
    });
  };
}

function rehypeMermaid(): (tree: HastRoot) => void {
  return (tree: HastRoot) => {
    visit(tree, "element", (node) => {
      if (
        node.tagName === "pre" &&
        node.children?.length === 1 &&
        (node.children[0] as Element)?.tagName === "code"
      ) {
        const codeNode = node.children[0] as Element;
        const className = codeNode.properties?.className;
        if (
          Array.isArray(className) &&
          className.includes("language-mermaid")
        ) {
          const diagramContent = (codeNode.children ?? [])
            .map((child: any) => (child.type === "text" ? child.value : ""))
            .join("");
          node.properties = { ...node.properties, className: ["mermaid"] };
          node.children = [
            { type: "text", value: escapeHtml(diagramContent) },
          ] as any;
        }
      }
    });
  };
}

export default function mermaidIntegration(
  options: {
    theme?: string;
    autoTheme?: boolean;
    mermaidConfig?: Record<string, unknown>;
    enableLog?: boolean;
  } = {},
): AstroIntegration {
  const {
    theme = "default",
    autoTheme = true,
    mermaidConfig = {},
    enableLog = false,
  } = options;

  return {
    name: "mermaid",
    hooks: {
      "astro:config:setup": ({ updateConfig, injectScript }) => {
        updateConfig({
          markdown: {
            processor: unified({
              remarkPlugins: [remarkMermaid],
              rehypePlugins: [rehypeMermaid],
            }),
          },
        });

        const mermaidScript = `
const log = ${enableLog} ? (...args) => console.log('[mermaid]', ...args) : () => {};
const logError = ${enableLog} ? (...args) => console.error('[mermaid]', ...args) : () => {};

let mermaidPromise = null;
async function loadMermaid() {
  if (mermaidPromise) return mermaidPromise;
  mermaidPromise = import('mermaid').then(({ default: m }) => m).catch(e => {
    logError('Failed to load mermaid:', e);
    mermaidPromise = null;
    throw e;
  });
  return mermaidPromise;
}

const defaultConfig = ${sanitizeJsonForScript(JSON.stringify({ startOnLoad: false, theme, ...mermaidConfig }))};

const themeMap = { light: 'default', dark: 'dark' };

async function initMermaid() {
  const diagrams = document.querySelectorAll('pre.mermaid');
  if (!diagrams.length) return;
  const mermaid = await loadMermaid();
  let currentTheme = defaultConfig.theme;
  if (${autoTheme}) {
    const htmlTheme = document.documentElement.getAttribute('data-theme');
    const bodyTheme = document.body.getAttribute('data-theme');
    currentTheme = themeMap[htmlTheme || bodyTheme] || defaultConfig.theme;
  }
  mermaid.initialize({ ...defaultConfig, theme: currentTheme });
  for (const diagram of diagrams) {
    if (diagram.hasAttribute('data-processed')) continue;
    const definition = diagram.textContent || '';
    const id = 'mermaid-' + Math.random().toString(36).slice(2, 11);
    try {
      const { svg } = await mermaid.render(id, definition);
      diagram.innerHTML = svg;
      diagram.setAttribute('data-processed', 'true');
    } catch (error) {
      logError('Mermaid render error:', error);
      const err = document.createElement('div');
      err.style.cssText = 'color:red;padding:1rem;border:1px solid red;border-radius:0.5rem;';
      const strong = document.createElement('strong');
      strong.textContent = 'Error rendering diagram:';
      const msg = document.createElement('span');
      msg.textContent = ' ' + (error.message || 'Unknown error');
      err.appendChild(strong);
      err.appendChild(msg);
      diagram.textContent = '';
      diagram.appendChild(err);
      diagram.setAttribute('data-processed', 'true');
    }
  }
}

if (document.querySelectorAll('pre.mermaid').length) initMermaid();

if (${autoTheme}) {
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'attributes' && m.attributeName === 'data-theme') {
        document.querySelectorAll('pre.mermaid[data-processed]').forEach(d => d.removeAttribute('data-processed'));
        initMermaid();
      }
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

document.addEventListener('astro:after-swap', () => {
  if (document.querySelectorAll('pre.mermaid').length) initMermaid();
});
`;

        const styleScript = `
const s = document.createElement('style');
s.textContent = \`
pre.mermaid{display:flex;justify-content:center;align-items:center;margin:2rem 0;padding:1rem;background:transparent;border:none;overflow:auto;min-height:200px;position:relative}
pre.mermaid:not([data-processed]){background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
[data-theme="dark"] pre.mermaid:not([data-processed]){background:linear-gradient(90deg,#2a2a2a 25%,#3a3a3a 50%,#2a2a2a 75%);background-size:200% 100%}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
pre.mermaid[data-processed]{animation:none;background:transparent;min-height:auto}
pre.mermaid svg{max-width:100%;height:auto}
\`;
document.head.appendChild(s);
`;

        injectScript("page", mermaidScript);
        injectScript("page", styleScript);
      },
    },
  };
}
