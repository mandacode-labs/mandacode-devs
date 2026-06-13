import { execSync } from "node:child_process";
import fs from "node:fs";

export function getYesFlag(): boolean {
  return process.argv.includes("-y") || process.argv.includes("--yes");
}

export function showDiff(
  filePath: string,
  before: string,
  after: string,
): void {
  const tempFile = `/tmp/ai-diff-${Date.now()}`;
  const beforeFile = `${tempFile}.before`;
  const afterFile = `${tempFile}.after`;

  fs.writeFileSync(beforeFile, before);
  fs.writeFileSync(afterFile, after);

  try {
    const diff = execSync(
      `git diff --no-index --color=always "${beforeFile}" "${afterFile}"`,
      {
        encoding: "utf-8",
        stdio: "pipe",
      },
    );
    console.log(`\n${filePath}`);
    console.log(diff);
  } catch (error) {
    // git diff exits with 1 when files differ
    const diff = (error as { stdout?: string }).stdout || "";
    console.log(`\n${filePath}`);
    console.log(diff);
  } finally {
    fs.unlinkSync(beforeFile);
    fs.unlinkSync(afterFile);
  }
}

export async function confirm(filePath: string): Promise<boolean> {
  const readline = await import("node:readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`Apply changes to ${filePath}? [y/N/q] `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      if (normalized === "q" || normalized === "quit") {
        console.log("Aborted.");
        process.exit(0);
      }
      resolve(normalized === "y" || normalized === "yes");
    });
  });
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
  const shouldApply = autoYes || (await confirm(filePath));

  if (shouldApply) {
    await onApply();
    console.log(`  ✓ ${filePath}: Applied`);
    return true;
  } else {
    console.log(`  ✗ ${filePath}: Skipped`);
    return false;
  }
}
