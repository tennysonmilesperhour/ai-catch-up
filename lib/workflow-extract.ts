// n8n workflow JSON metadata extraction.
//
// Pure function — given the raw text of an exported n8n workflow JSON,
// returns a normalized metadata object. Used by:
//   - /scripts/import-n8n.ts (bulk Path B import)
//   - /app/api/admin/workflows/import/route.ts (paste-import Path A)
//
// The shape is intentionally rich. We pull node types, credential
// references, triggers, LLM model strings, HTTP hosts, sticky-note
// counts, and a small set of human-friendly tags derived from the
// node-type set. Callers can render whatever subset they care about.

export type ExtractedMetadata = {
  /** ISO timestamp when extraction ran. */
  extractedAt: string;
  /** Workflow name from the n8n export's top-level `name` field. */
  name: string;
  /** Whether the workflow is marked active in the export. */
  active: boolean;
  /** Total node count, including stickies. */
  nodeCount: number;
  /** Unique sorted list of node type identifiers. */
  nodeTypes: string[];
  /** Subset of nodeTypes that are triggers (manual, schedule, webhook, etc). */
  triggerTypes: string[];
  /** Unique sorted list of credential type keys referenced anywhere. */
  credentialTypes: string[];
  /** Best-effort list of LLM model names referenced in node parameters. */
  llmModels: string[];
  /** Unique hostnames pulled from any HTTP Request node's URL parameter. */
  httpHosts: string[];
  /** Webhook paths declared by webhook trigger nodes. */
  webhookPaths: string[];
  /** Count of n8n-nodes-base.stickyNote nodes (used as inline docs). */
  stickyNotesCount: number;
  /** Auto-derived complexity bucket. */
  complexity: "simple" | "medium" | "complex";
  /** Auto-derived human tags (AI, RAG, Email, Voice, Image, etc). */
  tags: string[];
  /** Total connection count across all nodes (rough graph density). */
  connectionCount: number;
  /** Number of distinct nodes that any other node connects to. */
  fanoutCount: number;
};

export type ExtractResult =
  | { ok: true; metadata: ExtractedMetadata }
  | { ok: false; reason: string };

type RawNode = {
  id?: string;
  name?: string;
  type?: string;
  parameters?: Record<string, unknown>;
  credentials?: Record<string, { id?: string; name?: string }>;
};

type RawWorkflow = {
  name?: string;
  active?: boolean;
  nodes?: RawNode[];
  connections?: Record<string, unknown>;
};

// Heuristic: anything ending in "Trigger" or containing the word
// "webhook" or "manualTrigger" counts. Covers schedule, manual,
// webhook, errorTrigger, executeWorkflowTrigger, telegramTrigger, etc.
function isTriggerType(t: string): boolean {
  const lower = t.toLowerCase();
  return (
    lower.endsWith("trigger") ||
    lower.includes("webhook") ||
    lower.includes("manualtrigger")
  );
}

const TAG_RULES: Array<{ tag: string; match: (lower: string) => boolean }> = [
  {
    tag: "AI",
    match: (l) =>
      l.includes("openai") ||
      l.includes("anthropic") ||
      l.includes("gemini") ||
      l.includes("groq") ||
      l.includes("ollama") ||
      l.includes("huggingface") ||
      l.includes("cohere") ||
      l.includes("agent") ||
      l.includes("lmchat") ||
      l.includes("llmchain") ||
      l.includes("langchain"),
  },
  {
    tag: "RAG",
    match: (l) =>
      l.includes("vectorstore") ||
      l.includes("pinecone") ||
      l.includes("qdrant") ||
      l.includes("weaviate") ||
      l.includes("chroma") ||
      l.includes("supabasevector") ||
      l.includes("documentloader") ||
      l.includes("textsplitter") ||
      l.includes("embeddings"),
  },
  {
    tag: "Memory",
    match: (l) =>
      l.includes("memory") || l.includes("zep") || l.includes("redis"),
  },
  {
    tag: "Email",
    match: (l) =>
      l.includes("gmail") ||
      l.includes("emailsend") ||
      l.includes("imap") ||
      l.includes("outlook") ||
      l.includes("mailerlite") ||
      l.includes("mailchimp"),
  },
  {
    tag: "Calendar",
    match: (l) =>
      l.includes("googlecalendar") || l.includes("outlookcalendar"),
  },
  {
    tag: "Voice",
    match: (l) =>
      l.includes("elevenlabs") ||
      l.includes("vapi") ||
      l.includes("openaiaudio") ||
      l.includes("whisper"),
  },
  {
    tag: "Video",
    match: (l) =>
      l.includes("heygen") ||
      l.includes("sora") ||
      l.includes("veo") ||
      l.includes("runway") ||
      l.includes("creatomate"),
  },
  {
    tag: "Image",
    match: (l) =>
      l.includes("openaiimage") ||
      l.includes("dalle") ||
      l.includes("stablediffusion") ||
      l.includes("nanobanana") ||
      l.includes("midjourney") ||
      l.includes("imagegen") ||
      l.includes("photoshop"),
  },
  {
    tag: "Scraping",
    match: (l) =>
      l.includes("firecrawl") ||
      l.includes("apify") ||
      l.includes("scrapfly") ||
      l.includes("browserless") ||
      l.includes("scraperapi"),
  },
  {
    tag: "Database",
    match: (l) =>
      l.includes("postgres") ||
      l.includes("mysql") ||
      l.includes("supabase") ||
      l.includes("mongo") ||
      l.includes("airtable") ||
      l.includes("notion"),
  },
  { tag: "Webhook", match: (l) => l.includes("webhook") },
  {
    tag: "Schedule",
    match: (l) => l.includes("scheduletrigger") || l.includes("cron"),
  },
  {
    tag: "Code",
    match: (l) =>
      l.endsWith(".code") ||
      l.endsWith(".function") ||
      l.endsWith(".functionitem"),
  },
  {
    tag: "Social",
    match: (l) =>
      l.includes("twitter") ||
      l.includes("linkedin") ||
      l.includes("instagram") ||
      l.includes("tiktok") ||
      l.includes("youtube") ||
      l.includes("slack") ||
      l.includes("discord") ||
      l.includes("telegram") ||
      l.includes("blotato"),
  },
  {
    tag: "Form",
    match: (l) =>
      l.includes("formtrigger") || l.includes("typeform") || l.includes("tally"),
  },
  {
    tag: "Storage",
    match: (l) =>
      l.includes("googledrive") ||
      l.includes("dropbox") ||
      l.includes("s3") ||
      l.includes("googlesheets"),
  },
  {
    tag: "Browser",
    match: (l) =>
      l.includes("browserbase") || l.includes("playwright") || l.includes("puppeteer"),
  },
];

function deriveTags(nodeTypes: string[]): string[] {
  const lowers = nodeTypes.map((t) => t.toLowerCase());
  const tags: string[] = [];
  for (const rule of TAG_RULES) {
    if (lowers.some(rule.match)) tags.push(rule.tag);
  }
  return tags;
}

function complexityFor(nodeCount: number): ExtractedMetadata["complexity"] {
  if (nodeCount <= 5) return "simple";
  if (nodeCount <= 15) return "medium";
  return "complex";
}

function uniqSort(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function safeHost(url: string): string | null {
  try {
    // Allow templated URLs like https://api.example.com/{{$json.x}} —
    // the URL constructor handles braces fine in the path.
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

// LLM model parameters live under different keys depending on the node
// vendor. We sweep a known set of common shapes.
function extractModelStrings(node: RawNode): string[] {
  const out: string[] = [];
  const p = node.parameters;
  if (!p || typeof p !== "object") return out;

  // Direct strings.
  for (const key of ["model", "modelId", "modelName", "deploymentName"]) {
    const v = (p as Record<string, unknown>)[key];
    if (typeof v === "string") out.push(v);
  }

  // Nested {value, mode} resource locator (n8n uses these for selects).
  for (const key of ["model", "modelId"]) {
    const v = (p as Record<string, unknown>)[key];
    if (v && typeof v === "object" && "value" in v) {
      const val = (v as { value: unknown }).value;
      if (typeof val === "string") out.push(val);
    }
  }

  // Options.model on legacy chat nodes.
  const options = (p as Record<string, unknown>).options;
  if (options && typeof options === "object") {
    const m = (options as Record<string, unknown>).model;
    if (typeof m === "string") out.push(m);
  }

  return out;
}

function extractHttpHosts(node: RawNode): string[] {
  if (!node.parameters) return [];
  const url = (node.parameters as Record<string, unknown>).url;
  if (typeof url !== "string") return [];
  const host = safeHost(url);
  return host ? [host] : [];
}

function extractWebhookPath(node: RawNode): string[] {
  if (!node.type) return [];
  if (!node.type.toLowerCase().includes("webhook")) return [];
  const p = node.parameters as Record<string, unknown> | undefined;
  if (!p) return [];
  const path = p.path;
  if (typeof path === "string" && path.length > 0) return [path];
  return [];
}

function countConnections(connections: Record<string, unknown> | undefined): {
  total: number;
  fanout: number;
} {
  if (!connections || typeof connections !== "object") {
    return { total: 0, fanout: 0 };
  }
  let total = 0;
  const targets = new Set<string>();
  for (const fromNode of Object.values(connections)) {
    if (!fromNode || typeof fromNode !== "object") continue;
    for (const channel of Object.values(fromNode as Record<string, unknown>)) {
      if (!Array.isArray(channel)) continue;
      for (const slot of channel) {
        if (!Array.isArray(slot)) continue;
        for (const conn of slot) {
          if (conn && typeof conn === "object" && "node" in conn) {
            const nodeName = (conn as { node: unknown }).node;
            if (typeof nodeName === "string") {
              targets.add(nodeName);
              total += 1;
            }
          }
        }
      }
    }
  }
  return { total, fanout: targets.size };
}

/** Parse raw JSON text and return extracted metadata or a typed error. */
export function extractFromJsonText(rawText: string): ExtractResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    return {
      ok: false,
      reason: `invalid JSON: ${err instanceof Error ? err.message : "parse error"}`,
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, reason: "JSON root is not an object" };
  }

  const wf = parsed as RawWorkflow;
  if (!Array.isArray(wf.nodes)) {
    return { ok: false, reason: "missing or invalid `nodes` array" };
  }

  const nodes = wf.nodes;
  const nodeTypes: string[] = [];
  const credentialTypes: string[] = [];
  const models: string[] = [];
  const hosts: string[] = [];
  const webhookPaths: string[] = [];
  let stickyNotes = 0;

  for (const node of nodes) {
    if (typeof node?.type === "string") {
      nodeTypes.push(node.type);
      if (node.type.toLowerCase().endsWith(".stickynote")) stickyNotes += 1;
    }
    if (node?.credentials && typeof node.credentials === "object") {
      for (const credKey of Object.keys(node.credentials)) {
        credentialTypes.push(credKey);
      }
    }
    models.push(...extractModelStrings(node));
    hosts.push(...extractHttpHosts(node));
    webhookPaths.push(...extractWebhookPath(node));
  }

  const uniqueNodeTypes = uniqSort(nodeTypes);
  const triggerTypes = uniqueNodeTypes.filter(isTriggerType);
  const tags = deriveTags(uniqueNodeTypes);
  const conn = countConnections(wf.connections);

  return {
    ok: true,
    metadata: {
      extractedAt: new Date().toISOString(),
      name: typeof wf.name === "string" ? wf.name : "(unnamed workflow)",
      active: wf.active === true,
      nodeCount: nodes.length,
      nodeTypes: uniqueNodeTypes,
      triggerTypes,
      credentialTypes: uniqSort(credentialTypes),
      llmModels: uniqSort(models),
      httpHosts: uniqSort(hosts),
      webhookPaths: uniqSort(webhookPaths),
      stickyNotesCount: stickyNotes,
      complexity: complexityFor(nodes.length - stickyNotes),
      tags,
      connectionCount: conn.total,
      fanoutCount: conn.fanout,
    },
  };
}

/** Convert a free-form filename or title to a slug. */
export function workflowSlug(input: string): string {
  return input
    .replace(/\.json$/i, "")
    .replace(/^_+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
