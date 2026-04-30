// Twelve categories of AI tools that actually move the needle for a small
// business. Each category lists a few suggested tools so you can pick a
// "starter" for the slot, but you can ignore the suggestions and write your
// own pick in. The roster page tracks signup + integration progress per slot.

export interface RosterTool {
  name: string;
  url?: string;
}

export interface RosterCategory {
  id: string;
  number: number;
  label: string;
  purpose: string;
  note: string;
  tools: RosterTool[];
}

export const ROSTER: RosterCategory[] = [
  {
    id: "ideas-strategy",
    number: 1,
    label: "Ideas & strategy clarity",
    purpose: "Validate offers, generate angles, plan content that converts.",
    note: "These are your default thinking partners.",
    tools: [
      { name: "ChatGPT", url: "https://chat.openai.com" },
      { name: "Claude", url: "https://claude.ai" },
      { name: "Perplexity", url: "https://perplexity.ai" },
    ],
  },
  {
    id: "presentations",
    number: 2,
    label: "Presentations that don't look amateur",
    purpose: "Client pitches, investor decks, sales storytelling.",
    note: "Pick one. Don't carry three deck tools.",
    tools: [
      { name: "Pitch", url: "https://pitch.com" },
      { name: "Slidebean", url: "https://slidebean.com" },
      { name: "Prezi", url: "https://prezi.com" },
    ],
  },
  {
    id: "websites",
    number: 3,
    label: "Build websites fast",
    purpose: "MVP sites, landing pages, quick validation. Not for SEO-heavy long-term projects.",
    note: "Treat these as throwaway. Production sites belong in code.",
    tools: [
      { name: "Framer", url: "https://framer.com" },
      { name: "10Web", url: "https://10web.io" },
      { name: "Durable", url: "https://durable.co" },
    ],
  },
  {
    id: "content-writing",
    number: 4,
    label: "Content that brings leads",
    purpose: "Long-form writing for organic reach. Only works if you understand your customer pain.",
    note: "Generic AI prose still reads generic. Use these as scaffolds.",
    tools: [
      { name: "Jasper", url: "https://jasper.ai" },
      { name: "Writesonic", url: "https://writesonic.com" },
      { name: "Copy.ai", url: "https://copy.ai" },
    ],
  },
  {
    id: "meetings",
    number: 5,
    label: "Meetings & time-saving",
    purpose: "Auto notes, summaries, noise removal. Saves hours every week.",
    note: "One transcription tool, one noise tool, done.",
    tools: [
      { name: "Otter", url: "https://otter.ai" },
      { name: "Fireflies", url: "https://fireflies.ai" },
      { name: "Krisp", url: "https://krisp.ai" },
    ],
  },
  {
    id: "chatbots",
    number: 6,
    label: "Chatbots & customer handling",
    purpose: "Support, lead qualification, FAQs. Needs proper setup to be worth it.",
    note: "Don't ship one without writing the system prompt and testing edge cases.",
    tools: [
      { name: "ChatGPT", url: "https://chat.openai.com" },
      { name: "Claude", url: "https://claude.ai" },
      { name: "Gemini", url: "https://gemini.google.com" },
    ],
  },
  {
    id: "automation",
    number: 7,
    label: "Automation & scaling",
    purpose: "This is where real leverage happens. Glue tools, multi-step flows, scheduling.",
    note: "Pick one orchestrator, learn it deeply.",
    tools: [
      { name: "ClickUp", url: "https://clickup.com" },
      { name: "Outreach", url: "https://outreach.io" },
      { name: "Bardeen", url: "https://bardeen.ai" },
    ],
  },
  {
    id: "ui-design",
    number: 8,
    label: "UI & product design",
    purpose: "Quick wireframes without hiring early.",
    note: "Output is a starting point, not a final spec.",
    tools: [
      { name: "Uizard", url: "https://uizard.io" },
      { name: "Galileo AI", url: "https://usegalileo.ai" },
      { name: "Visily", url: "https://visily.ai" },
    ],
  },
  {
    id: "images",
    number: 9,
    label: "Images & creatives",
    purpose: "Ads, thumbnails, social posts.",
    note: "One library + one generator covers most needs.",
    tools: [
      { name: "Freepik", url: "https://freepik.com" },
      { name: "StockIMG", url: "https://stockimg.ai" },
      { name: "Bing Create", url: "https://bing.com/create" },
    ],
  },
  {
    id: "video",
    number: 10,
    label: "Video content",
    purpose: "Fast production. Not instant authenticity, expect to edit.",
    note: "Avatars work for explainers, not for you-on-camera.",
    tools: [
      { name: "HeyGen", url: "https://heygen.com" },
      { name: "Synthesia", url: "https://synthesia.io" },
      { name: "Pictory", url: "https://pictory.ai" },
    ],
  },
  {
    id: "marketing",
    number: 11,
    label: "Marketing performance",
    purpose: "Helps with creatives, not strategy. Strategy is still on you.",
    note: "Run small first. These print variations, not insight.",
    tools: [
      { name: "AdCreative", url: "https://adcreative.ai" },
      { name: "Predis AI", url: "https://predis.ai" },
    ],
  },
  {
    id: "twitter",
    number: 12,
    label: "Twitter / X growth",
    purpose: "Distribution tools, not idea generators. You still need a point of view.",
    note: "Schedule against a bank of your own takes, don't auto-generate.",
    tools: [
      { name: "TweetHunter", url: "https://tweethunter.io" },
      { name: "Typefully", url: "https://typefully.com" },
      { name: "Postwise", url: "https://postwise.ai" },
    ],
  },
];
