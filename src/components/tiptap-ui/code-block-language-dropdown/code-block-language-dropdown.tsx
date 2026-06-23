import { ChevronDown } from "lucide-react";
import { forwardRef, useCallback, useState, type ForwardedRef } from "react";
import { type Editor } from "@tiptap/react";

import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

import {
  useCodeBlockLanguageDropdown,
  CODE_BLOCK_LANGUAGE_OPTIONS,
} from "@/components/tiptap-ui/code-block-language-dropdown";

import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap-ui-primitive/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/tiptap-ui-primitive/dropdown-menu";

export interface CodeBlockLanguageDropdownProps extends Omit<
  ButtonProps,
  "type"
> {
  editor?: Editor;
  hideWhenUnavailable?: boolean;
}

function CodeBlockLanguageDropdownImpl(
  {
    editor: providedEditor,
    hideWhenUnavailable = true,
    ...props
  }: CodeBlockLanguageDropdownProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = useState(false);
  const { isVisible, language, options, setCodeBlockLanguage } =
    useCodeBlockLanguageDropdown({ editor });

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const currentLabel =
    options.find((opt) => opt.value === language)?.label ?? "Plain text";

  if (!isVisible && hideWhenUnavailable) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          role="button"
          tabIndex={-1}
          disabled={!isVisible}
          data-disabled={!isVisible}
          aria-label="Code block language"
          tooltip="Code language"
          data-active-state={isVisible ? "on" : "off"}
          {...props}
          ref={ref}
        >
          <span className="text-xs">{currentLabel}</span>
          <ChevronDown className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        <DropdownMenuGroup>
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => {
                setCodeBlockLanguage(option.value);
                setIsOpen(false);
              }}
              data-active={language === option.value ? "true" : undefined}
            >
              <span className="text-sm">{option.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const CodeBlockLanguageDropdown = forwardRef(
  CodeBlockLanguageDropdownImpl,
);
CodeBlockLanguageDropdown.displayName = "CodeBlockLanguageDropdown";
