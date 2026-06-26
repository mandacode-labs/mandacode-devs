import { useCallback, useEffect, useState } from "react";
import { type Editor } from "@tiptap/react";

import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

export interface CodeBlockLanguageOption {
  value: string;
  label: string;
}

export interface CodeBlockLanguageGroup {
  label: string;
  options: CodeBlockLanguageOption[];
}

export const CODE_BLOCK_LANGUAGE_GROUPS: CodeBlockLanguageGroup[] = [
  {
    label: "Common",
    options: [
      { value: "plaintext", label: "Plain text" },
      { value: "mermaid", label: "Mermaid" },
      { value: "markdown", label: "Markdown" },
    ],
  },
  {
    label: "Web",
    options: [
      { value: "typescript", label: "TypeScript" },
      { value: "javascript", label: "JavaScript" },
      { value: "html", label: "HTML" },
      { value: "css", label: "CSS" },
      { value: "scss", label: "SCSS" },
      { value: "less", label: "Less" },
      { value: "json", label: "JSON" },
      { value: "graphql", label: "GraphQL" },
      { value: "xml", label: "XML" },
    ],
  },
  {
    label: "Systems",
    options: [
      { value: "go", label: "Go" },
      { value: "rust", label: "Rust" },
      { value: "c", label: "C" },
      { value: "cpp", label: "C++" },
      { value: "csharp", label: "C#" },
      { value: "java", label: "Java" },
      { value: "kotlin", label: "Kotlin" },
      { value: "swift", label: "Swift" },
      { value: "objectivec", label: "Objective-C" },
      { value: "arduino", label: "Arduino" },
    ],
  },
  {
    label: "Scripting",
    options: [
      { value: "python", label: "Python" },
      { value: "ruby", label: "Ruby" },
      { value: "php", label: "PHP" },
      { value: "perl", label: "Perl" },
      { value: "lua", label: "Lua" },
      { value: "bash", label: "Bash" },
      { value: "shell", label: "Shell" },
    ],
  },
  {
    label: "Data & Config",
    options: [
      { value: "sql", label: "SQL" },
      { value: "yaml", label: "YAML" },
      { value: "ini", label: "INI" },
      { value: "diff", label: "Diff" },
      { value: "makefile", label: "Makefile" },
      { value: "r", label: "R" },
    ],
  },
];

export const CODE_BLOCK_LANGUAGE_OPTIONS: CodeBlockLanguageOption[] =
  CODE_BLOCK_LANGUAGE_GROUPS.flatMap((group) => group.options);

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
    groups: CODE_BLOCK_LANGUAGE_GROUPS,
    setCodeBlockLanguage,
  };
}
