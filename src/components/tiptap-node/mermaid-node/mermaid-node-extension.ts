import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { createLowlight, common } from "lowlight";
import { MermaidNode as MermaidNodeComponent } from "@/components/tiptap-node/mermaid-node/mermaid-node";

const lowlight = createLowlight(common);

export const MermaidCodeBlock = CodeBlockLowlight.extend({
  name: "codeBlock",

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeComponent);
  },
}).configure({
  lowlight,
  defaultLanguage: "plaintext",
  HTMLAttributes: {
    class: "language-",
  },
});

export default MermaidCodeBlock;
