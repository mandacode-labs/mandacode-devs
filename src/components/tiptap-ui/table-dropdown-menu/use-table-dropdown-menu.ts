"use client";

import { useCallback, useMemo } from "react";
import type { Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Lib ---
import { isNodeInSchema } from "@/lib/tiptap-utils";

export interface UseTableDropdownMenuConfig {
  editor?: Editor | null;
}

export interface TableAction {
  label: string;
  action: (editor: Editor) => void;
  icon: string;
  disabled?: (editor: Editor) => boolean;
  dividerAfter?: boolean;
}

export function useTableDropdownMenu(config?: UseTableDropdownMenuConfig) {
  const { editor: providedEditor } = config || {};
  const { editor } = useTiptapEditor(providedEditor);

  const tableInSchema = useMemo(
    () => isNodeInSchema("table", editor),
    [editor],
  );

  const isInTable = useMemo(() => {
    if (!editor) return false;
    return editor.isActive("table");
  }, [editor]);

  const canInsertTable = useMemo(() => {
    if (!editor || !editor.isEditable) return false;
    return editor.can().insertTable();
  }, [editor]);

  const tableActions: TableAction[] = useMemo(
    () => [
      {
        label: "Insert Table",
        action: (e) =>
          e
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
        icon: "insert",
        disabled: (e) => !e.can().insertTable(),
      },
      {
        label: "Add Column Before",
        action: (e) => e.chain().focus().addColumnBefore().run(),
        icon: "column-before",
        disabled: (e) => !e.can().addColumnBefore(),
        dividerAfter: true,
      },
      {
        label: "Add Column After",
        action: (e) => e.chain().focus().addColumnAfter().run(),
        icon: "column-after",
        disabled: (e) => !e.can().addColumnAfter(),
      },
      {
        label: "Delete Column",
        action: (e) => e.chain().focus().deleteColumn().run(),
        icon: "column-delete",
        disabled: (e) => !e.can().deleteColumn(),
        dividerAfter: true,
      },
      {
        label: "Add Row Above",
        action: (e) => e.chain().focus().addRowBefore().run(),
        icon: "row-before",
        disabled: (e) => !e.can().addRowBefore(),
      },
      {
        label: "Add Row Below",
        action: (e) => e.chain().focus().addRowAfter().run(),
        icon: "row-after",
        disabled: (e) => !e.can().addRowAfter(),
      },
      {
        label: "Delete Row",
        action: (e) => e.chain().focus().deleteRow().run(),
        icon: "row-delete",
        dividerAfter: true,
      },
      {
        label: "Merge Cells",
        action: (e) => e.chain().focus().mergeCells().run(),
        icon: "merge",
        disabled: (e) => !e.can().mergeCells(),
      },
      {
        label: "Split Cell",
        action: (e) => e.chain().focus().splitCell().run(),
        icon: "split",
        disabled: (e) => !e.can().splitCell(),
      },
      {
        label: "Toggle Header Row",
        action: (e) => e.chain().focus().toggleHeaderRow().run(),
        icon: "header-row",
        disabled: (e) => !e.can().toggleHeaderRow(),
      },
      {
        label: "Delete Table",
        action: (e) => e.chain().focus().deleteTable().run(),
        icon: "delete",
        disabled: (e) => !e.can().deleteTable(),
      },
    ],
    [],
  );

  const handleAction = useCallback(
    (action: TableAction) => {
      if (!editor || action.disabled?.(editor)) return;
      action.action(editor);
    },
    [editor],
  );

  return {
    editor,
    tableInSchema,
    isInTable,
    canInsertTable,
    tableActions,
    handleAction,
  };
}
