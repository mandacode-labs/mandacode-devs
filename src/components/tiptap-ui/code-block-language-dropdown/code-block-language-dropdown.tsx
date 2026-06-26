import { ChevronDown, Search, X } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
} from "react";
import { type Editor } from "@tiptap/react";

import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

import { useCodeBlockLanguageDropdown } from "@/components/tiptap-ui/code-block-language-dropdown";

import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap-ui-primitive/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/tiptap-ui-primitive/popover";

import "@/components/tiptap-ui/code-block-language-dropdown/code-block-language-dropdown.scss";

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
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const { isVisible, language, groups, setCodeBlockLanguage } =
    useCodeBlockLanguageDropdown({ editor });

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) setQuery("");
  }, []);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        options: group.options.filter(
          (opt) =>
            opt.label.toLowerCase().includes(q) ||
            opt.value.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.options.length > 0);
  }, [groups, query]);

  const hasResults = filteredGroups.some((g) => g.options.length > 0);

  const currentLabel =
    groups
      .flatMap((group) => group.options)
      .find((opt) => opt.value === language)?.label ?? "Plain text";

  if (!isVisible && hideWhenUnavailable) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="tiptap-code-language-dropdown"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          searchRef.current?.focus();
        }}
      >
        <div className="tiptap-code-language-dropdown-search">
          <Search className="tiptap-code-language-dropdown-search-icon" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search language…"
            aria-label="Search language"
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            className="tiptap-code-language-dropdown-clear"
            data-visible={query ? "true" : "false"}
            onClick={() => {
              setQuery("");
              searchRef.current?.focus();
            }}
            aria-label="Clear search"
            tabIndex={query ? 0 : -1}
          >
            <X />
          </button>
        </div>

        <div className="tiptap-code-language-dropdown-list">
          {hasResults ? (
            filteredGroups.map((group, groupIndex) => (
              <div
                className="tiptap-code-language-dropdown-group"
                key={group.label}
              >
                {groupIndex > 0 && (
                  <div className="tiptap-code-language-dropdown-separator" />
                )}
                <div className="tiptap-code-language-dropdown-label">
                  {group.label}
                </div>
                {group.options.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    className="tiptap-code-language-dropdown-item"
                    data-active={language === option.value ? "true" : undefined}
                    onClick={() => {
                      setCodeBlockLanguage(option.value);
                      setIsOpen(false);
                    }}
                  >
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            ))
          ) : (
            <div className="tiptap-code-language-dropdown-empty">
              No matches
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const CodeBlockLanguageDropdown = forwardRef(
  CodeBlockLanguageDropdownImpl,
);
CodeBlockLanguageDropdown.displayName = "CodeBlockLanguageDropdown";
