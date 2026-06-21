"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Code2Icon } from "@/components/tiptap-icons/code2-icon";
import { PlayIcon } from "@/components/tiptap-icons/play-icon";
import "@/components/tiptap-node/mermaid-node/mermaid-node.scss";
import { escapeMermaidBraces } from "@/lib/mermaid/escape";

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;

function loadMermaid() {
  if (mermaidPromise) return mermaidPromise;
  mermaidPromise = import("mermaid").then(({ default: m }) => m);
  return mermaidPromise;
}

interface MermaidPreviewProps {
  source: string;
  onError: (message: string) => void;
}

function MermaidPreview({ source, onError }: MermaidPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = await loadMermaid();
        mermaid.initialize({ startOnLoad: false, theme: "default" });
        const id = `editor-mermaid-${Math.random().toString(36).slice(2, 11)}`;
        const definition = escapeMermaidBraces(source);
        const { svg } = await mermaid.render(id, definition);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        if (!cancelled) {
          onError(error instanceof Error ? error.message : "Render failed");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [source, onError]);

  return (
    <div
      ref={containerRef}
      className="mermaid-node-preview"
      dangerouslySetInnerHTML={{ __html: "" }}
    />
  );
}

function PlainCodeBlock({
  language,
  children,
}: {
  language: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <pre className="mermaid-node-code">
      <code
        className={
          language && language !== "plaintext" ? `language-${language}` : ""
        }
      >
        {children}
      </code>
    </pre>
  );
}

export function MermaidNode(props: NodeViewProps) {
  const { node, editor } = props;
  const language = node.attrs.language as string | undefined;
  const isMermaid = language === "mermaid";
  const [isPreview, setIsPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef(node.textContent ?? "");
  const source = node.textContent ?? "";

  const toggleMode = useCallback(() => {
    if (!isPreview && sourceRef.current !== source) {
      const pos = props.getPos();
      if (typeof pos === "number") {
        const { tr } = editor.state;
        const content = editor.schema.text(sourceRef.current);
        tr.replaceWith(pos + 1, pos + node.nodeSize - 1, content);
        editor.view.dispatch(tr);
      }
    }
    setIsPreview((prev) => !prev);
    setError(null);
  }, [isPreview, source, editor, node.nodeSize, props]);

  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  if (!isMermaid) {
    return (
      <NodeViewWrapper
        className="mermaid-node mermaid-node--plain"
        data-language={language}
      >
        <div className="mermaid-node-toolbar" contentEditable={false}>
          <span className="mermaid-node-label">
            {language && language !== "plaintext" ? language : "Plain text"}
          </span>
        </div>
        <PlainCodeBlock language={language}>
          <NodeViewContent as="div" className="mermaid-node-content" />
        </PlainCodeBlock>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className={`mermaid-node ${isPreview ? "mermaid-node--preview" : "mermaid-node--edit"}`}
      data-language={language}
    >
      <div className="mermaid-node-toolbar" contentEditable={false}>
        <span className="mermaid-node-label">Mermaid</span>
        <Button
          type="button"
          variant="ghost"
          size="small"
          onClick={toggleMode}
          className="mermaid-node-toggle"
        >
          {isPreview ? (
            <>
              <Code2Icon className="tiptap-button-icon" />
              <span>Edit source</span>
            </>
          ) : (
            <>
              <PlayIcon className="tiptap-button-icon" />
              <span>Preview</span>
            </>
          )}
        </Button>
      </div>

      {isPreview ? (
        <div
          className="mermaid-node-preview-wrapper"
          onClick={toggleMode}
          role="button"
          tabIndex={0}
          title="Click to edit source"
        >
          {error ? (
            <div className="mermaid-node-error">
              <strong>Mermaid error:</strong> {error}
            </div>
          ) : (
            <MermaidPreview source={source} onError={setError} />
          )}
        </div>
      ) : (
        <div className="mermaid-node-editor">
          <NodeViewContent as="div" className="mermaid-node-content" />
        </div>
      )}
    </NodeViewWrapper>
  );
}

export default MermaidNode;
