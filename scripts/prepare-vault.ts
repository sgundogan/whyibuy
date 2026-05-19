/**
 * Strips Obsidian-specific syntax from markdown files for ElevenLabs knowledge base upload.
 * Usage: bun run scripts/prepare-vault.ts <vault-path> <output-dir>
 */

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, relative, basename } from "path";

const VAULT_PATH = process.argv[2];
const OUTPUT_DIR = process.argv[3] || "./vault-export";

if (!VAULT_PATH) {
  console.error("Usage: bun run scripts/prepare-vault.ts <vault-path> [output-dir]");
  process.exit(1);
}

function stripObsidianSyntax(content: string): string {
  let cleaned = content;

  // Remove YAML frontmatter
  cleaned = cleaned.replace(/^---\n[\s\S]*?\n---\n?/, "");

  // Convert wikilinks [[Note Name]] → Note Name
  cleaned = cleaned.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2");
  cleaned = cleaned.replace(/\[\[([^\]]+)\]\]/g, "$1");

  // Remove dataview blocks
  cleaned = cleaned.replace(/```dataview[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/```dataviewjs[\s\S]*?```/g, "");

  // Remove Obsidian callouts syntax but keep content
  cleaned = cleaned.replace(/^> \[!.*?\].*$/gm, "");

  // Remove Obsidian comments %%...%%
  cleaned = cleaned.replace(/%%[\s\S]*?%%/g, "");

  // Remove embed syntax ![[...]]
  cleaned = cleaned.replace(/!\[\[([^\]]+)\]\]/g, "");

  // Remove tags (#tag)
  cleaned = cleaned.replace(/(?<!\S)#[a-zA-Z][\w/-]*/g, "");

  // Clean up excessive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

async function* walkMarkdown(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      yield* walkMarkdown(full);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      yield full;
    }
  }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  let count = 0;
  for await (const filePath of walkMarkdown(VAULT_PATH)) {
    const raw = await readFile(filePath, "utf-8");
    const cleaned = stripObsidianSyntax(raw);

    if (cleaned.length < 50) continue;

    const rel = relative(VAULT_PATH, filePath);
    const outName = rel.replace(/\//g, "_");
    await writeFile(join(OUTPUT_DIR, outName), cleaned, "utf-8");
    count++;
  }

  console.log(`Exported ${count} files to ${OUTPUT_DIR}`);
}

main().catch(console.error);
