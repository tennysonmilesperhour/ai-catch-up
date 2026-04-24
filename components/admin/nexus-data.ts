// SAMPLE NEXUS DATA for v1.0.
// This is placeholder data so the graph has something to render. Real node
// and domain content is owned by Strategy Claude and will arrive via
// HANDOFF.md with an instruction to replace this file.

export type Domain = {
  id: string;
  label: string;
  color: string;
  x: number; // anchor x (0..1 relative to viewport width)
  y: number; // anchor y (0..1 relative to viewport height)
};

export type GraphNode = {
  id: string;
  label: string;
  domain: string;
  type: "real" | "ghost";
  priority?: "high" | "normal";
  summary?: string;
};

export type GraphLink = {
  source: string;
  target: string;
  strength: number; // 0..1
};

export const domains: Domain[] = [
  { id: "foundations", label: "Foundations", color: "#d97757", x: 0.2, y: 0.2 },
  { id: "tools", label: "Tools", color: "#c96442", x: 0.5, y: 0.15 },
  { id: "workflow", label: "Workflow", color: "#a8653f", x: 0.8, y: 0.22 },
  { id: "prompts", label: "Prompts", color: "#8a7f6b", x: 0.85, y: 0.55 },
  { id: "debugging", label: "Debugging", color: "#5c5248", x: 0.7, y: 0.82 },
  { id: "shipping", label: "Shipping", color: "#6b5a4c", x: 0.35, y: 0.85 },
  { id: "mindset", label: "Mindset", color: "#9a7a5c", x: 0.12, y: 0.7 },
  { id: "people", label: "People", color: "#b88a6a", x: 0.1, y: 0.45 },
];

export const nodes: GraphNode[] = [
  {
    id: "n1",
    label: "Pick one tool",
    domain: "foundations",
    type: "real",
    summary: "Do not shop models for weeks. Pick one and ship something.",
  },
  {
    id: "n2",
    label: "Daily reps",
    domain: "foundations",
    type: "real",
    summary: "Use it every day for 30 minutes. Reps beat reading.",
  },
  {
    id: "n3",
    label: "Context is the product",
    domain: "foundations",
    type: "real",
    summary: "Good context in, good work out. Learn to feed context well.",
  },
  {
    id: "n4",
    label: "Claude Code",
    domain: "tools",
    type: "real",
    summary: "CLI coding agent from Anthropic.",
  },
  {
    id: "n5",
    label: "Cursor",
    domain: "tools",
    type: "real",
    summary: "IDE-integrated coding assistant.",
  },
  {
    id: "n6",
    label: "ChatGPT",
    domain: "tools",
    type: "real",
  },
  {
    id: "n7",
    label: "Batching tasks",
    domain: "workflow",
    type: "real",
    summary: "Group similar tasks. Context switching kills throughput.",
  },
  {
    id: "n8",
    label: "Morning plan",
    domain: "workflow",
    type: "real",
    summary: "One 10-minute planning conversation sets the whole day.",
  },
  {
    id: "n9",
    label: "Plan, code, review",
    domain: "workflow",
    type: "ghost",
    priority: "high",
    summary: "A three-stage flow to avoid rework. Coming in v1.1.",
  },
  {
    id: "n10",
    label: "Prompt patterns",
    domain: "prompts",
    type: "real",
    summary: "Reusable prompt shapes that save time.",
  },
  {
    id: "n11",
    label: "System prompts",
    domain: "prompts",
    type: "real",
  },
  {
    id: "n12",
    label: "Evals",
    domain: "prompts",
    type: "ghost",
    priority: "normal",
    summary: "Lightweight evaluation loop for your prompts.",
  },
  {
    id: "n13",
    label: "Reading errors",
    domain: "debugging",
    type: "real",
    summary: "Paste the whole error. Do not paraphrase.",
  },
  {
    id: "n14",
    label: "Binary search",
    domain: "debugging",
    type: "real",
  },
  {
    id: "n15",
    label: "Vercel deploys",
    domain: "shipping",
    type: "real",
    summary: "Git push and you are live.",
  },
  {
    id: "n16",
    label: "Env vars",
    domain: "shipping",
    type: "real",
  },
  {
    id: "n17",
    label: "Staying curious",
    domain: "mindset",
    type: "real",
    summary: "Assume the tool can do more than you think.",
  },
  {
    id: "n18",
    label: "Ignoring hype",
    domain: "mindset",
    type: "real",
  },
  {
    id: "n19",
    label: "Teaching the team",
    domain: "people",
    type: "real",
    summary: "Your real leverage is making others faster.",
  },
  {
    id: "n20",
    label: "Office hours",
    domain: "people",
    type: "ghost",
    priority: "high",
    summary: "Weekly 30 minutes of group Q&A. Coming in v1.1.",
  },
];

export const links: GraphLink[] = [
  { source: "n1", target: "n2", strength: 0.9 },
  { source: "n2", target: "n3", strength: 0.8 },
  { source: "n1", target: "n4", strength: 0.5 },
  { source: "n4", target: "n5", strength: 0.7 },
  { source: "n4", target: "n6", strength: 0.5 },
  { source: "n7", target: "n8", strength: 0.8 },
  { source: "n8", target: "n9", strength: 0.6 },
  { source: "n10", target: "n11", strength: 0.9 },
  { source: "n11", target: "n12", strength: 0.6 },
  { source: "n3", target: "n10", strength: 0.5 },
  { source: "n13", target: "n14", strength: 0.7 },
  { source: "n14", target: "n4", strength: 0.3 },
  { source: "n15", target: "n16", strength: 0.8 },
  { source: "n7", target: "n15", strength: 0.4 },
  { source: "n17", target: "n18", strength: 0.7 },
  { source: "n19", target: "n20", strength: 0.7 },
  { source: "n17", target: "n19", strength: 0.5 },
  { source: "n1", target: "n17", strength: 0.4 },
  { source: "n3", target: "n11", strength: 0.6 },
  { source: "n8", target: "n10", strength: 0.4 },
];
