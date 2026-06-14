import { execSync } from "node:child_process";
import fs from "node:fs";

export function getYesFlag(): boolean {
  return process.argv.includes("-y") || process.argv.includes("--yes");
}

function tempDiff(before: string, after: string, color: boolean): string {
  const tmp = `/tmp/ai-diff-${Date.now()}`;
  const bf = `${tmp}.before`;
  const af = `${tmp}.after`;
  fs.writeFileSync(bf, before);
  fs.writeFileSync(af, after);

  try {
    return execSync(
      `git diff --no-index${color ? " --color=always" : ""} --unified=3 "${bf}" "${af}"`,
      { encoding: "utf-8", stdio: "pipe" },
    );
  } catch (e) {
    return (e as { stdout?: string }).stdout || "";
  } finally {
    try {
      fs.unlinkSync(bf);
    } catch {
      /* ok */
    }
    try {
      fs.unlinkSync(af);
    } catch {
      /* ok */
    }
  }
}

export function showDiff(
  filePath: string,
  before: string,
  after: string,
): void {
  const diff = tempDiff(before, after, true);
  console.log(`\n${filePath}`);
  console.log(diff);
}

async function ask(prompt: string): Promise<string> {
  const readline = await import("node:readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

export interface Hunk {
  header: string;
  originalStart: number;
  originalLineCount: number;
  lines: string[];
}

export function parseHunks(diffText: string): Hunk[] {
  const hunks: Hunk[] = [];
  const lines = diffText.split("\n");
  let i = 0;

  while (i < lines.length && !lines[i].startsWith("@@ ")) i++;

  while (i < lines.length) {
    const header = lines[i];
    const m = header.match(/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
    if (!m) {
      i++;
      continue;
    }

    const originalStart = parseInt(m[1]);
    const originalLineCount = parseInt(m[2] || "1");
    i++;

    const hunkLines: string[] = [];
    while (i < lines.length && !lines[i].startsWith("@@ ")) {
      hunkLines.push(lines[i]);
      i++;
    }

    hunks.push({ header, originalStart, originalLineCount, lines: hunkLines });
  }

  return hunks;
}

function applyHunks(before: string, hunks: Hunk[]): string {
  const lines = before.split("\n");
  let offset = 0;

  for (const hunk of hunks) {
    const start = hunk.originalStart - 1 + offset;
    const deletions: string[] = [];
    const additions: string[] = [];

    for (const line of hunk.lines) {
      if (line.startsWith("-")) deletions.push(line.slice(1));
      else if (line.startsWith("+")) additions.push(line.slice(1));
    }

    lines.splice(start, deletions.length, ...additions);
    offset += additions.length - deletions.length;
  }

  return lines.join("\n");
}

type HunkAnswer = "y" | "n" | "q" | "a";

async function askHunk(hunkNum: number, total: number): Promise<HunkAnswer> {
  const answer = await ask(`Apply this hunk (${hunkNum}/${total})? [y/N/q/a] `);
  if (answer === "y" || answer === "yes") return "y";
  if (answer === "q" || answer === "quit") return "q";
  if (answer === "a" || answer === "all") return "a";
  return "n";
}

export async function interactivePatch(
  filePath: string,
  before: string,
  after: string,
): Promise<string | null> {
  if (before === after) return null;

  const diffText = tempDiff(before, after, false);
  const hunks = parseHunks(diffText);

  if (hunks.length === 0) return null;

  console.log(`\n${filePath} (${hunks.length} hunk(s))`);

  const selected: Hunk[] = [];
  let allSelected = false;

  for (let i = 0; i < hunks.length; i++) {
    const hunk = hunks[i];
    console.log(`\nHunk ${i + 1}/${hunks.length}:`);
    console.log(hunk.header);
    for (const line of hunk.lines) console.log(line);

    if (allSelected) {
      selected.push(hunk);
      continue;
    }

    if (getYesFlag()) {
      selected.push(hunk);
      continue;
    }

    const ans = await askHunk(i + 1, hunks.length);
    if (ans === "q") break;
    if (ans === "a") {
      selected.push(hunk);
      allSelected = true;
      continue;
    }
    if (ans === "y") selected.push(hunk);
  }

  if (selected.length === 0) return null;
  if (selected.length === hunks.length) return after;
  return applyHunks(before, selected);
}

export async function applyOrSkip(
  filePath: string,
  before: string,
  after: string,
  onApply: () => void | Promise<void>,
): Promise<boolean> {
  if (before === after) {
    console.log(`  ✓ ${filePath}: No changes`);
    return false;
  }

  showDiff(filePath, before, after);

  const autoYes = getYesFlag();
  const shouldApply =
    autoYes || (await ask("Apply changes? [y/N/q] ")).startsWith("y");

  if (shouldApply) {
    await onApply();
    console.log(`  ✓ ${filePath}: Applied`);
    return true;
  }

  console.log(`  ✗ ${filePath}: Skipped`);
  return false;
}
