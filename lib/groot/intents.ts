/**
 * Groot — deterministic intent classification.
 *
 * HARD CONSTRAINT: no LLM, no network, no AI cost. Everything here is a pure
 * function over strings. Same input always produces the same intent.
 *
 * ## Voice
 *
 * Groot is placid, brief, and never flustered — a handful of words that carry
 * the whole meaning, then silence. Three rules for every `reply`:
 *
 *  1. Say less than you want to. The longest reply here is under 30 words.
 *  2. Never narrate the UI. "Scrolling to the timeline" and "Scrolling now"
 *     were both cut: the visitor watches the page move. Saying so is noise, and
 *     it is the single thing that made the bot read as a demo.
 *  3. Never explain how it works. An earlier draft opened with "I'm
 *     keyword-matched, not an AI" and `unknown` told visitors it "can't
 *     improvise". Both were reassurance for the author, not the reader. The
 *     table is an implementation detail; an honest "nothing on that one" is
 *     the whole of what the visitor needs.
 *
 * What replaced them is specificity. "Four projects" beats "I can show you
 * projects"; an actual name beats an offer to go find one.
 *
 * The classifier is intentionally table-driven so that the later
 * conversational-flow work (slot filling, multi-turn forms) can add intents
 * and slots without changing the architecture: an intent either resolves
 * immediately (TERMINAL intents) or opens a slot-collection turn (COLLECTING
 * intents). See `agent.ts` for how those two kinds are handled.
 */

export type IntentId =
  // terminal: answered from the table, no follow-up needed
  | "greeting"
  | "help"
  | "who_is_ayush"
  | "experience"
  | "projects"
  | "skills"
  | "contact"
  | "availability"
  | "location"
  | "education"
  | "thanks"
  | "clear"
  // collecting: needs a follow-up turn (reserved for the conversational work)
  | "handoff"
  // unknown: falls through to handoff
  | "unknown";

export type IntentCategory = "terminal" | "collecting" | "unknown";

export interface Intent {
  id: IntentId;
  category: IntentCategory;
  /** Slash command, if this intent has one. */
  command?: string;
  /** Lowercase keywords. A keyword match alone is not enough — see `score`. */
  keywords: readonly string[];
  /** Multi-word phrases. Weighted higher than single keywords. */
  phrases?: readonly string[];
  /** Reply shown to the visitor. Keep it short; 50 words is the ceiling. */
  reply: string;
  /** Optional follow-up action the shell can perform. */
  action?: IntentAction;
}

export type IntentAction =
  | { type: "scrollTo"; sectionId: string }
  | { type: "openForm" }
  | { type: "clear" }
  | { type: "showHelp" };

export const INTENTS: readonly Intent[] = [
  {
    id: "greeting",
    category: "terminal",
    command: "/hello",
    keywords: ["hi", "hey", "hello", "yo", "sup", "hola", "namaste", "hii", "good morning", "good evening"],
    phrases: ["how are you", "who's there", "anyone there"],
    // Name duplicated as a literal on purpose: `agent.ts` already imports
    // `classify` from this module, so importing `AGENT_NAME` back from there
    // would be a cycle and `AGENT_NAME` would be in its TDZ while this array
    // initialises. `AGENT_NAME` in `agent.ts` is the source of truth.
    reply:
      "Hey. Groot here. Groot can show you the projects, walk through the skills, or pass a message to Ayush. /help lists everything.",
  },
  {
    id: "help",
    category: "terminal",
    command: "/help",
    keywords: ["help", "commands", "options", "menu", "what can you do", "usage"],
    action: { type: "showHelp" },
    reply:
      "/projects, /experience, /skills, /contact, /availability, /education, /location and /who are all available. You can also just ask in your own words.",
  },
  {
    id: "who_is_ayush",
    category: "terminal",
    command: "/who",
    keywords: ["who", "whois", "about", "about you", "about him", "yourself", "ayush", "introduce", "bio", "summary"],
    phrases: ["who is ayush", "tell me about", "who are you", "what does he do", "about ayush"],
    action: { type: "scrollTo", sectionId: "about" },
    reply:
      "Ayush Srivastava. Associate Software Engineer at IndiaMART InterMESH, on the WhatsApp Seller Bot team. Full-stack SDE internship before that. Built IM Kree, an incident-investigation engine that took root-cause analysis from two days to minutes.",
  },
  {
    id: "experience",
    category: "terminal",
    command: "/experience",
    keywords: ["experience", "work", "job", "career", "employ", "indiaMART", "intermesh", "intern", "internship", "company", "timeline"],
    phrases: ["where does he work", "work experience", "what is his job", "how long has he worked"],
    action: { type: "scrollTo", sectionId: "experience" },
    reply:
      "Associate Software Engineer at IndiaMART InterMESH, on the WhatsApp Seller Bot team. Full-stack SDE internship before that.",
  },
  {
    id: "projects",
    category: "terminal",
    command: "/projects",
    keywords: ["project", "projects", "work", "portfolio", "built", "build", "showcase", "demo", "repo", "repository", "github", "code"],
    phrases: ["show me your work", "what have you built", "let me see the projects", "showcase your work", "any projects"],
    action: { type: "scrollTo", sectionId: "projects" },
    reply:
      "There are four projects. IM Kree does incident investigation, one is a hotel recommender built on web mining, TeamUp is a collaboration app, and IWDS is a wireless environmental monitoring system from IIITDM Jabalpur. They are further down the page.",
  },
  {
    id: "skills",
    category: "terminal",
    command: "/skills",
    keywords: ["skill", "skills", "stack", "tech", "technology", "technologies", "tools", "languages", "framework", "frameworks", "expertise", "proficient"],
    phrases: ["what can he do", "tech stack", "what languages", "what frameworks", "how skilled"],
    action: { type: "scrollTo", sectionId: "skills" },
    reply:
      "He works in Python, TypeScript, JavaScript, Go, C++ and PHP. On the AI side there is LangGraph, Langfuse, Google ADK, n8n and RAG pipelines. The frameworks are Next.js, React, Node, FastAPI, Django and Flask, with Postgres and MongoDB for data.",
  },
  {
    id: "contact",
    category: "collecting",
    command: "/contact",
    keywords: ["contact", "email", "reach", "talk", "message", "hire", "hiring", "connect", "call", "phone", "linkedin", "dm"],
    phrases: [
      "get in touch",
      "reach out",
      "contact him",
      "want to hire",
      "interested in hiring",
      "send a message",
      "work together",
      "work with him",
    ],
    action: { type: "openForm" },
    reply:
      "Leave a note with your name, email and a line about the work. It goes straight to Ayush's inbox, and he does not need an account.",
  },
  {
    id: "availability",
    category: "terminal",
    command: "/availability",
    keywords: ["available", "availability", "open", "free", "hire", "hiring", "looking", "seeking", "opportunity", "remote", "relocate"],
    phrases: ["is he available", "is he hiring", "open to work", "looking for a job", "open to opportunities"],
    reply:
      "Ayush has a full-time role at IndiaMART, so he is not actively job-hunting. He is still open to the right opportunity, though a clear problem gets a much better reply than a generic note.",
  },
  {
    id: "location",
    category: "terminal",
    command: "/location",
    keywords: ["location", "where", "based", "city", "country", "india", "remote", "timezone", "ist", "office"],
    phrases: ["where is he located", "which city", "where does he live", "what timezone"],
    reply: "He is based in India and works on IST. Most of the work is async-friendly, so remote works fine.",
  },
  {
    id: "education",
    category: "terminal",
    command: "/education",
    keywords: ["education", "degree", "college", "university", "school", "study", "student", "iiitdm", "jabalpur", "coursework"],
    phrases: ["where did he study", "what college", "his degree", "educational background"],
    reply: "He has a B.Tech from IIITDM Jabalpur, with coursework in the usual CS and AI range. The skills section lists the subjects.",
  },
  {
    id: "thanks",
    category: "terminal",
    command: "/thanks",
    keywords: ["thanks", "thank", "thx", "cheers", "shukriya", "dhanyavad", "appreciate"],
    phrases: ["thank you", "thanks a lot"],
    reply: "No problem. Use /contact if you want to reach Ayush.",
  },
  {
    id: "clear",
    category: "terminal",
    command: "/clear",
    keywords: ["clear", "reset", "wipe", "cls"],
    action: { type: "clear" },
    reply: "Cleared.",
  },
  {
    id: "handoff",
    category: "collecting",
    keywords: [],
    reply: "",
  },
  {
    id: "unknown",
    category: "unknown",
    keywords: [],
    reply:
      "Groot does not have an answer for that one. Try /projects, /skills or /experience, or use /contact to reach Ayush directly.",
  },
] as const;

export const INTENT_BY_ID: ReadonlyMap<IntentId, Intent> = new Map(
  INTENTS.map((intent) => [intent.id, intent]),
);

/** Every slash command, sorted for palette display. */
export const COMMANDS: readonly string[] = INTENTS.filter((i) => i.command)
  .map((i) => i.command as string)
  .sort((a, b) => a.localeCompare(b));

/** Strip diacritics, punctuation and collapse whitespace. */
export function normalize(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface Classification {
  intent: Intent;
  /** 0..1. Below THRESHOLD the match is discarded and `unknown` wins. */
  confidence: number;
  /** Human-readable trace of why this intent won. Useful while debugging. */
  matched: string[];
}

export const CONFIDENCE_THRESHOLD = 0.34;

/**
 * Word-boundary test, used for every keyword.
 *
 * `normalize` has already reduced the input to lowercase `a-z`, `0-9`, `/` and
 * single spaces, so a whole-word hit is just "the needle is one of the space
 * separated tokens, or a run of tokens".
 *
 * This exists because raw `includes` was matching inside words. `"hi"` fired on
 * `"higher education"` (h-**i**-gher), `"ist"` fired on `"this"` and `"list"`,
 * and `"call"` fired on `"callback"`. Because those all scored a real 0.34, a
 * question about higher education opened with a greeting.
 *
 * Loose substring matching buys almost nothing here anyway: anything the table
 * misses now goes to the model, so precision is worth more than recall. A
 * keyword this table genuinely needs in a variant form (a plural, say) should be
 * spelled out as its own keyword.
 */
function containsPhrase(haystack: string, needle: string, tokens: ReadonlySet<string>): boolean {
  if (needle.includes(" ")) {
    return haystack.includes(` ${needle} `) || haystack.startsWith(`${needle} `) || haystack.endsWith(` ${needle}`);
  }
  return tokens.has(needle);
}

/**
 * Score one intent against normalized input.
 *
 * Deliberately simple and inspectable — keyword hits plus a bonus for
 * multi-word phrases and for an exact slash-command match. No embeddings, no
 * fuzzy library: this has to run in the browser for free.
 */
export function scoreIntent(intent: Intent, normalized: string): Classification | null {
  if (intent.keywords.length === 0 && !intent.phrases?.length && !intent.command) {
    return null;
  }

  const matched: string[] = [];
  let score = 0;

  const tokens: ReadonlySet<string> = new Set(normalized.split(" "));

  if (intent.command && normalized === intent.command) {
    // Exact command is decisive.
    return { intent, confidence: 1, matched: [intent.command] };
  }

  for (const phrase of intent.phrases ?? []) {
    const needle = normalize(phrase);
    if (needle && containsPhrase(normalized, needle, tokens)) {
      // Longer phrases are more specific, so weight by length.
      score += 0.5 + Math.min(needle.split(" ").length, 5) * 0.12;
      matched.push(`~${phrase}`);
    }
  }

  for (const keyword of intent.keywords) {
    const needle = normalize(keyword);
    if (!needle) continue;

    if (normalized === needle) {
      score += 0.6;
      matched.push(`=${keyword}`);
    } else if (containsPhrase(normalized, needle, tokens)) {
      score += 0.42;
      matched.push(`#${keyword}`);
    }
  }

  if (score === 0) return null;

  // Squash into 0..1. 1.6 is roughly "two solid keyword hits".
  const confidence = Math.min(1, score / 1.6);
  return { intent, confidence, matched };
}

/**
 * Commands with their leading slash, longest first.
 *
 * Sorted by length descending so the prefix search below always finds the
 * longest matching command first. `/experience` and `/education` share `/e`, so
 * an unqualified prefix is not always unambiguous — hence the guard in
 * {@link matchCommand}.
 */
const COMMANDS_BY_LENGTH: readonly string[] = INTENTS.filter((i) => i.command)
  .map((i) => i.command as string)
  .sort((a, b) => b.length - a.length);

/**
 * Resolve a slash command, allowing any unambiguous prefix.
 *
 * `/cont` is what people actually type. Without this it scored zero, fell
 * through to `unknown`, and — because the fallback reply is a wall of text —
 * made a typo feel like a dead end.
 *
 * Only a *unique* prefix resolves. `/e` matches both `/experience` and
 * `/education` and `/c` matches both `/contact` and `/clear`, so those stay
 * unresolved and the visitor gets the help text instead of a coin flip.
 *
 * Confidence is 0.9 rather than 1: it is a strong inference, not a certainty,
 * and it clears {@link REMOTE_CONFIDENCE_THRESHOLD} so the answer still comes
 * from the table with no round-trip.
 */
function matchCommand(normalized: string): Classification | null {
  if (!normalized.startsWith("/")) return null;

  const exact = COMMANDS_BY_LENGTH.find((c) => c === normalized);
  if (exact) {
    const intent = INTENTS.find((i) => i.command === exact);
    if (intent) return { intent, confidence: 1, matched: [exact] };
  }

  const candidates = COMMANDS_BY_LENGTH.filter((c) => c.startsWith(normalized));
  if (candidates.length !== 1) return null;

  const command = candidates[0];
  const intent = INTENTS.find((i) => i.command === command);
  if (!intent) return null;
  return { intent, confidence: 0.9, matched: [`${normalized}→${command}`] };
}

/**
 * Classify free-text or a slash command.
 * Ties break toward the earlier intent in the table (deterministic).
 */
export function classify(input: string): Classification {
  const normalized = normalize(input);
  if (!normalized) {
    return { intent: INTENT_BY_ID.get("unknown")!, confidence: 1, matched: ["empty"] };
  }

  // Commands are checked before keyword scoring: an exact or prefixed command is
  // the visitor being explicit, and nothing in the keyword table should be able
  // to outvote it.
  const command = matchCommand(normalized);
  if (command) return command;

  let best: Classification | null = null;

  for (const intent of INTENTS) {
    const result = scoreIntent(intent, normalized);
    if (!result) continue;
    if (!best || result.confidence > best.confidence) {
      best = result;
    }
  }

  if (!best || best.confidence < CONFIDENCE_THRESHOLD) {
    return {
      intent: INTENT_BY_ID.get("unknown")!,
      confidence: best?.confidence ?? 0,
      matched: best?.matched ?? [],
    };
  }

  return best;
}