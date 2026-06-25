import { StarterKit } from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import TiptapHorizontalRule from "@tiptap/extension-horizontal-rule";
import { createLowlight, common } from "lowlight";
import { mergeAttributes } from "@tiptap/core";

import { FontSize } from "@/lib/tiptap/font-size";
import { AlignedImage } from "@/components/tiptap-node/image-node/image-node-extension";

export const lowlight = createLowlight(common);

// Plain CodeBlockLowlight (no NodeView) for server-side rendering of
// mermaid and other code blocks. The custom MermaidCodeBlock in the
// editor adds a React NodeView for the live-preview toggle; that
// doesn't affect the stored JSON or the rendered HTML.
//
// The editor replaces this with its own MermaidCodeBlock (also a
// CodeBlockLowlight) so the schema matches. Both share `lowlight`
// above so the language attribute is preserved.
const ServerCodeBlock = CodeBlockLowlight.configure({
  lowlight,
  defaultLanguage: "plaintext",
  HTMLAttributes: { class: "language-" },
});

// Matches the editor's custom HorizontalRule output: a div with
// data-type wrapping an <hr>.
const ServerHorizontalRule = TiptapHorizontalRule.extend({
  renderHTML() {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, { "data-type": this.name }),
      ["hr"],
    ];
  },
});

export const tiptapExtensions = [
  StarterKit.configure({
    horizontalRule: false,
    codeBlock: false,
  }),
  ServerCodeBlock,
  ServerHorizontalRule,
  TextAlign.configure({ types: ["heading", "paragraph", "image"] }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Highlight.configure({ multicolor: true }),
  AlignedImage,
  Typography,
  Superscript,
  Subscript,
  FontSize,
  Color.configure({ types: ["textStyle"] }),
  Table.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
];
