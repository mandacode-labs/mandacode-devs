"use client";

import { Baseline } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { type Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Lib ---
import { isMarkInSchema, isNodeTypeSelected } from "@/lib/tiptap-utils";

export const TEXT_COLORS = [
  {
    label: "Default text",
    value: "var(--tt-color-text-default)",
    colorValue: "#000000",
  },
  {
    label: "Gray text",
    value: "var(--tt-color-text-gray)",
    colorValue: "#787774",
  },
  {
    label: "Brown text",
    value: "var(--tt-color-text-brown)",
    colorValue: "#976443",
  },
  {
    label: "Orange text",
    value: "var(--tt-color-text-orange)",
    colorValue: "#d97808",
  },
  {
    label: "Yellow text",
    value: "var(--tt-color-text-yellow)",
    colorValue: "#c2920a",
  },
  {
    label: "Green text",
    value: "var(--tt-color-text-green)",
    colorValue: "#427a4e",
  },
  {
    label: "Blue text",
    value: "var(--tt-color-text-blue)",
    colorValue: "#337ea9",
  },
  {
    label: "Purple text",
    value: "var(--tt-color-text-purple)",
    colorValue: "#906aa7",
  },
  {
    label: "Pink text",
    value: "var(--tt-color-text-pink)",
    colorValue: "#c95585",
  },
  {
    label: "Red text",
    value: "var(--tt-color-text-red)",
    colorValue: "#e03e3e",
  },
];
export type ColorOption = (typeof TEXT_COLORS)[number];

export interface UseTextColorConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null;
  /**
   * The color to apply when toggling the text color.
   */
  color?: string;
  /**
   * Optional label to display alongside the icon.
   */
  label?: string;
  /**
   * Whether the button should hide when the mark is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean;
  /**
   * When true, uses the actual color value (colorValue) instead of CSS variable (value).
   * @default false
   */
  useColorValue?: boolean;
  /**
   * Called when the text color is applied.
   */
  onApplied?: ({ color, label }: { color: string; label: string }) => void;
}

export function pickTextColorsByValue(values: string[]) {
  const colorMap = new Map(TEXT_COLORS.map((color) => [color.value, color]));
  return values
    .map((value) => colorMap.get(value))
    .filter((color): color is (typeof TEXT_COLORS)[number] => !!color);
}

export function getTextColorValue(
  color: string,
  useColorValue: boolean = false,
): string {
  if (!useColorValue) return color;

  const colorItem = TEXT_COLORS.find(
    (c) => c.value === color || c.colorValue === color,
  );
  return colorItem?.colorValue || color;
}

export function canTextColor(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false;
  if (!isMarkInSchema("textStyle", editor)) return false;

  return editor.can().setMark("textStyle");
}

export function isTextColorActive(
  editor: Editor | null,
  color?: string,
): boolean {
  if (!editor || !editor.isEditable) return false;

  return color
    ? editor.isActive("textStyle", { color })
    : editor.isActive("textStyle");
}

export function removeTextColor(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false;
  if (!canTextColor(editor)) return false;

  return editor.chain().focus().unsetColor().run();
}

export function shouldShowTextColorButton(props: {
  editor: Editor | null;
  hideWhenUnavailable: boolean;
}): boolean {
  const { editor, hideWhenUnavailable } = props;

  if (!editor) return false;
  if (!hideWhenUnavailable) return true;
  if (!editor.isEditable) return false;
  if (!isMarkInSchema("textStyle", editor)) return false;

  return !editor.isActive("code") ? canTextColor(editor) : true;
}

export function useTextColor(config: UseTextColorConfig) {
  const {
    editor: providedEditor,
    label,
    color,
    hideWhenUnavailable = false,
    useColorValue = false,
    onApplied,
  } = config;

  const { editor } = useTiptapEditor(providedEditor);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const canTextColorState = canTextColor(editor);
  const actualColor = color ? getTextColorValue(color, useColorValue) : color;
  const isActive = isTextColorActive(editor, actualColor);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowTextColorButton({ editor, hideWhenUnavailable }));
    };

    handleSelectionUpdate();

    editor.on("selectionUpdate", handleSelectionUpdate);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor, hideWhenUnavailable]);

  const handleSetTextColor = useCallback(
    (overrideColor?: string) => {
      const targetColor = overrideColor ?? actualColor;
      if (!editor || !canTextColorState || !targetColor || !label) return false;

      const success = editor.chain().focus().setColor(targetColor).run();

      if (success) {
        onApplied?.({ color: targetColor, label });
      }
      return success;
    },
    [canTextColorState, actualColor, editor, label, onApplied],
  );

  const handleRemoveTextColor = useCallback(() => {
    const success = removeTextColor(editor);
    if (success) {
      onApplied?.({ color: "", label: "Remove text color" });
    }
    return success;
  }, [editor, onApplied]);

  return {
    isVisible,
    isActive,
    handleSetTextColor,
    handleRemoveTextColor,
    canTextColor: canTextColorState,
    label: label || "Text color",
    Icon: Baseline,
  };
}
