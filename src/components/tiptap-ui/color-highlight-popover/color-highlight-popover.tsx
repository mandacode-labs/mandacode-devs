import { Ban, Baseline, Highlighter } from "lucide-react";
import { forwardRef, useMemo, useRef, useState } from "react";
import { type Editor } from "@tiptap/react";

// --- Hooks ---
import { useMenuNavigation } from "@/hooks/use-menu-navigation";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap-ui-primitive/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/tiptap-ui-primitive/popover";
import { Separator } from "@/components/tiptap-ui-primitive/separator";
import {
  Card,
  CardBody,
  CardItemGroup,
} from "@/components/tiptap-ui-primitive/card";

// --- Tiptap UI ---
import type {
  ColorOption,
  UseTextColorConfig,
} from "@/components/tiptap-ui/text-color-button";
import {
  TextColorButton,
  pickTextColorsByValue,
  useTextColor,
} from "@/components/tiptap-ui/text-color-button";
import type { HighlightColor } from "@/components/tiptap-ui/color-highlight-button";
import {
  ColorHighlightButton,
  pickHighlightColorsByValue,
  useColorHighlight,
} from "@/components/tiptap-ui/color-highlight-button";
import { ButtonGroup } from "@/components/tiptap-ui-primitive/button-group";

type ColorMode = "text" | "highlight";

export interface ColorHighlightPopoverContentProps {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null;
  /**
   * Optional text colors to use in the popover.
   */
  textColors?: ColorOption[];
  /**
   * Optional highlight colors to use in the popover.
   */
  highlightColors?: HighlightColor[];
  /**
   * When true, uses the actual color value instead of CSS variable.
   * @default false
   */
  useColorValue?: boolean;
  /**
   * Initial active tab.
   * @default "text"
   */
  defaultMode?: ColorMode;
}

export interface ColorHighlightPopoverProps
  extends
    Omit<ButtonProps, "type">,
    Pick<UseTextColorConfig, "editor" | "hideWhenUnavailable" | "onApplied"> {
  /**
   * Optional text colors to use in the popover.
   */
  textColors?: ColorOption[];
  /**
   * Optional highlight colors to use in the popover.
   */
  highlightColors?: HighlightColor[];
  /**
   * When true, uses the actual color value instead of CSS variable.
   * @default false
   */
  useColorValue?: boolean;
}

export const ColorHighlightPopoverButton = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, children, ...props }, ref) => (
  <Button
    type="button"
    className={className}
    variant="ghost"
    data-appearance="default"
    role="button"
    tabIndex={-1}
    aria-label="Text color and highlight"
    tooltip="Text color"
    ref={ref}
    {...props}
  >
    {children ?? <Baseline className="tiptap-button-icon" />}
  </Button>
));

ColorHighlightPopoverButton.displayName = "ColorHighlightPopoverButton";

export function ColorHighlightPopoverContent({
  editor,
  textColors = pickTextColorsByValue([
    "var(--tt-color-text-gray)",
    "var(--tt-color-text-brown)",
    "var(--tt-color-text-orange)",
    "var(--tt-color-text-yellow)",
    "var(--tt-color-text-green)",
    "var(--tt-color-text-blue)",
    "var(--tt-color-text-purple)",
    "var(--tt-color-text-pink)",
    "var(--tt-color-text-red)",
  ]),
  highlightColors = pickHighlightColorsByValue([
    "var(--tt-color-highlight-gray)",
    "var(--tt-color-highlight-brown)",
    "var(--tt-color-highlight-orange)",
    "var(--tt-color-highlight-yellow)",
    "var(--tt-color-highlight-green)",
    "var(--tt-color-highlight-blue)",
    "var(--tt-color-highlight-purple)",
    "var(--tt-color-highlight-pink)",
    "var(--tt-color-highlight-red)",
  ]),
  useColorValue = false,
  defaultMode = "text",
}: ColorHighlightPopoverContentProps) {
  const [mode, setMode] = useState<ColorMode>(defaultMode);
  const isMobile = useIsBreakpoint();
  const containerRef = useRef<HTMLDivElement>(null);

  const { handleRemoveTextColor, handleSetTextColor } = useTextColor({
    editor,
  });
  const { handleRemoveHighlight } = useColorHighlight({ editor });

  const items = useMemo(
    () =>
      mode === "text"
        ? [...textColors, { label: "Remove text color", value: "none" }]
        : [...highlightColors, { label: "Remove highlight", value: "none" }],
    [mode, textColors, highlightColors],
  );

  const handleSelect = (value: string) => {
    if (mode === "text") {
      if (value === "none") {
        handleRemoveTextColor();
      } else {
        handleSetTextColor(useColorValue ? value : value);
      }
    } else if (value === "none") {
      handleRemoveHighlight();
    }
  };

  const { selectedIndex } = useMenuNavigation({
    containerRef,
    items,
    orientation: "both",
    onSelect: (item) => {
      if (!containerRef.current) return false;
      const highlightedElement = containerRef.current.querySelector(
        '[data-highlighted="true"]',
      ) as HTMLElement;
      if (highlightedElement) highlightedElement.click();
      handleSelect(item.value);
      return true;
    },
    autoSelectFirstItem: false,
  });

  return (
    <Card
      ref={containerRef}
      tabIndex={0}
      style={isMobile ? { boxShadow: "none", border: 0 } : {}}
    >
      <CardBody style={isMobile ? { padding: 0 } : {}}>
        <CardItemGroup orientation="horizontal">
          <ButtonGroup>
            <Button
              type="button"
              variant={mode === "text" ? "primary" : "ghost"}
              onClick={() => setMode("text")}
              aria-label="Text color"
              tooltip="Text color"
            >
              <Baseline className="tiptap-button-icon" />
            </Button>
            <Button
              type="button"
              variant={mode === "highlight" ? "primary" : "ghost"}
              onClick={() => setMode("highlight")}
              aria-label="Highlight"
              tooltip="Highlight"
            >
              <Highlighter className="tiptap-button-icon" />
            </Button>
          </ButtonGroup>
        </CardItemGroup>

        <Separator />

        <CardItemGroup orientation="horizontal">
          <ButtonGroup>
            {mode === "text"
              ? textColors.map((color, index) => (
                  <ButtonGroup key={color.value}>
                    <TextColorButton
                      editor={editor}
                      color={useColorValue ? color.colorValue : color.value}
                      tooltip={color.label}
                      aria-label={`${color.label} text color`}
                      tabIndex={index === selectedIndex ? 0 : -1}
                      data-highlighted={selectedIndex === index}
                      useColorValue={useColorValue}
                    />
                  </ButtonGroup>
                ))
              : highlightColors.map((color, index) => (
                  <ButtonGroup key={color.value}>
                    <ColorHighlightButton
                      editor={editor}
                      highlightColor={
                        useColorValue ? color.colorValue : color.value
                      }
                      tooltip={color.label}
                      aria-label={`${color.label} highlight color`}
                      tabIndex={index === selectedIndex ? 0 : -1}
                      data-highlighted={selectedIndex === index}
                      useColorValue={useColorValue}
                    />
                  </ButtonGroup>
                ))}
          </ButtonGroup>
          <Separator />
          <ButtonGroup>
            <Button
              onClick={() => handleSelect("none")}
              aria-label={
                mode === "text" ? "Remove text color" : "Remove highlight"
              }
              tooltip={
                mode === "text" ? "Remove text color" : "Remove highlight"
              }
              tabIndex={selectedIndex === items.length - 1 ? 0 : -1}
              type="button"
              role="menuitem"
              variant="ghost"
              data-highlighted={selectedIndex === items.length - 1}
            >
              <Ban className="tiptap-button-icon" />
            </Button>
          </ButtonGroup>
        </CardItemGroup>
      </CardBody>
    </Card>
  );
}

export function ColorHighlightPopover({
  editor: providedEditor,
  textColors = pickTextColorsByValue([
    "var(--tt-color-text-gray)",
    "var(--tt-color-text-brown)",
    "var(--tt-color-text-orange)",
    "var(--tt-color-text-yellow)",
    "var(--tt-color-text-green)",
    "var(--tt-color-text-blue)",
    "var(--tt-color-text-purple)",
    "var(--tt-color-text-pink)",
    "var(--tt-color-text-red)",
  ]),
  highlightColors = pickHighlightColorsByValue([
    "var(--tt-color-highlight-gray)",
    "var(--tt-color-highlight-brown)",
    "var(--tt-color-highlight-orange)",
    "var(--tt-color-highlight-yellow)",
    "var(--tt-color-highlight-green)",
    "var(--tt-color-highlight-blue)",
    "var(--tt-color-highlight-purple)",
    "var(--tt-color-highlight-pink)",
    "var(--tt-color-highlight-red)",
  ]),
  hideWhenUnavailable = false,
  useColorValue = false,
  onApplied,
  ...props
}: ColorHighlightPopoverProps) {
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = useState(false);
  const { isVisible, canTextColor, isActive, label, Icon } = useTextColor({
    editor,
    hideWhenUnavailable,
    onApplied,
  });

  if (!isVisible) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <ColorHighlightPopoverButton
          disabled={!canTextColor}
          data-active-state={isActive ? "on" : "off"}
          data-disabled={!canTextColor}
          aria-pressed={isActive}
          aria-label={label}
          tooltip={label}
          {...props}
        >
          <Icon className="tiptap-button-icon" />
        </ColorHighlightPopoverButton>
      </PopoverTrigger>
      <PopoverContent
        aria-label="Text colors and highlights"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          editor?.chain().focus().run();
        }}
      >
        <ColorHighlightPopoverContent
          editor={editor}
          textColors={textColors}
          highlightColors={highlightColors}
          useColorValue={useColorValue}
        />
      </PopoverContent>
    </Popover>
  );
}

export default ColorHighlightPopover;
