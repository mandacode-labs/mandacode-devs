"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { Type } from "lucide-react";
import { Button } from "@/components/tiptap-ui-primitive/button";
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

const FONT_SIZES = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "30px",
  "36px",
];

export interface FontSizeButtonProps {
  editor?: ReturnType<typeof useTiptapEditor>["editor"];
}

export const FontSizeButton = forwardRef<
  HTMLButtonElement,
  FontSizeButtonProps
>(({ editor: providedEditor }, ref) => {
  const { editor } = useTiptapEditor(providedEditor);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeSize = editor?.isActive("textStyle", { fontSize: /.*/ })
    ? (editor.getAttributes("textStyle").fontSize as string | undefined)
    : undefined;

  const handleSetSize = useCallback(
    (size: string) => {
      if (!editor) return;
      if (activeSize === size) {
        editor.chain().focus().unsetFontSize().run();
      } else {
        editor.chain().focus().setFontSize(size).run();
      }
      setOpen(false);
    },
    [editor, activeSize],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (!editor) return null;

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={ref}
        type="button"
        variant="ghost"
        tooltip="Font size"
        onClick={() => setOpen((v) => !v)}
        data-active-state={activeSize ? "on" : "off"}
      >
        <Type className="tiptap-button-icon" />
        <span className="tiptap-button-text">{activeSize || "16px"}</span>
      </Button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-bg-primary border border-border rounded shadow-lg p-1 z-50 min-w-[80px]">
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-bg-secondary ${activeSize === size ? "bg-bg-secondary" : ""}`}
              onClick={() => handleSetSize(size)}
            >
              {size}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

FontSizeButton.displayName = "FontSizeButton";

export default FontSizeButton;
