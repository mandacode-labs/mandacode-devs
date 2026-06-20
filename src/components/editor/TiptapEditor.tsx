import { useEffect, useRef, useCallback } from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Selection } from "@tiptap/extensions";

import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import { ColorHighlightPopover } from "@/components/tiptap-ui/color-highlight-popover";
import { LinkPopover } from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";

import {
  createHandleImageUpload,
  type EntityUploadConfig,
} from "@/lib/tiptap-upload";
import { MAX_FILE_SIZE } from "@/lib/tiptap-utils";

import "@/components/tiptap-templates/simple/simple-editor.scss";

function parseTiptapContent(content: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through to empty doc
  }
  return { type: "doc", content: [] };
}

const MainToolbarContent = () => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <ColorHighlightPopover />
        <LinkPopover />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add image" />
      </ToolbarGroup>

      <Spacer />
    </>
  );
};

interface TiptapEditorProps extends EntityUploadConfig {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = "Write something...",
  entityType,
  entityId,
}: TiptapEditorProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const lastJsonRef = useRef<string>("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialContentRef = useRef(parseTiptapContent(content));

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const notifyChange = useCallback(
    (editorInstance: { getJSON: () => Record<string, unknown> }) => {
      const json = JSON.stringify(editorInstance.getJSON());
      if (json === lastJsonRef.current) return;
      lastJsonRef.current = json;
      onChangeRef.current(json);
    },
    [],
  );

  const scheduleNotify = useCallback(
    (editorInstance: { getJSON: () => Record<string, unknown> }) => {
      const json = JSON.stringify(editorInstance.getJSON());
      if (json === lastJsonRef.current) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastJsonRef.current = json;
        onChangeRef.current(json);
      }, 800);
    },
    [],
  );

  const handleImageUpload = useCallback(
    createHandleImageUpload({ entityType, entityId }),
    [entityType, entityId],
  );

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": placeholder,
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content: initialContentRef.current,
    onCreate: ({ editor: e }) => {
      lastJsonRef.current = JSON.stringify(e.getJSON());
    },
    onUpdate: ({ editor: e }) => {
      scheduleNotify(e);
    },
    onBlur: ({ editor: e }) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      notifyChange(e);
    },
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!editor) {
    return (
      <div className="simple-editor-wrapper simple-editor-wrapper--loading">
        <div className="simple-editor-toolbar h-12 bg-bg-secondary border-b border-border" />
        <div className="simple-editor-content p-4 min-h-[300px] bg-bg-primary" />
      </div>
    );
  }

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          variant="fixed"
          onMouseDown={(event) => event.preventDefault()}
        >
          <MainToolbarContent />
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  );
}
