// Full Nexus data for Tennyson's tooling universe
// Covers all real repos, forks, identified gaps, must-have tools, and the new product

export type NodeKind = "real" | "fork" | "ghost";
export type Priority = "high" | "medium" | "low";

export type ActionKind =
  | "copy-prompt"
  | "open-url"
  | "copy-commands"
  | "view-steps";

export interface NodeAction {
  kind: ActionKind;
  label: string;
  payload: string;
}

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
  actions?: NodeAction[];
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
    priority: "high",
    actions: [
      { kind: "view-steps", label: "See v1.0 build plan", payload: "# Building v1.0 of the onboarding product\n\nThis node represents the product you're currently building. The full build plan lives in:\n\n- Admin → The Plan tab (strategic overview)\n- Admin → Content Schedule tab (week-by-week tasks)\n- Admin → Locked Decisions tab (decisions that are final)\n\n## Current status\n\nCheck the Content Schedule tab for what's in progress, what's blocked, and what's next.\n\n## If you're losing steam\n\nRead the Locked Decisions tab. The decisions are made. You are not re-deciding whether to build this. You are executing the build." },
    ] },
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
    priority: "high",
    actions: [
      { kind: "copy-prompt", label: "Copy Claude Code setup prompt", payload: "I want to sync my ~/.claude folder between my Mac mini and my laptop so my CLAUDE.md, skills, and custom commands are the same on both machines. Walk me through: 1) creating a private GitHub repo called 'claude-config', 2) moving ~/.claude into that repo, 3) setting up the sync so that 'claude pull' before work and 'claude push' after work becomes my habit, 4) handling the case where both machines made changes. Also suggest a shell alias to make this frictionless." },
      { kind: "view-steps", label: "See manual walkthrough", payload: "# Syncing .claude across Macs\n\n## What you're solving\n\nRight now, if you configure Claude Code on your Mac mini, your laptop doesn't benefit. This fixes that permanently.\n\n## Steps\n\n1. On your primary Mac (the one with the most up-to-date .claude folder), open Terminal\n2. `cd ~/.claude && git init`\n3. Create a new private repo on GitHub called 'claude-config'\n4. `git remote add origin [YOUR_REPO_URL]`\n5. `git add . && git commit -m 'initial'`\n6. `git push -u origin main`\n7. On your other Mac: `cd ~ && mv .claude .claude-backup` (just in case)\n8. `git clone [YOUR_REPO_URL] .claude`\n9. Test by opening Claude Code on the second Mac and confirming your CLAUDE.md is there\n\n## Daily habit\n\nAt session start on either machine: `cd ~/.claude && git pull`\nAt session end: `cd ~/.claude && git add . && git commit -m 'updates' && git push`\n\nA shell alias makes this one command. Ask Claude Code to help you set one up." },
    ] },
  { id: "env-sync", label: ".env secret sync", domain: "sync", kind: "ghost", weight: 4,
    desc: "API keys moved from scattered notes into 1Password dev-secrets vault. Labels per project.",
    priority: "high",
    actions: [
      { kind: "view-steps", label: "See setup walkthrough", payload: "# Setting up .env sync via 1Password\n\n## What you're solving\n\nWhen you clone a project on your laptop that you set up on your Mac mini, it won't run because .env files aren't in GitHub (correctly). This fixes that.\n\n## Steps\n\n1. Install 1Password if you haven't (see the 1Password node for that)\n2. Create a vault called 'Dev Secrets'\n3. For each project with a .env file:\n   a. Open the .env file in your editor\n   b. Copy the entire contents\n   c. In 1Password, create a new Secure Note\n   d. Title it exactly 'projectname.env' (replace projectname)\n   e. Paste the contents into the note body\n4. When setting up that project on another machine:\n   a. Clone the repo\n   b. Open the 1Password note\n   c. Create a new .env file in the project root\n   d. Paste the contents\n\n## Why this is the right shape\n\nYou can't put API keys in GitHub. You shouldn't email them to yourself. You shouldn't Slack them to yourself. 1Password gives you a secure, searchable, synced home for them." },
    ] },
  { id: "version-mgr", label: "mise (Node/Python)", domain: "sync", kind: "ghost", weight: 2,
    desc: "Version manager so 'works on Mac mini' equals 'works on laptop'. Matters especially for Utah Forage Map (Python + Node).",
    priority: "medium" },

  // ===========================================================
  // MUST-HAVE TOOLS (things you don't use yet that would change your day)
  // ===========================================================
  { id: "cursor", label: "Cursor", domain: "must-have", kind: "ghost", weight: 5,
    desc: "AI-first visual code editor. The missing piece for 'seeing what's happening' you mentioned. Complements Claude Code, doesn't replace it.",
    priority: "high",
    actions: [
      { kind: "open-url", label: "Open Cursor download", payload: "https://cursor.sh" },
      { kind: "copy-prompt", label: "Copy post-install prompt", payload: "I just installed Cursor. Walk me through: 1) signing in with my Claude/Anthropic account, 2) opening my existing project at [PATH], 3) enabling the AI features, and 4) running my first AI-assisted edit. Assume I've never used Cursor before." },
    ] },
  { id: "1password", label: "1Password", domain: "must-have", kind: "ghost", weight: 4,
    desc: "Secrets manager for all your API keys. Supabase, Vercel, Stripe, Mapbox, Auth0, Anthropic, Base44. Highest-leverage tool on this list.",
    priority: "high",
    actions: [
      { kind: "open-url", label: "Open 1Password signup", payload: "https://1password.com/sign-up" },
      { kind: "view-steps", label: "See setup walkthrough", payload: "# Setting up 1Password for your dev secrets\n\n1. Sign up for a personal account ($2.99/month as of last check)\n2. Install the Mac app and browser extension\n3. Create a new vault called 'Dev Secrets'\n4. For each project, create a Secure Note titled 'projectname.env'\n5. Paste the contents of that project's .env file into the note\n6. When setting up a repo on your other machine, open the note and copy the contents into a new .env file\n\n## Why this matters\n\nAPI keys and secrets should never go into GitHub. 1Password gives you a sync mechanism between your Mac mini and laptop that's secure and effortless." },
    ] },
  { id: "claude-projects", label: "Claude Projects", domain: "must-have", kind: "ghost", weight: 4,
    desc: "The Projects feature inside claude.ai. Folders with persistent context. Upload CONTEXT.md once, every chat has it.",
    priority: "high",
    actions: [
      { kind: "open-url", label: "Open Claude Projects", payload: "https://claude.ai/projects" },
      { kind: "view-steps", label: "See how to set up a Project", payload: "# Setting up a Claude Project for your flagship app\n\n## Steps\n\n1. Go to claude.ai and click Projects in the sidebar\n2. Click 'Create Project'\n3. Name it after your flagship (e.g. 'Geck Inspect')\n4. In the Project Knowledge section, upload:\n   - Your CLAUDE.md file\n   - Your README.md\n   - Any DECISIONS.md or ARCHITECTURE.md you have\n   - Screenshots of current app screens if relevant\n5. In the Custom Instructions, paste the system prompt your CLAUDE.md uses\n6. Start new chats within that project instead of fresh chats for project-related work\n\n## Why this matters\n\nEvery new chat outside a project starts Claude from zero. Every chat inside the project has instant context. For active projects, this is a 10x difference in chat quality with zero ongoing effort." },
    ] },
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
    priority: "high",
    actions: [
      { kind: "copy-prompt", label: "Copy README generator prompt", payload: "For each repo in my GitHub that has an empty description or a stub README, generate a proper README.md. Include: 1) one-sentence project description, 2) tech stack, 3) how to run locally, 4) deployment URL if any, 5) known issues or TODOs. Ask me for context on each repo before writing. The repos needing this work are: [LIST THEM OR SAY 'check my GitHub and tell me which ones']." },
    ] },
  { id: "claude-md-per", label: "Per-project CLAUDE.md", domain: "docs", kind: "ghost", weight: 4,
    desc: "Each real project should have its own CLAUDE.md layered on top of your global one. Huge quality boost for every Claude Code session.",
    priority: "high",
    actions: [
      { kind: "copy-prompt", label: "Copy CLAUDE.md generator prompt", payload: "Create a CLAUDE.md at the root of this project. This file is read by Claude Code at the start of every session. Include sections: Project (one-sentence what and who), Tech Stack (list), Conventions (naming, structure, state patterns), Known Gotchas (things I've already hit and fixed), What NOT to do (rejected approaches), Current Focus (what I'm working on right now). Keep it under 100 lines. Ask me the questions you need to fill this out." },
    ] },
  { id: "context-md", label: "CONTEXT.md", domain: "docs", kind: "ghost", weight: 2,
    desc: "Business context (who, problem, why now). Worth writing for top 2-3 projects only. Skip for forks and experiments.",
    priority: "medium",
    actions: [
      { kind: "copy-prompt", label: "Copy CONTEXT.md generator prompt", payload: "Create a CONTEXT.md for this project that captures the non-technical context Claude should know. Include: who the user is, what problem this solves, why this matters now, what success looks like, and any domain-specific knowledge Claude should wear. Interview me through these sections rather than guessing." },
    ] },
  { id: "decisions-md", label: "DECISIONS.md", domain: "docs", kind: "ghost", weight: 2,
    desc: "Running log of chosen paths with rationale. High value for geck-inspect post Base44-migration.",
    priority: "medium",
    actions: [
      { kind: "copy-prompt", label: "Copy DECISIONS.md starter prompt", payload: "Create a DECISIONS.md for this project. Format: each entry has a date, a decision, alternatives considered, and the reason chosen. Make the first entry about the Base44-to-Supabase migration (I made that decision because of X, alternatives were Y and Z). Then make a second entry about the current tech stack choice. Going forward, I'll append to this file whenever I make a significant technical decision so I don't relitigate them." },
    ] },
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
