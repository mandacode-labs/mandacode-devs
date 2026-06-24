import { describe, expect, it } from "vitest";
import {
  extractTexts,
  extractImageAlts,
  applyTranslations,
  type TextNode,
  type ImageAltNode,
} from "../tiptap/translation";

describe("extractTexts", () => {
  it("returns block=other for a bare text node", () => {
    const json = { type: "doc", content: [{ type: "text", text: "hi" }] };
    const result = extractTexts(json);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "s1",
      path: [0],
      block: "other",
      text: "hi",
      marks: [],
    });
  });

  it("captures paragraph as parent block", () => {
    const json = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "hello" }] },
      ],
    };
    const result = extractTexts(json);
    expect(result[0]).toMatchObject({
      id: "s1",
      block: "paragraph",
      text: "hello",
    });
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
      id: "s1",
      block: "heading",
      level: 2,
      text: "Title",
    });
  });

  it("captures listItem inside bulletList with list context", () => {
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
    expect(result[0]).toMatchObject({
      id: "s1",
      block: "listItem",
      list: "bullet",
      listDepth: 0,
      listIndex: 0,
      text: "item",
    });
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
    expect(result[0]).toMatchObject({
      block: "blockquote",
      text: "quoted",
    });
  });

  it("preserves blockquote through inner paragraph", () => {
    const json = {
      type: "doc",
      content: [
        {
          type: "blockquote",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "inside" }] },
          ],
        },
      ],
    };
    const result = extractTexts(json);
    expect(result[0]).toMatchObject({ block: "blockquote", text: "inside" });
  });

  it("captures codeBlock with language", () => {
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
    expect(result[0]).toMatchObject({
      block: "codeBlock",
      language: "ts",
      text: "const x = 1;",
    });
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

  it("walks deeply nested lists with growing depth", () => {
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
    expect(result[0]).toMatchObject({ block: "listItem", listDepth: 0 });
    expect(result[1]).toMatchObject({ block: "listItem", listDepth: 1 });
  });

  it("captures ordered list type and item index", () => {
    const json = {
      type: "doc",
      content: [
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [{ type: "text", text: "first" }],
            },
            {
              type: "listItem",
              content: [{ type: "text", text: "second" }],
            },
          ],
        },
      ],
    };
    const result = extractTexts(json);
    expect(result[0]).toMatchObject({ list: "ordered", listIndex: 0 });
    expect(result[1]).toMatchObject({ list: "ordered", listIndex: 1 });
  });

  it("captures table cells with row, col, and isHeader", () => {
    const json = {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                {
                  type: "tableHeader",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "H1" }],
                    },
                  ],
                },
                {
                  type: "tableHeader",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "H2" }],
                    },
                  ],
                },
              ],
            },
            {
              type: "tableRow",
              content: [
                {
                  type: "tableCell",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "a" }],
                    },
                  ],
                },
                {
                  type: "tableCell",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "b" }],
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
    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({
      block: "tableCell",
      row: 0,
      col: 0,
      isHeader: true,
    });
    expect(result[1]).toMatchObject({
      block: "tableCell",
      row: 0,
      col: 1,
      isHeader: true,
    });
    expect(result[2]).toMatchObject({
      block: "tableCell",
      row: 1,
      col: 0,
      isHeader: false,
    });
    expect(result[3]).toMatchObject({
      block: "tableCell",
      row: 1,
      col: 1,
      isHeader: false,
    });
  });

  it("assigns unique sequential ids", () => {
    const json = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "A" }] },
        { type: "paragraph", content: [{ type: "text", text: "B" }] },
        { type: "paragraph", content: [{ type: "text", text: "C" }] },
      ],
    };
    const result = extractTexts(json);
    expect(result.map((r) => r.id)).toEqual(["s1", "s2", "s3"]);
  });
});

describe("extractImageAlts", () => {
  it("returns non-empty alts only with ids", () => {
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
      { id: "a1", path: [0, 0], alt: "first" },
      { id: "a2", path: [0, 2], alt: "third" },
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

describe("applyTranslations", () => {
  it("applies translated text by id while preserving structure", () => {
    const json = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello" },
            { type: "text", text: " world" },
          ],
        },
      ],
    });
    const segments = extractTexts(JSON.parse(json));
    const result = applyTranslations(json, segments, [], {
      segments: [
        { id: "s1", text: "안녕" },
        { id: "s2", text: " 세계" },
      ],
      alts: [],
    });
    expect(result.missingSegmentIds).toEqual([]);
    expect(result.unknownSegmentIds).toEqual([]);
    const parsed = JSON.parse(result.article) as {
      content: { content: { text: string }[] }[];
    };
    expect(parsed.content[0]?.content[0]?.text).toBe("안녕");
    expect(parsed.content[0]?.content[1]?.text).toBe(" 세계");
  });

  it("preserves marks on translated segments", () => {
    const json = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "click",
              marks: [{ type: "link", attrs: { href: "https://x.com" } }],
            },
          ],
        },
      ],
    });
    const segments = extractTexts(JSON.parse(json));
    const result = applyTranslations(json, segments, [], {
      segments: [{ id: "s1", text: "클릭" }],
      alts: [],
    });
    const parsed = JSON.parse(result.article) as {
      content: { content: { text: string; marks: unknown[] }[] }[];
    };
    expect(parsed.content[0]?.content[0]?.text).toBe("클릭");
    expect(parsed.content[0]?.content[0]?.marks).toEqual([
      { type: "link", attrs: { href: "https://x.com" } },
    ]);
  });

  it("applies translated alt by id", () => {
    const json = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "image",
          attrs: { src: "/x.png", alt: "old" },
        },
      ],
    });
    const alts = extractImageAlts(JSON.parse(json));
    const result = applyTranslations(json, [], alts, {
      segments: [],
      alts: [{ id: alts[0]!.id, alt: "새 설명" }],
    });
    const parsed = JSON.parse(result.article) as {
      content: { attrs: { alt: string; src: string } }[];
    };
    expect(parsed.content[0]?.attrs.alt).toBe("새 설명");
    expect(parsed.content[0]?.attrs.src).toBe("/x.png");
  });

  it("detects missing segment ids", () => {
    const json = JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "A" }] },
        { type: "paragraph", content: [{ type: "text", text: "B" }] },
      ],
    });
    const segments = extractTexts(JSON.parse(json));
    const result = applyTranslations(json, segments, [], {
      segments: [{ id: "s1", text: "가" }],
      alts: [],
    });
    expect(result.missingSegmentIds).toEqual(["s2"]);
  });

  it("detects unknown segment ids from response", () => {
    const json = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "A" }] }],
    });
    const segments = extractTexts(JSON.parse(json));
    const result = applyTranslations(json, segments, [], {
      segments: [
        { id: "s1", text: "가" },
        { id: "s99", text: "나" },
      ],
      alts: [],
    });
    expect(result.unknownSegmentIds).toEqual(["s99"]);
  });

  it("works regardless of segment order in response", () => {
    const json = JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "A" }] },
        { type: "paragraph", content: [{ type: "text", text: "B" }] },
      ],
    });
    const segments = extractTexts(JSON.parse(json));
    const result = applyTranslations(json, segments, [], {
      segments: [
        { id: "s2", text: "나" },
        { id: "s1", text: "가" },
      ],
      alts: [],
    });
    const parsed = JSON.parse(result.article) as {
      content: { content: { text: string }[] }[];
    };
    expect(parsed.content[0]?.content[0]?.text).toBe("가");
    expect(parsed.content[1]?.content[0]?.text).toBe("나");
  });
});
