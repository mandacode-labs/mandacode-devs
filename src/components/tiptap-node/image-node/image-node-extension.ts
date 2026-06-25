import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import type { DOMOutputSpec } from "@tiptap/pm/model";

export const AlignedImage = Image.extend({
  name: "image",
  addAttributes() {
    return {
      ...this.parent?.(),
      textAlign: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const wrapper = element.closest("[data-text-align]");
          return wrapper?.getAttribute("data-text-align") || null;
        },
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.textAlign) {
            return {};
          }
          return {
            "data-text-align": attributes.textAlign as string,
          };
        },
      },
    };
  },
  renderHTML({ node, HTMLAttributes }): DOMOutputSpec {
    const { textAlign } = node.attrs as Record<string, unknown>;
    const img: DOMOutputSpec = [
      "img",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
    ];
    if (!textAlign) {
      return img;
    }
    return [
      "div",
      {
        "data-text-align": textAlign as string,
        style: `text-align: ${textAlign as string}`,
      },
      img,
    ];
  },
});

export default AlignedImage;
