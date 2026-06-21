import { forwardRef, useCallback, useState, type ForwardedRef } from "react";
import { type Editor } from "@tiptap/react";

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon";
import { TableIcon } from "@/components/tiptap-icons/table-icon";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Lib ---
import { useTableDropdownMenu } from "@/components/tiptap-ui/table-dropdown-menu/use-table-dropdown-menu";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap-ui-primitive/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/tiptap-ui-primitive/dropdown-menu";

export interface TableDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor;
  onOpenChange?: (isOpen: boolean) => void;
  modal?: boolean;
}

function TableDropdownMenuImpl(
  {
    editor: providedEditor,
    onOpenChange,
    modal = true,
    ...props
  }: TableDropdownMenuProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = useState(false);

  const {
    tableInSchema,
    isInTable,
    canInsertTable,
    tableActions,
    handleAction,
  } = useTableDropdownMenu({
    editor,
  });

  const handleOnOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  if (!tableInSchema) {
    return null;
  }

  return (
    <DropdownMenu modal={modal} open={isOpen} onOpenChange={handleOnOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          data-active-state={isInTable ? "on" : "off"}
          role="button"
          tabIndex={-1}
          disabled={!canInsertTable}
          data-disabled={!canInsertTable}
          aria-label="Table options"
          tooltip="Table"
          {...props}
          ref={ref}
        >
          <TableIcon className="tiptap-button-icon" />
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        {tableActions.map((action, index) => (
          <div key={action.label}>
            <DropdownMenuItem asChild disabled={action.disabled?.(editor!)}>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start"
                disabled={action.disabled?.(editor!)}
                onClick={() => handleAction(action)}
              >
                <span className="tiptap-button-text">{action.label}</span>
              </Button>
            </DropdownMenuItem>
            {action.dividerAfter && index < tableActions.length - 1 && (
              <DropdownMenuSeparator />
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const TableDropdownMenu = forwardRef(TableDropdownMenuImpl);

TableDropdownMenu.displayName = "TableDropdownMenu";

export default TableDropdownMenu;
