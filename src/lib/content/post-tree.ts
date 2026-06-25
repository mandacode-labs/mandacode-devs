export interface PostPath {
  path: string;
  count: number;
}

export interface FolderNode {
  name: string;
  path: string;
  count: number;
  children: FolderNode[];
}

const ROOT_NODE: FolderNode = { name: "", path: "", count: 0, children: [] };

function stripSlashes(s: string): string {
  return s.replace(/^\/+|\/+$/g, "");
}

export function buildPostTree(paths: PostPath[]): FolderNode[] {
  const root: FolderNode = {
    name: ROOT_NODE.name,
    path: ROOT_NODE.path,
    count: ROOT_NODE.count,
    children: [...ROOT_NODE.children],
  };
  for (const item of paths) {
    if (item.path === "/" || item.path === "") continue;
    const trimmed = stripSlashes(item.path);
    if (!trimmed) continue;
    const segments = trimmed.split("/");
    let cursor = root;
    let acc = "";
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!;
      acc += "/" + seg;
      const isLeaf = i === segments.length - 1;
      let child = cursor.children.find((c) => c.name === seg);
      if (!child) {
        child = { name: seg, path: acc + "/", count: 0, children: [] };
        cursor.children.push(child);
      }
      if (isLeaf) child.count = item.count;
      cursor = child;
    }
  }
  for (const c of root.children) rollupCounts(c);
  root.children.sort((a, b) => a.name.localeCompare(b.name));
  for (const c of root.children)
    c.children.sort((a, b) => a.name.localeCompare(b.name));
  return root.children;
}

function rollupCounts(node: FolderNode): number {
  let total = node.count;
  for (const c of node.children) total += rollupCounts(c);
  node.count = total;
  return total;
}

export function getImmediateChildren(
  tree: FolderNode[],
  folderPath: string,
): FolderNode[] {
  const normalized = folderPath === "/" ? "" : stripSlashes(folderPath);
  if (normalized === "") {
    return tree.map((node) => ({
      name: node.name,
      path: node.path,
      count: node.count - sumDescendantLeaves(node),
      children: [],
    }));
  }
  const segments = normalized.split("/");
  let cursor: FolderNode | undefined = tree.find((n) => n.name === segments[0]);
  for (let i = 1; i < segments.length && cursor; i++) {
    cursor = cursor.children.find((n) => n.name === segments[i]);
  }
  if (!cursor) return [];
  return cursor.children;
}

function sumDescendantLeaves(node: FolderNode): number {
  if (node.children.length === 0) return node.count;
  let sum = 0;
  for (const c of node.children) sum += sumDescendantLeaves(c);
  return sum;
}

export function isPathActive(currentPath: string, folderPath: string): boolean {
  if (folderPath === "/" || folderPath === "") return true;
  const c = stripSlashes(currentPath);
  const f = stripSlashes(folderPath);
  if (c === "") return false;
  return c === f || c.startsWith(f + "/");
}
