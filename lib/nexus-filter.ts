import type { NexusNode } from "@/components/admin/Nexus";

export type NexusFilter =
  | "everything"
  | "have"
  | "missing"
  | "sync-tools";

export const FILTER_OPTIONS: { value: NexusFilter; label: string }[] = [
  { value: "everything", label: "Everything" },
  { value: "have", label: "What I have" },
  { value: "missing", label: "What's missing" },
  { value: "sync-tools", label: "Sync and tools only" },
];

export function filterMatches(filter: NexusFilter, n: NexusNode): boolean {
  if (filter === "everything") return true;
  if (filter === "have") return n.kind === "real";
  if (filter === "missing") return n.kind === "ghost";
  if (filter === "sync-tools")
    return n.domain === "sync" || n.domain === "must-have";
  return true;
}
