/**
 * Syncs Obsidian vault markdown files to ElevenLabs knowledge base
 * and links them to the agent.
 *
 * Usage:
 *   bun run scripts/sync-knowledge.ts
 *
 * Reads from the wiki/ and raw/ directories in the vault,
 * strips Obsidian syntax, uploads to ElevenLabs, and updates
 * the agent to use all synced documents.
 *
 * Requires ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID in .env.local
 */

import { readFile, writeFile, readdir } from "fs/promises";
import { join, relative } from "path";
import { createHash } from "crypto";

// --- Config ---
const VAULT_ROOT = join(import.meta.dir, "../../"); // Tech Investing root
const SYNC_DIRS = ["wiki", "raw/transcripts"];
const SYNC_STATE_PATH = join(import.meta.dir, "../.sync-state.json");
const API_BASE = "https://api.elevenlabs.io/v1/convai";
const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
const BRANCH_ID = process.env.ELEVENLABS_BRANCH_ID;

if (!API_KEY) {
  console.error("Missing ELEVENLABS_API_KEY. Run with: bun run --env-file=.env.local scripts/sync-knowledge.ts");
  process.exit(1);
}

if (!AGENT_ID) {
  console.error("Missing ELEVENLABS_AGENT_ID in .env.local");
  process.exit(1);
}

// --- Types ---
interface SyncState {
  documents: Record<string, { docId: string; hash: string; name: string; updatedAt: string }>;
}

interface ElevenLabsDoc {
  id: string;
  name: string;
}

// --- Obsidian cleanup ---
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
  const res = await fetch(`${API_BASE}/knowledge-base/text`, {
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

async function deleteDoc(docId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/knowledge-base/${docId}`, {
    method: "DELETE",
    headers: { "xi-api-key": API_KEY! },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Failed to delete ${docId}: ${res.status} ${err}`);
  }
}

async function linkDocsToAgent(
  docs: Array<{ id: string; name: string; type: string }>
): Promise<void> {
  const knowledgeBase = docs.map((d) => ({
    type: d.type,
    name: d.name,
    id: d.id,
    usage_mode: "auto",
  }));

  const url = BRANCH_ID
    ? `${API_BASE}/agents/${AGENT_ID}?branch_id=${BRANCH_ID}`
    : `${API_BASE}/agents/${AGENT_ID}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": API_KEY!,
    },
    body: JSON.stringify({
      agent: {
        prompt: {
          knowledge_base: knowledgeBase,
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to link docs to agent: ${res.status} ${err}`);
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

      if (cleaned.length < 50) continue;

      const relPath = relative(VAULT_ROOT, filePath);
      const hash = hashContent(cleaned);

      currentFiles.set(relPath, { content: cleaned, hash });
    }
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let deleted = 0;
  let changed = false;

  // Create or update documents
  for (const [relPath, { content, hash }] of currentFiles) {
    const name = relPath.replace(/\//g, " / ").replace(/\.md$/, "");
    const existing = state.documents[relPath];

    if (existing && existing.hash === hash) {
      skipped++;
      continue;
    }

    if (existing) {
      // Content changed — delete old, create new
      try {
        await deleteDoc(existing.docId);
        await new Promise((r) => setTimeout(r, 300));
        const docId = await createTextDoc(name, content);
        state.documents[relPath] = { docId, hash, name, updatedAt: new Date().toISOString() };
        updated++;
        changed = true;
        console.log(`  updated: ${name}`);
      } catch (err) {
        console.error(`  FAILED to update: ${name}`, (err as Error).message);
      }
    } else {
      // New file — create
      try {
        const docId = await createTextDoc(name, content);
        state.documents[relPath] = { docId, hash, name, updatedAt: new Date().toISOString() };
        created++;
        changed = true;
        console.log(`  created: ${name}`);
      } catch (err) {
        console.error(`  FAILED to create: ${name}`, (err as Error).message);
      }
    }

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
        changed = true;
        console.log(`  deleted: ${name}`);
      } catch (err) {
        console.error(`  FAILED to delete: ${name}`, (err as Error).message);
      }
    }
  }

  await saveSyncState(state);

  // Link all documents to the agent (always, to ensure agent has the right docs)
  if (changed || process.argv.includes("--force-link")) {
    console.log("\nLinking documents to agent...");
    try {
      const allDocs = Object.values(state.documents).map((d) => ({
        id: d.docId,
        name: d.name,
        type: "text" as const,
      }));
      await linkDocsToAgent(allDocs);
      console.log(`  Linked ${allDocs.length} documents to agent ${AGENT_ID}`);
    } catch (err) {
      console.error("  FAILED to link docs to agent:", (err as Error).message);
    }
  }

  console.log(`\nDone! Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Deleted: ${deleted}`);
  console.log(`Total documents in knowledge base: ${Object.keys(state.documents).length}`);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
