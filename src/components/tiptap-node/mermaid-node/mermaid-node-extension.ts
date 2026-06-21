import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MermaidNode as MermaidNodeComponent } from "@/components/tiptap-node/mermaid-node/mermaid-node";

export const MermaidCodeBlock = CodeBlockLowlight.extend({
  name: "codeBlock",

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeComponent);
  },
});

export default MermaidCodeBlock;
