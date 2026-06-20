import { forwardRef, useCallback, useMemo } from "react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Tiptap UI ---
import type { UseTextColorConfig } from "@/components/tiptap-ui/text-color-button";
import { useTextColor } from "@/components/tiptap-ui/text-color-button";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap-ui-primitive/button";

// --- Styles ---
import "@/components/tiptap-ui/text-color-button/text-color-button.scss";

export interface TextColorButtonProps
  extends Omit<ButtonProps, "type">, UseTextColorConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string;
}

export const TextColorButton = forwardRef<
  HTMLButtonElement,
  TextColorButtonProps
>(
  (
    {
      editor: providedEditor,
      color,
      text,
      hideWhenUnavailable = false,
      onApplied,
      onClick,
      children,
      style,
      useColorValue = false,
      ...buttonProps
    },
    ref,
  ) => {
    const { editor } = useTiptapEditor(providedEditor);
    const { isVisible, canTextColor, isActive, handleSetTextColor, label } =
      useTextColor({
        editor,
        color,
        useColorValue,
        label: text || `Toggle text color (${color})`,
        hideWhenUnavailable,
        onApplied,
      });

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        handleSetTextColor();
      },
      [handleSetTextColor, onClick],
    );

    const buttonStyle = useMemo(
      () =>
        ({
          ...style,
          "--text-color": color,
        }) as React.CSSProperties,
      [color, style],
    );

    if (!isVisible) {
      return null;
    }

    return (
      <Button
        type="button"
        variant="ghost"
        data-active-state={isActive ? "on" : "off"}
        role="button"
        tabIndex={-1}
        disabled={!canTextColor}
        data-disabled={!canTextColor}
        aria-label={label}
        aria-pressed={isActive}
        tooltip={label}
        onClick={handleClick}
        style={buttonStyle}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <span
            className="tiptap-button-text-color"
            style={
              {
                "--text-color": color,
              } as React.CSSProperties
            }
          />
        )}
      </Button>
    );
  },
);

TextColorButton.displayName = "TextColorButton";
