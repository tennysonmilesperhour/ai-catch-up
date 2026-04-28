// Read + upsert helpers for /content/admin/workflows.json. Used by the
// import script (filesystem) and the API route (after a GitHub fetch).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { ExtractedMetadata } from "@/lib/workflow-extract";

export type WorkflowFile = {
  slug: string;
  fileName: string;
  type: string; // mime type, e.g. "application/json" or "application/pdf"
  sourceUrl: string | null;
  fileSize: number | null;
  status: "pending" | "imported" | "skipped";
  /** Repo-relative path to the raw bytes, once imported. */
  rawPath: string | null;
  extracted: ExtractedMetadata | null;
};

export type Section = {
  /** Stable id used as URL slug, e.g. "gamma-proposals-2026-01-19". */
  id: string;
  name: string;
  /** ISO-ish "YYYY-MM-DD". */
  date: string;
  files: WorkflowFile[];
};

export type WorkflowsIndex = {
  version: 1;
  updatedAt: string;
  sections: Section[];
};

const INDEX_PATH = "content/admin/workflows.json";

export function workflowsIndexAbsPath(cwd: string = process.cwd()): string {
  return join(cwd, INDEX_PATH);
}

export function readWorkflowsIndex(cwd: string = process.cwd()): WorkflowsIndex {
  const path = workflowsIndexAbsPath(cwd);
  if (!existsSync(path)) {
    return { version: 1, updatedAt: new Date().toISOString(), sections: [] };
  }
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as WorkflowsIndex;
  return parsed;
}

export function writeWorkflowsIndex(
  index: WorkflowsIndex,
  cwd: string = process.cwd()
): void {
  const path = workflowsIndexAbsPath(cwd);
  const next: WorkflowsIndex = {
    ...index,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(path, JSON.stringify(next, null, 2) + "\n", "utf8");
}

export type UpsertResult = {
  index: WorkflowsIndex;
  found: boolean;
  sectionId: string | null;
  fileSlug: string;
};

/**
 * Upsert a workflow file's extracted metadata into the index, in-place.
 * Strategy:
 *   1. If a file with this slug already exists in any section, update it.
 *   2. Else if a `targetSectionId` is supplied and that section exists,
 *      append a new file row into that section.
 *   3. Else create a synthetic "Imports / <today>" section for it.
 */
export function upsertExtraction(
  index: WorkflowsIndex,
  fileSlug: string,
  payload: {
    fileName: string;
    rawPath: string;
    fileSize: number;
    extracted: ExtractedMetadata;
    targetSectionId?: string;
  }
): UpsertResult {
  for (const section of index.sections) {
    const file = section.files.find((f) => f.slug === fileSlug);
    if (file) {
      file.fileName = payload.fileName;
      file.rawPath = payload.rawPath;
      file.fileSize = payload.fileSize;
      file.status = "imported";
      file.extracted = payload.extracted;
      file.type = "application/json";
      return { index, found: true, sectionId: section.id, fileSlug };
    }
  }

  // Not found by slug. Decide where to put a new row.
  let targetId = payload.targetSectionId ?? null;
  let target = targetId
    ? index.sections.find((s) => s.id === targetId) ?? null
    : null;

  if (!target) {
    const today = new Date().toISOString().slice(0, 10);
    targetId = `imports-${today}`;
    target = index.sections.find((s) => s.id === targetId) ?? null;
    if (!target) {
      target = {
        id: targetId,
        name: "Imports",
        date: today,
        files: [],
      };
      index.sections.unshift(target);
    }
  }

  target.files.push({
    slug: fileSlug,
    fileName: payload.fileName,
    type: "application/json",
    sourceUrl: null,
    fileSize: payload.fileSize,
    status: "imported",
    rawPath: payload.rawPath,
    extracted: payload.extracted,
  });

  return { index, found: false, sectionId: targetId, fileSlug };
}

/** Flatten the index into a single chronologically-sorted file list. */
export function listImportedFiles(index: WorkflowsIndex): Array<
  WorkflowFile & { sectionId: string; sectionName: string; sectionDate: string }
> {
  const out: Array<
    WorkflowFile & {
      sectionId: string;
      sectionName: string;
      sectionDate: string;
    }
  > = [];
  for (const s of index.sections) {
    for (const f of s.files) {
      out.push({
        ...f,
        sectionId: s.id,
        sectionName: s.name,
        sectionDate: s.date,
      });
    }
  }
  return out;
}

export const WORKFLOW_RAW_DIR = "content/workflows";
export const WORKFLOWS_INDEX_PATH = INDEX_PATH;
