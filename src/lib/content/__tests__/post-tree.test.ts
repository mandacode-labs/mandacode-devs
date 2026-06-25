import { describe, expect, it } from "vitest";
import { buildPostTree, isPathActive } from "@/lib/content/post-tree";

describe("buildPostTree", () => {
  it("returns empty tree for no paths", () => {
    expect(buildPostTree([])).toEqual([]);
  });

  it("skips root-only paths", () => {
    expect(buildPostTree([{ path: "/", count: 5 }])).toEqual([]);
  });

  it("builds single-level folders", () => {
    const tree = buildPostTree([
      { path: "/ai/", count: 3 },
      { path: "/blog/", count: 2 },
    ]);
    expect(tree).toHaveLength(2);
    expect(tree[0]).toMatchObject({ name: "ai", path: "/ai/", count: 3 });
    expect(tree[1]).toMatchObject({ name: "blog", path: "/blog/", count: 2 });
  });

  it("rolls up counts for nested folders", () => {
    const tree = buildPostTree([
      { path: "/ai/", count: 2 },
      { path: "/ai/platform/", count: 5 },
    ]);
    const ai = tree.find((n) => n.name === "ai")!;
    expect(ai.count).toBe(7);
    expect(ai.children[0]?.count).toBe(5);
  });

  it("preserves ascending order", () => {
    const tree = buildPostTree([
      { path: "/z/", count: 1 },
      { path: "/a/", count: 1 },
      { path: "/m/", count: 1 },
    ]);
    expect(tree.map((n) => n.name)).toEqual(["a", "m", "z"]);
  });
});

describe("isPathActive", () => {
  it("matches exact root", () => {
    expect(isPathActive("/", "/")).toBe(true);
  });

  it("matches exact folder", () => {
    expect(isPathActive("/ai/", "/ai/")).toBe(true);
    expect(isPathActive("/ai", "/ai/")).toBe(true);
  });

  it("matches ancestor folders", () => {
    expect(isPathActive("/ai/platform/", "/ai/")).toBe(true);
    expect(isPathActive("/ai/platform/deep/thing/", "/ai/")).toBe(true);
    expect(isPathActive("/ai/platform/deep/thing/", "/")).toBe(true);
  });

  it("does not match siblings", () => {
    expect(isPathActive("/blog/", "/ai/")).toBe(false);
    expect(isPathActive("/air/", "/ai/")).toBe(false);
  });
});
