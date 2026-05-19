/**
 * Syncs Obsidian vault markdown files to ElevenLabs knowledge base.
 *
 * Usage:
 *   bun run scripts/sync-knowledge.ts
 *
 * Reads from the wiki/ and raw/ directories in the vault,
 * strips Obsidian syntax, and uploads to ElevenLabs.
 *
 * First run: creates all documents.
 * Subsequent runs: updates existing documents, creates new ones, skips unchanged.
 *
 * Requires ELEVENLABS_API_KEY in .env.local
 */

import { readFile, writeFile, readdir, mkdir } from "fs/promises";
import { join, relative, basename } from "path";
import { createHash } from "crypto";

// --- Config ---
const VAULT_ROOT = join(import.meta.dir, "../../"); // Tech Investing root
const SYNC_DIRS = ["wiki", "raw/transcripts"];
const SYNC_STATE_PATH = join(import.meta.dir, "../.sync-state.json");
const API_BASE = "https://api.elevenlabs.io/v1/convai/knowledge-base";
const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY. Run with: bun run --env-file=.env.local scripts/sync-knowledge.ts");
  process.exit(1);
}

// --- Types ---
interface SyncState {
  documents: Record<string, { docId: string; hash: string; updatedAt: string }>;
}

interface ElevenLabsDoc {
  id: string;
  name: string;
}

// --- Obsidian cleanup (reuses logic from prepare-vault.ts) ---
function stripObsidianSyntax(content: string): string {
  let cleaned = content;
  cleaned = cleaned.replace(/^---\n[\s\S]*?\n---\n?/, "");
  cleaned = cleaned.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2");
  cleaned = cleaned.replace(/\[\[([^\]]+)\]\]/g, "$1");
  cleaned = cleaned.replace(/```dataview[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/```dataviewjs[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/^> \[!.*?\].*$/gm, "");
  cleaned = cleaned.replace(/%%[\s\S]*?%%/g, "");
  cleaned = cleaned.replace(/!\[\[([^\]]+)\]\]/g, "");
  cleaned = cleaned.replace(/(?<!\S)#[a-zA-Z][\w/-]*/g, "");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  return cleaned.trim();
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

// --- File discovery ---
async function* walkMarkdown(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      yield* walkMarkdown(full);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      yield full;
    }
  }
}

// --- Sync state persistence ---
async function loadSyncState(): Promise<SyncState> {
  try {
    const raw = await readFile(SYNC_STATE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { documents: {} };
  }
}

async function saveSyncState(state: SyncState): Promise<void> {
  await writeFile(SYNC_STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
}

// --- ElevenLabs API helpers ---
async function createTextDoc(name: string, text: string): Promise<string> {
  const res = await fetch(`${API_BASE}/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": API_KEY!,
    },
    body: JSON.stringify({ name, text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create "${name}": ${res.status} ${err}`);
  }

  const data: ElevenLabsDoc = await res.json();
  return data.id;
}

async function updateTextDoc(docId: string, name: string, content: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${docId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": API_KEY!,
    },
    body: JSON.stringify({ name, content }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to update "${name}" (${docId}): ${res.status} ${err}`);
  }
}

async function deleteDoc(docId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${docId}`, {
    method: "DELETE",
    headers: { "xi-api-key": API_KEY! },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Failed to delete ${docId}: ${res.status} ${err}`);
  }
}

// --- Main sync ---
async function main() {
  console.log("Syncing Obsidian vault to ElevenLabs knowledge base...\n");

  const state = await loadSyncState();
  const currentFiles = new Map<string, { content: string; hash: string }>();

  // Discover and process all markdown files
  for (const dir of SYNC_DIRS) {
    const fullDir = join(VAULT_ROOT, dir);
    for await (const filePath of walkMarkdown(fullDir)) {
      const raw = await readFile(filePath, "utf-8");
      const cleaned = stripObsidianSyntax(raw);

      // Skip very short files (likely empty templates)
      if (cleaned.length < 50) continue;

      const relPath = relative(VAULT_ROOT, filePath);
      const name = relPath.replace(/\//g, " / ").replace(/\.md$/, "");
      const hash = hashContent(cleaned);

      currentFiles.set(relPath, { content: cleaned, hash });
    }
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let deleted = 0;

  // Create or update documents
  for (const [relPath, { content, hash }] of currentFiles) {
    const name = relPath.replace(/\//g, " / ").replace(/\.md$/, "");
    const existing = state.documents[relPath];

    if (existing && existing.hash === hash) {
      skipped++;
      continue;
    }

    if (existing) {
      // Content changed — update
      try {
        await updateTextDoc(existing.docId, name, content);
        state.documents[relPath] = { ...existing, hash, updatedAt: new Date().toISOString() };
        updated++;
        console.log(`  updated: ${name}`);
      } catch (err) {
        console.error(`  FAILED to update: ${name}`, (err as Error).message);
      }
    } else {
      // New file — create
      try {
        const docId = await createTextDoc(name, content);
        state.documents[relPath] = { docId, hash, updatedAt: new Date().toISOString() };
        created++;
        console.log(`  created: ${name}`);
      } catch (err) {
        console.error(`  FAILED to create: ${name}`, (err as Error).message);
      }
    }

    // Rate limit: ElevenLabs API can be sensitive
    await new Promise((r) => setTimeout(r, 500));
  }

  // Delete documents that no longer exist in vault
  for (const [relPath, { docId }] of Object.entries(state.documents)) {
    if (!currentFiles.has(relPath)) {
      const name = relPath.replace(/\//g, " / ").replace(/\.md$/, "");
      try {
        await deleteDoc(docId);
        delete state.documents[relPath];
        deleted++;
        console.log(`  deleted: ${name}`);
      } catch (err) {
        console.error(`  FAILED to delete: ${name}`, (err as Error).message);
      }
    }
  }

  await saveSyncState(state);

  console.log(`\nDone! Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Deleted: ${deleted}`);
  console.log(`Total documents in knowledge base: ${Object.keys(state.documents).length}`);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
