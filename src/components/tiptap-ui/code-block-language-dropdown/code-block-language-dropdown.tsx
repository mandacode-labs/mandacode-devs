import { ChevronDown, Search, X } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const { isVisible, language, groups, setCodeBlockLanguage } =
    useCodeBlockLanguageDropdown({ editor });

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) setQuery("");
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

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

      <DropdownMenuContent
        align="start"
        className="tiptap-code-language-dropdown"
      >
        <div
          className="tiptap-code-language-dropdown-search"
          onKeyDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
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
          {query && (
            <button
              type="button"
              className="tiptap-code-language-dropdown-clear"
              onClick={() => {
                setQuery("");
                searchRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <X />
            </button>
          )}
        </div>

        <div className="tiptap-code-language-dropdown-list">
          {hasResults ? (
            filteredGroups.map((group, groupIndex) => (
              <DropdownMenuGroup key={group.label}>
                {groupIndex > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                {group.options.map((option) => (
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
            ))
          ) : (
            <div className="tiptap-code-language-dropdown-empty">
              No matches
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const CodeBlockLanguageDropdown = forwardRef(
  CodeBlockLanguageDropdownImpl,
);
CodeBlockLanguageDropdown.displayName = "CodeBlockLanguageDropdown";
