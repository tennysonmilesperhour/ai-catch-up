// Full Nexus data for Tennyson's tooling universe
// Covers all real repos, forks, identified gaps, must-have tools, and the new product

export type NodeKind = "real" | "fork" | "ghost";
export type Priority = "high" | "medium" | "low";

export interface NexusNode {
  id: string;
  label: string;
  domain: string;
  kind: NodeKind;
  weight: number;
  desc: string;
  priority?: Priority;
  deployed?: boolean;
  github?: string;
  homepage?: string;
}

export interface NexusLink {
  source: string;
  target: string;
  strength: number;
}

export interface Domain {
  label: string;
  color: string;
  anchor: { x: number; y: number };
  note: string;
}

export const NEXUS_NODES: NexusNode[] = [
  // ===========================================================
  // CORE (the missing center of gravity)
  // ===========================================================
  { id: "global-memory", label: "Global Memory", domain: "core", kind: "ghost", weight: 6,
    desc: "The center of gravity that doesn't exist yet. A shared memory store every web-app project would talk to. memory-palace is the candidate to fill this.",
    priority: "high" },

  // ===========================================================
  // YOUR APPS (original work)
  // ===========================================================
  { id: "geck-inspect", label: "geck-inspect", domain: "apps", kind: "real", weight: 5,
    desc: "Crested gecko breeding and collection management. Your flagship. Also the demo example for the new product.",
    deployed: true, github: "geck-inspect", homepage: "https://geck-inspect.vercel.app" },
  { id: "geck-data", label: "geck-data", domain: "apps", kind: "real", weight: 3,
    desc: "Geck Inspect data layer. No README yet - that's a gap.",
    deployed: true, github: "geck-data", homepage: "https://geck-data.vercel.app" },
  { id: "i-ching-app", label: "i-ching-app", domain: "apps", kind: "real", weight: 3,
    desc: "Simple I Ching app. Migrated from Base44.",
    deployed: true, github: "i-ching-app", homepage: "https://i-ching-app-rosy.vercel.app" },
  { id: "utah-forage-map", label: "utah-forage-map", domain: "apps", kind: "real", weight: 3,
    desc: "Collaborative mushroom foraging map for Utah. Frontend live, backend not deployed yet.",
    deployed: true, github: "utah-forage-map", homepage: "https://utah-forage-map.vercel.app" },
  { id: "eyeinthesky", label: "eyeinthesky", domain: "apps", kind: "real", weight: 2,
    desc: "Gecko Market Data Grabber Chrome Plugin.",
    github: "eyeinthesky" },

  // Ghost apps (things that should exist but don't, or new)
  { id: "this-product", label: "The Onboarding Product", domain: "apps", kind: "ghost", weight: 5,
    desc: "The v1.0 you're building right now. Sits at the center of everything else.",
    priority: "high" },
  { id: "creditrepair", label: "CreditRepair.works", domain: "apps", kind: "ghost", weight: 4,
    desc: "Landing page exists on disk but no GitHub repo or deployment yet.",
    priority: "high" },
  { id: "evil-brian", label: "Evil Brian Johnson IG", domain: "apps", kind: "ghost", weight: 2,
    desc: "Instagram philosophical counter-persona concept. Content not code - may not belong on GitHub.",
    priority: "low" },
  { id: "contact-lens", label: "Contact Lens Research", domain: "apps", kind: "ghost", weight: 2,
    desc: "Switchable blue-light-blocking contact lens concept. Research notes, outreach emails, cost estimates.",
    priority: "low" },

  // ===========================================================
  // AI INFRASTRUCTURE (forks of AI systems)
  // ===========================================================
  { id: "memory-palace", label: "memory-palace", domain: "ai-infra", kind: "fork", weight: 3,
    desc: "Best-benchmarked open-source AI memory system.",
    github: "memory-palace", homepage: "http://mempalaceofficial.com/" },
  { id: "GeckNexus", label: "GeckNexus", domain: "ai-infra", kind: "fork", weight: 3,
    desc: "GitNexus fork - browser-based code knowledge graph with built-in Graph RAG agent.",
    github: "GeckNexus", homepage: "https://gitnexus.vercel.app" },
  { id: "ai-boardroom", label: "ai-boardroom", domain: "ai-infra", kind: "fork", weight: 2,
    desc: "Multi-agent corporate simulation with real-time Jarvis Voice Widget.",
    github: "ai-boardroom", homepage: "https://ai-boardroom-nine.vercel.app" },

  // ===========================================================
  // CLAUDE CODE WORKFLOW (forks improving how you work with Claude)
  // ===========================================================
  { id: "claude-behave", label: "claude-behave", domain: "claude-workflow", kind: "fork", weight: 2,
    desc: "Single CLAUDE.md derived from Andrej Karpathy's observations on LLM coding pitfalls.",
    github: "claude-behave" },
  { id: "everything-claude-code", label: "everything-claude-code", domain: "claude-workflow", kind: "fork", weight: 3,
    desc: "Agent harness performance optimization: skills, instincts, memory, security, research-first development.",
    github: "everything-claude-code", homepage: "https://ecc.tools" },
  { id: "lean-geck", label: "lean-geck", domain: "claude-workflow", kind: "fork", weight: 3,
    desc: "Reduces AI coding costs via MCP server and shell hook. Works across Cursor, Claude Code, Copilot, Windsurf, Gemini CLI.",
    github: "lean-geck", homepage: "https://leanctx.com" },
  { id: "awesome-design-md", label: "awesome-design-md", domain: "claude-workflow", kind: "fork", weight: 2,
    desc: "Collection of DESIGN.md files inspired by popular brand design systems. Drop one in and agents generate matching UI.",
    github: "awesome-design-md" },
  { id: "seomachine", label: "seomachine-contentcreator", domain: "claude-workflow", kind: "fork", weight: 2,
    desc: "Claude Code workspace for long-form SEO-optimized blog content.",
    github: "seomachine-contentcreator", homepage: "https://seomachine.io" },

  // ===========================================================
  // EXPERIMENTAL ML (heavy forks, aspirational)
  // ===========================================================
  { id: "lingbot-map", label: "lingbot-map", domain: "experimental", kind: "fork", weight: 2,
    desc: "Feed-forward 3D foundation model for reconstructing scenes from streaming data. 352MB. Unclear integration path.",
    github: "lingbot-map" },
  { id: "GeckSwarm", label: "GeckSwarm", domain: "experimental", kind: "fork", weight: 2,
    desc: "Swarm intelligence engine for prediction. Python.",
    github: "GeckSwarm", homepage: "https://mirofish.ai" },
  { id: "geckpredict", label: "geckpredict", domain: "experimental", kind: "fork", weight: 2,
    desc: "Google TimesFM - pretrained time-series foundation model for forecasting.",
    github: "geckpredict" },

  // ===========================================================
  // LIBRARIES (general-purpose utility forks)
  // ===========================================================
  { id: "data-visualization", label: "data-visualization", domain: "libraries", kind: "fork", weight: 2,
    desc: "D3.js - bring data to life with SVG, Canvas, HTML.",
    github: "data-visualization", homepage: "https://d3js.org" },
  { id: "geckcrawl", label: "geckcrawl", domain: "libraries", kind: "fork", weight: 2,
    desc: "Crawl4AI - open-source LLM-friendly web crawler and scraper.",
    github: "geckcrawl", homepage: "https://crawl4ai.com" },
  { id: "CooLoom", label: "CooLoom", domain: "libraries", kind: "fork", weight: 2,
    desc: "Cap.so fork - open source Loom alternative for screen recordings.",
    github: "CooLoom", homepage: "https://cap.so" },

  // ===========================================================
  // SECURITY
  // ===========================================================
  { id: "safe-chain", label: "safe-chain-aikido", domain: "security", kind: "fork", weight: 2,
    desc: "Protects against malicious npm, yarn, pnpm, pip, uv, poetry packages. Free, no tokens required.",
    github: "safe-chain-aikido-security", homepage: "https://www.aikido.dev" },

  // ===========================================================
  // SYNC GAPS (missing infrastructure between your two Macs)
  // ===========================================================
  { id: "claude-sync", label: ".claude sync", domain: "sync", kind: "ghost", weight: 4,
    desc: "Sync ~/.claude folder between Mac mini and laptop via private GitHub repo. Highest-leverage 30 minutes you could spend.",
    priority: "high" },
  { id: "env-sync", label: ".env secret sync", domain: "sync", kind: "ghost", weight: 4,
    desc: "API keys moved from scattered notes into 1Password dev-secrets vault. Labels per project.",
    priority: "high" },
  { id: "version-mgr", label: "mise (Node/Python)", domain: "sync", kind: "ghost", weight: 2,
    desc: "Version manager so 'works on Mac mini' equals 'works on laptop'. Matters especially for Utah Forage Map (Python + Node).",
    priority: "medium" },

  // ===========================================================
  // MUST-HAVE TOOLS (things you don't use yet that would change your day)
  // ===========================================================
  { id: "cursor", label: "Cursor", domain: "must-have", kind: "ghost", weight: 5,
    desc: "AI-first visual code editor. The missing piece for 'seeing what's happening' you mentioned. Complements Claude Code, doesn't replace it.",
    priority: "high" },
  { id: "1password", label: "1Password", domain: "must-have", kind: "ghost", weight: 4,
    desc: "Secrets manager for all your API keys. Supabase, Vercel, Stripe, Mapbox, Auth0, Anthropic, Base44. Highest-leverage tool on this list.",
    priority: "high" },
  { id: "claude-projects", label: "Claude Projects", domain: "must-have", kind: "ghost", weight: 4,
    desc: "The Projects feature inside claude.ai. Folders with persistent context. Upload CONTEXT.md once, every chat has it.",
    priority: "high" },
  { id: "raycast", label: "Raycast", domain: "must-have", kind: "ghost", weight: 3,
    desc: "Spotlight replacement with AI integration and clipboard history. Free for personal use.",
    priority: "medium" },
  { id: "notion", label: "Notion", domain: "must-have", kind: "ghost", weight: 3,
    desc: "Task tracking across your many projects. Flexible enough for CreditRepair.works business work AND code tasks in one place.",
    priority: "medium" },
  { id: "obsidian", label: "Obsidian", domain: "must-have", kind: "ghost", weight: 2,
    desc: "Local-first markdown notes with links. Good for your philosophical, interconnected way of thinking. Claude can read the files.",
    priority: "medium" },
  { id: "bruno", label: "Bruno", domain: "must-have", kind: "ghost", weight: 2,
    desc: "API testing tool, local-first, Git-friendly. Better than ad-hoc curl commands when testing Supabase endpoints or Stripe webhooks.",
    priority: "medium" },

  // ===========================================================
  // DOCUMENTATION (per-project markdown files)
  // ===========================================================
  { id: "readmes", label: "READMEs", domain: "docs", kind: "ghost", weight: 3,
    desc: "Several repos have empty descriptions (geck-data, some forks). Fix these first. AI tools read READMEs for context.",
    priority: "high" },
  { id: "claude-md-per", label: "Per-project CLAUDE.md", domain: "docs", kind: "ghost", weight: 4,
    desc: "Each real project should have its own CLAUDE.md layered on top of your global one. Huge quality boost for every Claude Code session.",
    priority: "high" },
  { id: "context-md", label: "CONTEXT.md", domain: "docs", kind: "ghost", weight: 2,
    desc: "Business context (who, problem, why now). Worth writing for top 2-3 projects only. Skip for forks and experiments.",
    priority: "medium" },
  { id: "decisions-md", label: "DECISIONS.md", domain: "docs", kind: "ghost", weight: 2,
    desc: "Running log of chosen paths with rationale. High value for geck-inspect post Base44-migration.",
    priority: "medium" },
];

export const NEXUS_LINKS: NexusLink[] = [
  // Web apps orbit the missing Global Memory core
  { source: "global-memory", target: "geck-inspect", strength: 0.5 },
  { source: "global-memory", target: "geck-data", strength: 0.4 },
  { source: "global-memory", target: "i-ching-app", strength: 0.4 },
  { source: "global-memory", target: "utah-forage-map", strength: 0.4 },
  { source: "global-memory", target: "this-product", strength: 0.5 },
  { source: "global-memory", target: "creditrepair", strength: 0.4 },

  // Geck Inspect ecosystem (the gravity center)
  { source: "geck-inspect", target: "geck-data", strength: 0.9 },
  { source: "geck-inspect", target: "eyeinthesky", strength: 0.7 },
  { source: "geck-inspect", target: "geckcrawl", strength: 0.4 },
  { source: "geck-inspect", target: "GeckSwarm", strength: 0.3 },
  { source: "geck-inspect", target: "geckpredict", strength: 0.3 },
  { source: "geck-inspect", target: "GeckNexus", strength: 0.3 },
  { source: "geck-inspect", target: "this-product", strength: 0.8 },

  // Utah Forage uses crawler
  { source: "utah-forage-map", target: "geckcrawl", strength: 0.5 },
  { source: "utah-forage-map", target: "version-mgr", strength: 0.4 },

  // The new product connects to things that enable it
  { source: "this-product", target: "creditrepair", strength: 0.3 },
  { source: "this-product", target: "seomachine", strength: 0.4 },
  { source: "this-product", target: "everything-claude-code", strength: 0.5 },
  { source: "this-product", target: "lean-geck", strength: 0.4 },
  { source: "this-product", target: "claude-behave", strength: 0.4 },
  { source: "this-product", target: "awesome-design-md", strength: 0.3 },
  { source: "this-product", target: "CooLoom", strength: 0.4 },

  // Claude workflow tools cluster around themselves
  { source: "claude-behave", target: "everything-claude-code", strength: 0.6 },
  { source: "everything-claude-code", target: "lean-geck", strength: 0.5 },
  { source: "awesome-design-md", target: "geck-inspect", strength: 0.3 },
  { source: "seomachine", target: "creditrepair", strength: 0.6 },

  // AI infra connections
  { source: "memory-palace", target: "global-memory", strength: 0.7 },
  { source: "memory-palace", target: "ai-boardroom", strength: 0.4 },
  { source: "memory-palace", target: "GeckNexus", strength: 0.4 },
  { source: "GeckNexus", target: "data-visualization", strength: 0.4 },

  // Sync gaps reach toward all the real apps they would unblock
  { source: "claude-sync", target: "geck-inspect", strength: 0.6 },
  { source: "claude-sync", target: "i-ching-app", strength: 0.4 },
  { source: "claude-sync", target: "utah-forage-map", strength: 0.4 },
  { source: "claude-sync", target: "this-product", strength: 0.6 },
  { source: "env-sync", target: "geck-inspect", strength: 0.6 },
  { source: "env-sync", target: "utah-forage-map", strength: 0.5 },
  { source: "env-sync", target: "this-product", strength: 0.5 },

  // Must-haves reach toward projects they'd help
  { source: "cursor", target: "geck-inspect", strength: 0.5 },
  { source: "cursor", target: "utah-forage-map", strength: 0.5 },
  { source: "cursor", target: "i-ching-app", strength: 0.4 },
  { source: "cursor", target: "this-product", strength: 0.6 },
  { source: "1password", target: "env-sync", strength: 0.8 },
  { source: "claude-projects", target: "geck-inspect", strength: 0.5 },
  { source: "claude-projects", target: "creditrepair", strength: 0.5 },
  { source: "claude-projects", target: "this-product", strength: 0.6 },
  { source: "notion", target: "creditrepair", strength: 0.4 },
  { source: "notion", target: "evil-brian", strength: 0.5 },
  { source: "notion", target: "this-product", strength: 0.4 },
  { source: "obsidian", target: "contact-lens", strength: 0.5 },
  { source: "obsidian", target: "evil-brian", strength: 0.4 },
  { source: "bruno", target: "geck-inspect", strength: 0.4 },
  { source: "bruno", target: "utah-forage-map", strength: 0.3 },
  { source: "raycast", target: "geck-inspect", strength: 0.2 },

  // Documentation gaps connect to specific projects
  { source: "readmes", target: "geck-data", strength: 0.8 },
  { source: "readmes", target: "eyeinthesky", strength: 0.4 },
  { source: "claude-md-per", target: "geck-inspect", strength: 0.7 },
  { source: "claude-md-per", target: "utah-forage-map", strength: 0.5 },
  { source: "claude-md-per", target: "i-ching-app", strength: 0.4 },
  { source: "context-md", target: "geck-inspect", strength: 0.5 },
  { source: "context-md", target: "creditrepair", strength: 0.5 },
  { source: "decisions-md", target: "geck-inspect", strength: 0.7 },
  { source: "decisions-md", target: "this-product", strength: 0.5 },
];

export const DOMAINS: Record<string, Domain> = {
  "core": {
    label: "Core",
    color: "#c9a07a",
    anchor: { x: 0, y: 0 },
    note: "The missing center. Global memory that all web-app repos should orbit around."
  },
  "apps": {
    label: "Your Apps + Products",
    color: "#d97757",
    anchor: { x: 0, y: 0 },
    note: "Your own original work and the products you're building"
  },
  "ai-infra": {
    label: "AI Infrastructure",
    color: "#6b7a8f",
    anchor: { x: -380, y: -250 },
    note: "Forks of AI systems (memory, agents, knowledge graphs)"
  },
  "claude-workflow": {
    label: "Claude Workflow",
    color: "#8a7f6b",
    anchor: { x: 380, y: -250 },
    note: "Forks improving how you work with Claude Code"
  },
  "experimental": {
    label: "Experimental ML",
    color: "#7a6a8a",
    anchor: { x: -450, y: 180 },
    note: "Heavy ML forks with unclear integration path"
  },
  "libraries": {
    label: "Libraries",
    color: "#5c7a6b",
    anchor: { x: 450, y: 180 },
    note: "General-purpose utility tools"
  },
  "security": {
    label: "Security",
    color: "#8a6b6b",
    anchor: { x: 520, y: 0 },
    note: "Security and supply-chain tooling"
  },
  "sync": {
    label: "Sync Gaps",
    color: "#c96442",
    anchor: { x: -200, y: -380 },
    note: "Missing infrastructure between your Mac mini and laptop"
  },
  "must-have": {
    label: "Must-Have Tools",
    color: "#b08840",
    anchor: { x: 200, y: -380 },
    note: "Widely-adopted tools you haven't installed yet"
  },
  "docs": {
    label: "Documentation",
    color: "#7a8a6b",
    anchor: { x: 0, y: 380 },
    note: "Per-project markdown files that unlock better AI assistance"
  },
};
