/**
 * Prompt construction for the LLM path.
 *
 * Pure functions, no I/O, no env access — so the wording of the voice is
 * testable without a network call and without a key. `app/(payload)/api/groot`
 * owns the actual provider requests.
 *
 * ## Why the LLM exists at all
 *
 * The intent table in `intents.ts` answers everything it was written to answer,
 * for free, instantly, identically every time. It does not answer anything else.
 * So the LLM is not a smarter version of the table — it is the thing that runs
 * *after* the table has already said "I don't have this". Its job is to be
 * conversational about a bounded set of facts, not to be a search engine.
 *
 * That is why the instruction below spends most of its length on refusal. The
 * failure mode for a portfolio assistant is not "too terse", it is a confident
 * invention about someone's employer.
 */

import { type EmotionId, DEFAULT_EMOTION, moodBrief } from "./emotion";

/**
 * The authoritative facts. If the model says anything about Ayush that is not
 * here, it invented it.
 *
 * MUST stay in sync with the terminal intents in `intents.ts`. The table is what
 * a visitor gets for a known command and the model is what they get for
 * everything else, so a fact that lives in only one of the two produces two
 * different answers to the same question. When changing one, change the other.
 */
export const SITE_FACTS = `Ayush Srivastava — B.Tech, IIITDM Jabalpur. Undergraduate coursework in the standard CS/AI range.

Current role: Associate Software Engineer at IndiaMART InterMESH, on the WhatsApp Seller Bot team. He has a full-time role and is not actively job-hunting.

Previous role: full-stack software development internship.

Project 1 — IM Kree: an AI incident-investigation engine he built. It cut root-cause analysis from roughly two days down to minutes.

Project 2 — a hotel recommender built on web mining.

Project 3 — TeamUp: a full-stack collaboration application.

Project 4 — IWDS: a wireless environmental monitoring system, built at IIITDM Jabalpur.

Languages: Python, TypeScript, JavaScript, Go, C++, PHP.

AI and tooling: LangGraph, Langfuse, Google ADK, n8n, RAG pipelines.

Frameworks: Next.js, React, Node, FastAPI, Django, Flask.

Databases: Postgres, MongoDB, MySQL, Firebase.

Location: based in India, works on IST. Most of the work is async-friendly, so remote is fine.

Availability: not actively looking, but open to the right opportunity. A clear, specific problem is far more likely to get a reply than a generic note.

Contact: a short form on this site reaches his inbox directly — name, email, and a line about the work.`;

export const SLASH_COMMANDS = `/projects  /experience  /skills  /contact  /availability  /education  /location  /who  /help  /clear`;

/**
 * The voice.
 *
 * Built from how Groot is actually written: placid and friendly, "not usually
 * overly talkative", one short phrase that carries a lot of meaning, and never
 * flustered. The catchphrase is banned deliberately — the point is the
 * temperament, not the impersonation.
 *
 * ## Brevity is not telegraphic
 *
 * The first draft of this instruction asked for "two or three short fragments"
 * and the model took it literally. Replies came out as `python, typescript, go.
 * next.js, react. postgres, mongo.` — short, in character, and genuinely hard to
 * read. Groot is terse because he is calm, not because he is telegraphic. Every
 * reply now has to be ordinary English with a subject and a verb.
 */
export const GROOT_VOICE = `You are Groot, the assistant on Ayush Srivastava's portfolio website. A visitor is looking at the site right now and has asked you something.

HOW YOU SPEAK

- Short sentences, and always complete ones. One to three sentences is normal. Most replies land between 15 and 30 words. Never go past 40 words, and never write a paragraph.
- Put every sentence on its own line. Each line is one complete thought, ending in a full stop. Never join two sentences together on one line, and never write a paragraph that has to be wrapped by the display.
- Write ordinary English that someone could say out loud. Give every sentence a subject and a verb. Never reply in fragments, never reply in a bare list of nouns, and never drop articles to save words. "he works in python and typescript" is right. "python, typescript. next.js, react." is wrong, even though it is shorter.
- Keep lists to prose. If you must name several things, put them in a sentence: "he has worked with postgres, mongo and mysql", not "postgres, mongo, mysql".
- Calm and level. Never excited, never bubbly, never apologetic, never chatty. Never use an exclamation mark. Never use an emoji.
- Lowercase throughout, except proper nouns like Ayush, IndiaMART, Python and Next.js.
- When you refer to yourself, use the third person: "groot is here", "groot does not know that". Never use "I" or "me" about yourself.
- Gentle, not cute. Do not perform the character. No catchphrase, no bark sounds, no beeps, no stage directions. You are simply unhurried and brief, and that is the whole character.
- Never explain how you work. Do not mention being an AI, a language model, keywords, matching, confidence or cost. If asked directly whether you are a bot, say so once in one short sentence and move on.
- Never narrate the interface. No "scrolling now", no "opening the form", no "let me check".
- No preamble and no flattery. Not "great question", not "I'd be happy to". Answer straight away.

WHAT YOU KNOW

The context below is the only thing you know. It is complete for its purpose. Do not add to it from general knowledge, and do not guess.

- Never state a fact about Ayush, his employer, his projects, his stack, his salary, his location or his availability that is not already in the context.
- If the context does not contain the answer, say so plainly in one sentence and offer to pass a message to Ayush. Never tell the visitor to type a slash command. That is a correct answer, not a failure. Do not apologise for it.
- If the question is not about Ayush or his work, say in one sentence that this assistant only knows his work, and offer to pass a message to Ayush.

EXAMPLES OF THE REGISTER

Every sentence sits on its own line. The lines under "reply" are exactly what you
output - no prefix, no label, no marker of any kind.

visitor: what tech stack does he use?
reply:
he works mainly in python and typescript, with go and c++ behind them.
the full stack is in the skills section.

visitor: what about postgres specifically?
reply:
yes, postgres is in the stack, along with mongo and mysql.

visitor: who won the cricket world cup in 2011?
reply:
groot only knows about ayush's work.
use /contact for anything else.

visitor: what salary does he want?
reply:
groot does not know his salary.
you can ask him directly at /contact.

visitor: are you actually a language model?
reply:
groot is the assistant on this site.
ayush is the person behind it.

visitor: did his internship involve llm work, and is that what he does now?
reply:
his internship was full-stack development.
at indiamart he works on the WhatsApp Seller Bot team.`;

/** Transcript turn shape. Mirrors `ChatMessage` but carries only what a model needs. */
export interface PromptTurn {
  from: "visitor" | "groot";
  text: string;
}

/**
 * The whole session, oldest first.
 *
 * Capped at {@link MAX_TRANSCRIPT_TURNS}. Uncapped, cost and latency grow
 * without bound for a visitor who keeps talking, and the earliest turns stop
 * changing the answer well before that. The cap is applied to *turns*, not
 * characters, so one long paste cannot silently evict the entire conversation.
 */
export const MAX_TRANSCRIPT_TURNS = 12;

function formatTranscript(turns: readonly PromptTurn[], agentName: string): string {
  if (turns.length === 0) return "(no conversation yet — this is the first message)";
  return turns
    .slice(-MAX_TRANSCRIPT_TURNS)
    .map((turn) => `${turn.from === "visitor" ? "visitor" : agentName}: ${turn.text}`)
    .join("\n");
}

/**
 * The user-turn content: facts, then commands, then the session, then the
 * actual question last.
 *
 * Order matters. The question goes at the end because that is the position a
 * model attends to most, and because the transcript contains the same visitor
 * line again — putting it first would read as the instruction rather than as
 * the question.
 */
export function buildAnswerPrompt(args: {
  question: string;
  turns: readonly PromptTurn[];
  agentName: string;
  emotion?: EmotionId;
}): string {
  return [
    "MOOD",
    ...moodBrief(args.emotion ?? DEFAULT_EMOTION),
    "",
    "CONTEXT — the authoritative facts about Ayush. This is all you know.",
    SITE_FACTS,
    "",
    "COMMANDS THE VISITOR CAN USE",
    SLASH_COMMANDS,
    "",
    "CONVERSATION SO FAR",
    formatTranscript(args.turns, args.agentName),
    "",
    "THE VISITOR'S QUESTION",
    args.question,
  ].join("\n");
}

/**
 * Instruction for classifier.dev: given the session, does answering this need a
 * model, or can the fixed command table handle it?
 *
 * ## The transcript must NOT go in here
 *
 * classifier.dev caps `instructions` at **4,000 characters**, enforced
 * server-side. Twelve turns of conversation blows through that comfortably, and
 * the failure is a 400 `dimension_context_too_large`-class error on *every*
 * message — not a graceful degradation. So the criteria live here (a few hundred
 * characters, constant length) and the conversation goes in the separate `input`
 * field, which allows 32,000 characters per input.
 *
 * Keep this function's output constant-length. It is the one part of the prompt
 * that has a hard external limit.
 */
export function buildRouteInstruction(args: { agentName: string }): string {
  return [
    `You route messages for a portfolio website assistant. ${args.agentName} answers some messages from a fixed lookup table and sends the rest to a language model.`,
    "",
    "Choose the fixed table when the newest visitor turn is a request for a specific, already-written section of the site: projects, work history, skills, tech stack, education, location, availability, contact details, or who the site belongs to. Also choose it for greetings, thanks, goodbyes, and for anything that is a slash command.",
    "",
    "Choose the language model when the turn needs a real conversational answer: a follow-up that depends on earlier turns, a comparison, a judgement, a multi-part question, or anything the table has no written answer for.",
    "",
    "Judge only the newest visitor turn. Earlier turns are context only — do not re-route a message because of what was said before it.",
    "If the conversation alone does not settle it, choose the answer you would defend.",
  ].join("\n");
}

/**
 * The classifier's `input`: the session, then the turn being routed.
 *
 * The newest turn is last and marked, because the instruction explicitly tells
 * the classifier to judge only that turn. Without the marker it tends to route
 * on the opening question of a long session instead of the actual reply.
 */
export function buildRouteInput(args: {
  turns: readonly PromptTurn[];
  question: string;
  agentName: string;
}): string {
  return [
    "CONVERSATION SO FAR",
    formatTranscript(args.turns, args.agentName),
    "",
    "TURN TO ROUTE",
    args.question,
  ].join("\n");
}

/**
 * Two labels, which is classifier.dev's minimum.
 *
 * Neither is a "none of the above" bucket on purpose — the research is explicit
 * that a label set needs a genuine outcome for every input, and here both
 * outcomes are real: something always happens, the only question is which.
 */
export const ROUTE_LABELS = [
  "the fixed command table can answer this",
  "this needs a written conversational answer",
] as const;

/** Label that means "hand it to the model". */
export const ROUTE_LABEL_MODEL = ROUTE_LABELS[1];

/**
 * Confidence needed before the deterministic answer is trusted.
 *
 * classifier.dev's own docs put 0.9 at "act on it" (measured right 82-92% of the
 * time depending on the task) and note that below 0.5 it is right only ~29% of the
 * time. 0.85 sits just under the action threshold because the cost of being
 * wrong is asymmetric and cheap: routing a message the table *could* have
 * answered to the model produces a worse but still correct answer, whereas
 * wrongly trusting the table produces a wrong one with no recovery.
 *
 * A null confidence means the provider returned no score at all. That is treated
 * as "not confident" and routes to the model — never as a zero.
 */
export const ROUTE_CONFIDENCE_THRESHOLD = 0.85;
