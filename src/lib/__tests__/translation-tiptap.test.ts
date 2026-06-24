import { describe, expect, it } from "vitest";
import {
  extractTexts,
  extractImageAlts,
  insertTexts,
  insertImageAlts,
  type TextNode,
  type ImageAltNode,
} from "../tiptap/translation";

describe("extractTexts", () => {
  it("returns type=other for a bare text node", () => {
    const json = { type: "doc", content: [{ type: "text", text: "hi" }] };
    const result = extractTexts(json);
    expect(result).toEqual([
      { path: [0], type: "other", text: "hi", marks: [] },
    ]);
  });

  it("captures paragraph as parent type", () => {
    const json = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "hello" }] },
      ],
    };
    const result = extractTexts(json);
    expect(result[0]?.type).toBe("paragraph");
    expect(result[0]?.text).toBe("hello");
  });

  it("captures heading with level", () => {
    const json = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Title" }],
        },
      ],
    };
    const result = extractTexts(json);
    expect(result[0]).toMatchObject({
      type: "heading",
      level: 2,
      text: "Title",
    });
  });

  it("captures listItem inside bulletList", () => {
    const json = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{ type: "text", text: "item" }],
            },
          ],
        },
      ],
    };
    const result = extractTexts(json);
    expect(result[0]?.type).toBe("listItem");
    expect(result[0]?.text).toBe("item");
  });

  it("captures blockquote type", () => {
    const json = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [{ type: "text", text: "quoted" }],
        },
      ],
    };
    const result = extractTexts(json);
    expect(result[0]?.type).toBe("blockquote");
  });

  it("captures codeBlock type", () => {
    const json = {
      type: "doc",
      content: [
        {
          type: "codeBlock",
          attrs: { language: "ts" },
          content: [{ type: "text", text: "const x = 1;" }],
        },
      ],
    };
    const result = extractTexts(json);
    expect(result[0]?.type).toBe("codeBlock");
    expect(result[0]?.text).toBe("const x = 1;");
  });

  it("preserves inline marks on text nodes", () => {
    const json = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Click " },
            {
              type: "text",
              text: "here",
              marks: [
                {
                  type: "link",
                  attrs: { href: "https://example.com" },
                },
              ],
            },
            { type: "text", text: " please." },
          ],
        },
      ],
    };
    const result = extractTexts(json);
    expect(result).toHaveLength(3);
    expect(result[1]?.marks).toEqual([
      { type: "link", attrs: { href: "https://example.com" } },
    ]);
    expect(result[0]?.marks).toEqual([]);
  });

  it("walks deeply nested lists", () => {
    const json = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "A" }] },
                {
                  type: "bulletList",
                  content: [
                    {
                      type: "listItem",
                      content: [
                        {
                          type: "paragraph",
                          content: [{ type: "text", text: "B" }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = extractTexts(json);
    expect(result.map((r) => r.text)).toEqual(["A", "B"]);
    expect(result[0]?.type).toBe("paragraph");
    expect(result[1]?.type).toBe("paragraph");
  });
});

describe("extractImageAlts", () => {
  it("returns non-empty alts only", () => {
    const json = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "image",
              attrs: { src: "/a.png", alt: "first" },
            },
            { type: "image", attrs: { src: "/b.png", alt: "" } },
            {
              type: "image",
              attrs: { src: "/c.png", alt: "third" },
            },
          ],
        },
      ],
    };
    const result = extractImageAlts(json);
    expect(result).toEqual([
      { path: [0, 0], alt: "first" },
      { path: [0, 2], alt: "third" },
    ]);
  });

  it("returns empty array when no images", () => {
    const json = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "x" }] }],
    };
    expect(extractImageAlts(json)).toEqual([]);
  });
});

describe("insertTexts", () => {
  it("updates text by path while preserving structure", () => {
    const json = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "old" }] },
      ],
    };
    const updates: TextNode[] = [
      { path: [0, 0], type: "paragraph", text: "new", marks: [] },
    ];
    const result = insertTexts(json, updates) as {
      content: { content: { text: string }[] }[];
    };
    expect(result.content[0]?.content[0]?.text).toBe("new");
  });
});

describe("insertImageAlts", () => {
  it("updates alt by path while preserving src", () => {
    const json = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "image", attrs: { src: "/a.png", alt: "old" } }],
        },
      ],
    };
    const updates: ImageAltNode[] = [{ path: [0, 0], alt: "new" }];
    const result = insertImageAlts(json, updates) as {
      content: { content: { attrs: { src: string; alt: string } }[] }[];
    };
    expect(result.content[0]?.content[0]?.attrs.alt).toBe("new");
    expect(result.content[0]?.content[0]?.attrs.src).toBe("/a.png");
  });
});
