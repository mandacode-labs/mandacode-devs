import { describe, expect, it } from "vitest";
import { escapeMermaidBraces } from "@/lib/mermaid/escape";

describe("escapeMermaidBraces", () => {
  it("escapes curly braces used in flowchart labels", () => {
    const input = 'Key["tarot:read:{card}:{dir}:{bucket}"]';
    expect(escapeMermaidBraces(input)).toBe(
      'Key["tarot:read:#123;card#125;:#123;dir#125;:#123;bucket#125;"]',
    );
  });

  it("escapes braces in sequence diagram labels", () => {
    const input = "AI--\u003e\u003eService: 리딩 결과 반환 ({advice})";
    expect(escapeMermaidBraces(input)).toBe(
      "AI--\u003e\u003eService: 리딩 결과 반환 (#123;advice#125;)",
    );
  });

  it("does not alter diagrams without braces", () => {
    const input = "flowchart LR\n  A --\u003e B";
    expect(escapeMermaidBraces(input)).toBe(input);
  });

  it("escapes nested or repeated braces", () => {
    const input = "A[{{double}}]";
    expect(escapeMermaidBraces(input)).toBe("A[#123;#123;double#125;#125;]");
  });

  it("escapes braces in link text", () => {
    const input = "A -->|{var}| B";
    expect(escapeMermaidBraces(input)).toBe("A -->|#123;var#125;| B");
  });
});
