/** Starting values from the PRD. All are editable in Settings. */

export const DEFAULT_POSITIONING = "AI, Automation & Data Solutions";

/** Supplied by Thess. Shown on designed graphics. Editable in Settings. */
export const DEFAULT_HANDLE = "@teriekarie";

export const DEFAULT_AUDIENCE = [
  "Recruiters and talent partners",
  "Hiring managers and business leaders",
  "Technology, automation, analytics and operations teams",
  "Potential consulting clients and collaborators",
  "Data and automation practitioners",
  "AI builders and curious professionals",
  "No-code/low-code and business systems communities",
  "People learning how to apply technology to real business problems",
];

export const DEFAULT_PILLARS = [
  "AI, agents & intelligent automation",
  "Data, analytics & business intelligence",
  "Building in public & experiments",
  "Industry perspectives & opinions",
  "Educational content & tool guides",
  "Career, growth & personal experiences",
  "Relatable technology humour",
  "Reflections & inspiration",
];

export const DEFAULT_KEYWORDS = [
  "AI automation",
  "AI agents",
  "Workflow automation",
  "Business process automation",
  "Data analytics",
  "Business intelligence",
  "Power BI",
  "Microsoft Copilot",
  "Copilot agents",
  "Power Automate",
  "n8n",
  "No-code and low-code",
  "CRM automation",
  "Business systems",
  "Dashboards",
  "Data-driven decision-making",
  "Digital transformation",
];

export const DEFAULT_BANNED_PHRASES = [
  "In today's fast-paced world",
  "Game-changer",
  "Unlock your potential",
  "Delve into",
  "Revolutionise everything",
  "I'm thrilled to announce",
  "Leverage",
  "Synergy",
  "Unleash",
  "AI is the future",
];

export const TONES = {
  auto: "Let the AI decide",
  funny: "Light and funny",
  opinion: "My opinion",
  school_of_thought: "A school of thought",
  serious: "Practical and serious",
} as const;
export type Tone = keyof typeof TONES;

export const PLATFORMS = {
  linkedin: "LinkedIn",
  instagram_facebook: "Instagram + Facebook",
  tiktok: "TikTok",
} as const;
export type Platform = keyof typeof PLATFORMS;

export const STANDARD_PROMPT = `Summarise this session as a learning note for my content agent.
Use these headings: What I was trying to do / Tools used / Blockers /
How I solved them / What I learned / Open questions.
Remove all company, client and colleague names, internal project names,
real figures, URLs and anything confidential. Replace them with generic
descriptions (e.g. "an oil & gas services company").
Keep it in plain, simple English.`;

export const LEARNING_NOTE_FIELDS = [
  { name: "trying", label: "What I was trying to do" },
  { name: "tools", label: "Tools used" },
  { name: "blockers", label: "Blockers" },
  { name: "solved", label: "How I solved them (or didn't)" },
  { name: "learned", label: "What I learned" },
  { name: "questions", label: "Open questions" },
] as const;
