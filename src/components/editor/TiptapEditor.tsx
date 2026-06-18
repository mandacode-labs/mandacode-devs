import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useMemo, useRef, useState } from "react";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  insertedImageUrl?: string;
}

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

export default function TiptapEditor({
  content,
  onChange,
  placeholder = "Write something...",
  insertedImageUrl,
}: TiptapEditorProps) {
  const [mounted, setMounted] = useState(false);
  const lastJsonRef = useRef<string>("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const extensions = useMemo(
    () => [
      StarterKit,
      Image.configure({
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    [placeholder],
  );

  const notifyChange = (editorInstance: { getJSON: () => Record<string, unknown> }) => {
    const json = JSON.stringify(editorInstance.getJSON());
    if (json === lastJsonRef.current) return;
    lastJsonRef.current = json;
    onChangeRef.current(json);
  };

  const scheduleNotify = (editorInstance: { getJSON: () => Record<string, unknown> }) => {
    const json = JSON.stringify(editorInstance.getJSON());
    if (json === lastJsonRef.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      lastJsonRef.current = json;
      onChangeRef.current(json);
    }, 150);
  };

  const editor = useEditor({
    extensions,
    content: parseTiptapContent(content),
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    autofocus: false,
    injectCSS: false,
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

  useEffect(() => {
    if (editor && insertedImageUrl) {
      editor.chain().focus().setImage({ src: insertedImageUrl }).run();
    }
  }, [editor, insertedImageUrl]);

  if (!mounted || !editor) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-bg-secondary">
          {[
            "Bold",
            "Italic",
            "H2",
            "H3",
            "Bullet",
            "Numbered",
            "Link",
            "Image URL",
          ].map((label) => (
            <button
              key={label}
              type="button"
              disabled
              className="px-3 py-1 rounded text-sm bg-bg-primary text-text-muted opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="prose prose-neutral max-w-none p-4 min-h-[300px] bg-bg-primary whitespace-pre-wrap">
          <p className="is-empty is-editor-empty" data-placeholder={placeholder}>
            <br />
          </p>
        </div>
      </div>
    );
  }

  const addImage = () => {
    const url = window.prompt("Enter image URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const url = window.prompt("Enter URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 border-b border-border bg-bg-secondary">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive("bold")
              ? "bg-accent text-white"
              : "bg-bg-primary hover:bg-bg-hover"
          }`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive("italic")
              ? "bg-accent text-white"
              : "bg-bg-primary hover:bg-bg-hover"
          }`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive("heading", { level: 2 })
              ? "bg-accent text-white"
              : "bg-bg-primary hover:bg-bg-hover"
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive("heading", { level: 3 })
              ? "bg-accent text-white"
              : "bg-bg-primary hover:bg-bg-hover"
          }`}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive("bulletList")
              ? "bg-accent text-white"
              : "bg-bg-primary hover:bg-bg-hover"
          }`}
        >
          Bullet
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive("orderedList")
              ? "bg-accent text-white"
              : "bg-bg-primary hover:bg-bg-hover"
          }`}
        >
          Numbered
        </button>
        <button
          type="button"
          onClick={setLink}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive("link")
              ? "bg-accent text-white"
              : "bg-bg-primary hover:bg-bg-hover"
          }`}
        >
          Link
        </button>
        <button
          type="button"
          onClick={addImage}
          className="px-3 py-1 rounded text-sm bg-bg-primary hover:bg-bg-hover"
        >
          Image URL
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-neutral max-w-none p-4 min-h-[300px] bg-bg-primary whitespace-pre-wrap"
      />
    </div>
  );
}
