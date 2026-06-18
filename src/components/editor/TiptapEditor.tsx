import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  insertedImageUrl?: string;
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = "Write something...",
  insertedImageUrl,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
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
    content,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
  });

  useEffect(() => {
    if (editor && insertedImageUrl) {
      editor.chain().focus().setImage({ src: insertedImageUrl }).run();
    }
  }, [editor, insertedImageUrl]);

  if (!editor) {
    return null;
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
        className="prose prose-neutral max-w-none p-4 min-h-[300px] bg-bg-primary"
      />
    </div>
  );
}
