import { useCallback, useEffect, useState } from "react";
import { type Editor } from "@tiptap/react";

import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

export const CODE_BLOCK_LANGUAGE_OPTIONS = [
  { value: "plaintext", label: "Plain text" },
  { value: "mermaid", label: "Mermaid" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "json", label: "JSON" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "python", label: "Python" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
];

export interface UseCodeBlockLanguageDropdownConfig {
  editor?: Editor | null;
}

export function useCodeBlockLanguageDropdown({
  editor: providedEditor,
}: UseCodeBlockLanguageDropdownConfig = {}) {
  const { editor } = useTiptapEditor(providedEditor);
  const [language, setLanguage] = useState("plaintext");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const isCodeBlock = editor.isActive("codeBlock");
      setIsVisible(isCodeBlock);
      if (isCodeBlock) {
        const attrs = editor.getAttributes("codeBlock");
        setLanguage((attrs.language as string) || "plaintext");
      }
    };

    update();
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  const setCodeBlockLanguage = useCallback(
    (value: string) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .updateAttributes("codeBlock", { language: value })
        .run();
      setLanguage(value);
    },
    [editor],
  );

  return {
    editor,
    isVisible,
    language,
    options: CODE_BLOCK_LANGUAGE_OPTIONS,
    setCodeBlockLanguage,
  };
}
