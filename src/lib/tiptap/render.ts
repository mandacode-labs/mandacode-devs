import { getSchema, type JSONContent } from "@tiptap/core";
import { DOMSerializer, Node } from "@tiptap/pm/model";
import { parseHTML } from "linkedom";
import { tiptapExtensions } from "@/lib/tiptap/extensions";

const schema = getSchema(tiptapExtensions);

let cachedDocument: Document | null = null;

function getDocument(): Document {
  if (cachedDocument) return cachedDocument;
  const { document } = parseHTML("<!doctype html><html><body></body></html>");
  cachedDocument = document as unknown as Document;
  return cachedDocument;
}

export function renderTiptapNode(node: JSONContent): string {
  const contentNode = Node.fromJSON(schema, node);
  const document = getDocument();
  const fragment = contentNode.content;
  const wrap = document.createElement("div");
  DOMSerializer.fromSchema(schema).serializeFragment(
    fragment,
    { document },
    wrap,
  );
  return wrap.innerHTML;
}

export function renderTiptapJson(jsonString: string): string {
  try {
    const json = JSON.parse(jsonString) as JSONContent;
    return renderTiptapNode(json);
  } catch {
    return "";
  }
}
