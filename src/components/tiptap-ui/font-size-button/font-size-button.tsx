"use client";

import { forwardRef, useCallback, useState, type ForwardedRef } from "react";
import { Type } from "lucide-react";
import { type Editor } from "@tiptap/react";

import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap-ui-primitive/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/tiptap-ui-primitive/dropdown-menu";

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

export interface FontSizeButtonProps extends Omit<ButtonProps, "type"> {
  editor?: Editor;
}

function FontSizeButtonImpl(
  { editor: providedEditor, ...props }: FontSizeButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = useState(false);

  const activeSize = editor?.getAttributes("textStyle").fontSize as
    | string
    | undefined;

  const handleSetSize = useCallback(
    (size: string) => {
      if (!editor) return;
      if (activeSize === size) {
        editor.chain().focus().unsetFontSize().run();
      } else {
        editor.chain().focus().setFontSize(size).run();
      }
      setIsOpen(false);
    },
    [editor, activeSize],
  );

  if (!editor) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={ref}
          type="button"
          variant="ghost"
          tooltip="Font size"
          data-active-state={activeSize ? "on" : "off"}
          {...props}
        >
          <Type className="tiptap-button-icon" />
          <span className="tiptap-button-text">{activeSize || "16px"}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        {FONT_SIZES.map((size) => (
          <DropdownMenuItem key={size} asChild>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start"
              data-active-state={activeSize === size ? "on" : "off"}
              aria-pressed={activeSize === size}
              onClick={() => handleSetSize(size)}
            >
              <span className="tiptap-button-text">{size}</span>
            </Button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const FontSizeButton = forwardRef(FontSizeButtonImpl);

FontSizeButton.displayName = "FontSizeButton";

export default FontSizeButton;
