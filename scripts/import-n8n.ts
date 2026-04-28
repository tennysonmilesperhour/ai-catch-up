#!/usr/bin/env tsx
/**
 * Bulk-import n8n workflow JSONs into the workflows library.
 *
 * Usage:
 *   npm run import-n8n                  # reads ./skool-downloads/
 *   npm run import-n8n -- --dir=./tmp   # custom dir
 *   npm run import-n8n -- --dry-run     # parse + extract, don't write
 *
 * For each *.json file in the input directory:
 *   1. Parse + extract metadata via lib/workflow-extract.
 *   2. Copy the raw bytes to content/workflows/<slug>.json.
 *   3. Upsert the metadata into content/admin/workflows.json — by slug
 *      first (matches against existing pre-populated section rows),
 *      falling back to a synthetic "Imports / today" bucket.
 *
 * The index file is rewritten atomically at the end of the run so
 * partial failures don't leave it in a half-updated state.
 *
 * Companion to the paste-import API route at /api/admin/workflows/import,
 * which uses the same extractor on a single pasted JSON body.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import {
  extractFromJsonText,
  workflowSlug,
} from "../lib/workflow-extract";
import {
  readWorkflowsIndex,
  writeWorkflowsIndex,
  upsertExtraction,
  WORKFLOW_RAW_DIR,
} from "../lib/workflows-store";

type Args = {
  dir: string;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  let dir = "./skool-downloads";
  let dryRun = false;
  for (const a of argv.slice(2)) {
    if (a.startsWith("--dir=")) dir = a.slice("--dir=".length);
    else if (a === "--dry-run") dryRun = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: npm run import-n8n -- [--dir=<path>] [--dry-run]\n" +
          "  --dir       Directory to scan for *.json files (default ./skool-downloads)\n" +
          "  --dry-run   Parse + extract but don't write output files"
      );
      process.exit(0);
    }
  }
  return { dir, dryRun };
}

type ProcessedFile = {
  fileName: string;
  slug: string;
  bytes: number;
  ok: boolean;
  reason?: string;
  sectionId?: string | null;
  found?: boolean;
};

function listJsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir);
  return entries
    .filter((f) => f.toLowerCase().endsWith(".json"))
    .filter((f) => {
      try {
        return statSync(join(dir, f)).isFile();
      } catch {
        return false;
      }
    })
    .sort();
}

function ensureDir(path: string): void {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function main(): void {
  const args = parseArgs(process.argv);
  const cwd = process.cwd();
  const dir = args.dir;

  console.log(`[import-n8n] scanning ${dir}${args.dryRun ? " (dry run)" : ""}`);
  const files = listJsonFiles(dir);
  if (files.length === 0) {
    console.log(`[import-n8n] no *.json files in ${dir}; nothing to do.`);
    return;
  }
  console.log(`[import-n8n] found ${files.length} file(s)`);

  const index = readWorkflowsIndex(cwd);
  const rawDir = join(cwd, WORKFLOW_RAW_DIR);
  ensureDir(rawDir);

  const processed: ProcessedFile[] = [];

  for (const fileName of files) {
    const srcPath = join(dir, fileName);
    const raw = readFileSync(srcPath, "utf8");
    const bytes = Buffer.byteLength(raw, "utf8");
    const slug = workflowSlug(fileName);

    const result = extractFromJsonText(raw);
    if (!result.ok) {
      console.warn(`  ✗ ${fileName}: ${result.reason}`);
      processed.push({
        fileName,
        slug,
        bytes,
        ok: false,
        reason: result.reason,
      });
      continue;
    }

    if (!args.dryRun) {
      const destPath = join(rawDir, `${slug}.json`);
      writeFileSync(destPath, raw, "utf8");
    }

    const rawPath = `${WORKFLOW_RAW_DIR}/${slug}.json`;
    const upsert = upsertExtraction(index, slug, {
      fileName,
      rawPath,
      fileSize: bytes,
      extracted: result.metadata,
    });

    processed.push({
      fileName,
      slug,
      bytes,
      ok: true,
      sectionId: upsert.sectionId,
      found: upsert.found,
    });

    const tag = upsert.found ? "matched" : "new";
    console.log(
      `  ✓ ${fileName} → ${slug} (${tag} ${upsert.sectionId ?? "?"}, ` +
        `${result.metadata.nodeCount} nodes, ${result.metadata.tags.join("/") || "no tags"})`
    );
  }

  if (!args.dryRun) {
    writeWorkflowsIndex(index, cwd);
  }

  // Summary.
  const okCount = processed.filter((p) => p.ok).length;
  const failCount = processed.length - okCount;
  const newCount = processed.filter((p) => p.ok && !p.found).length;
  const matchedCount = processed.filter((p) => p.ok && p.found).length;

  console.log("");
  console.log("[import-n8n] summary");
  console.log(`  parsed ok:  ${okCount}`);
  console.log(`  parse fail: ${failCount}`);
  console.log(`  matched to existing section: ${matchedCount}`);
  console.log(`  added to Imports/today:      ${newCount}`);
  if (args.dryRun) {
    console.log("  (dry run — no files written, index not saved)");
  } else {
    console.log(`  raw JSONs in:  ${WORKFLOW_RAW_DIR}/`);
    console.log(`  index updated: content/admin/workflows.json`);
  }

  if (failCount > 0) {
    console.log("");
    console.log("[import-n8n] failures:");
    for (const p of processed) {
      if (!p.ok) console.log(`  ${basename(p.fileName)}: ${p.reason}`);
    }
    process.exit(1);
  }
}

main();
