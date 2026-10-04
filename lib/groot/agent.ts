/**
 * Groot — deterministic conversation state machine.
 *
 * HARD CONSTRAINT: no LLM, no model call, no network round-trip. Every reply is
 * looked up from the table in `intents.ts`. The same input always produces the
 * same output, which is what makes the orb's state machine honest — the orb
 * reacts to real work, not to a fake "thinking" animation around a hidden API.
 *
 * That constraint is an implementation fact, not part of the product. It is
 * recorded here and nowhere the visitor can see it — see the note in
 * `intents.ts` on voice.
 *
 * ## Why a reducer
 *
 * The agent is a pure `reduce(state, event) -> state`. React just renders it.
 * That keeps every rule testable without a DOM, and it is the reason the later
 * conversational work (multi-turn slot filling) is additive: it introduces new
 * events and new states, it does not rewrite the loop.
 *
 * ## States
 *
 *   idle  -> nothing pending; orb rests
 *   routing -> input accepted, intent being classified; orb = thinking
 *   speaking -> reply delivered, orb is animating the answer; orb = speaking
 *   collecting -> a slot-filling turn is open (reserved for the later work)
 *
 * `orbState` is the only thing the renderer needs. It is derived, never set
 * independently, so the visuals can never drift from the logic.
 */

import type { Classification, Intent, IntentId } from "./intents";
import { classify, INTENT_BY_ID } from "./intents";

/** Single source of truth for the agent's display name. Copy, tooltips and
 *  aria-labels all read from this so a rename is one edit. */
export const AGENT_NAME = "Groot";

export type AgentState =
  | "idle"
  | "routing"
  | "speaking"
  | "collecting";

export type OrbState = "idle" | "thinking" | "speaking";

export interface ChatMessage {
  id: string;
  from: "visitor" | "groot";
  text: string;
  /** Intent that produced this reply. Absent on visitor messages. */
  intentId?: IntentId;
  /** Confidence 0..1, kept for the debug overlay. */
  confidence?: number;
  /** Set when the message opens or resolves the contact form. */
  form?: "open" | "sent" | "failed";
}

export interface AgentStateShape {
  status: AgentState;
  messages: ChatMessage[];
  /** Section the shell should scroll to, consumed and cleared by the UI. */
  pendingScrollTo: string | null;
  /** True while the contact form should be visible. */
  formOpen: boolean;
  /** Set when the shell should render the command palette. */
  paletteOpen: boolean;
  /** Last classification, for the debug overlay. Deterministic and inspectable. */
  lastClassification: Classification | null;
  /**
   * Intent awaiting commit while `status` is `routing`. Splitting classification
   * from delivery is what gives the orb a genuine `thinking` state: the work
   * happens in `send`, the reply lands in `resolve`.
   */
  pendingIntent: Intent | null;
  /**
   * Monotonic id of the `send` currently in flight. A network answer carries the
   * id it was requested for, and a mismatch means the visitor has typed again
   * while the model was still thinking — that answer is dropped rather than
   * appended, because it belongs to a question that is no longer the last one.
   */
  awaitingRequest: number | null;
}

export type AgentEvent =
  /**
   * `requestId` is supplied by the caller, not generated here.
   *
   * The caller is the only party that knows whether a network request is going
   * out for this message, so it is the only party that can hand the same id back
   * on `resolveRemote`. Generating it in the reducer would mean the two sides
   * hold separate counters, and a stale answer would be committed against a
   * message it was never fetched for. Optional so that non-network callers (and
   * tests) do not have to invent one.
   */
  | { type: "send"; text: string; requestId?: number }
  /** Moves routing -> speaking and commits the pending reply. */
  | { type: "resolve" }
  /**
   * Commits a reply that did not come from the table — the model answered, or the
   * server's fallback picked a canned reply because the model was unreachable.
   *
   * Carries its own text rather than resolving `pendingIntent`, because by the
   * time this arrives the pending intent may have been superseded by a second
   * `send`. The reducer is the only place that decides whether the answer still
   * belongs to the message that asked for it.
   */
  | {
      type: "resolveRemote";
      reply: string;
      requestId: number;
      /**
       * Set only when the *server* produced this text from the intent table
       * rather than from a model.
       *
       * This is the difference between a reply and a dead end. The server
       * re-classifies with the same table but the full transcript in hand, so it
       * can recognise something the browser scored too low — "can i hire him"
       * lands on `contact`, which has an `openForm` action. Without this field
       * the reply renders, no `intentId` is attached, and no action fires, so
       * the visitor is told to leave a note by a form that never opens.
       *
       * Optional and absent for genuine model answers: nothing in the table
       * produced those, and inventing an id for them would be a lie the
       * transcript's badge would then display.
       */
      intentId?: IntentId;
    }
  | { type: "replyShown" }
  | { type: "openForm" }
  | { type: "closeForm" }
  | { type: "formSent" }
  | { type: "formFailed" }
  | { type: "togglePalette" }
  | { type: "clear" }
  | { type: "restore"; messages: ChatMessage[] };

/** Kept short on purpose. The widget renders at most this many. */
export const MESSAGE_LIMIT = 24;

/**
 * Minimum time the orb stays in `thinking`. Classification is synchronous and
 * takes microseconds, so without a floor the state would never render and the
 * orb would appear to skip straight to the answer. This is presentation only —
 * no request is in flight.
 *
 * 1.6s is a deliberate wait, not a safety floor. At the original 260ms the orb
 * flipped to `speaking` before the eye could track it, so the animation read as
 * a flicker rather than as a state change. `thinking` also carries the amber
 * phosphor, which is the only place that colour appears — too short a hold and
 * the state has no observable meaning.
 *
 * The cost is real and worth stating: every reply now takes at least 1.6s plus
 * its speaking time to appear. That is fine for an intent table this small, and
 * it would not be fine if classification ever became a network call. Sending a
 * second message mid-flight is not blocked — `send` re-enters `routing` and the
 * stale `replyShown` no-ops because it only settles a `speaking` state.
 */
export const MIN_THINKING_MS = 1600;

/**
 * Rough reading time, used to hold the orb in `speaking`. Capped so a long
 * reply does not leave the orb animating after the visitor has read it.
 */
export function speakingDurationMs(text: string): number {
  return Math.min(4200, Math.max(700, text.length * 22));
}

/**
 * Confidence above which the local table answers on its own and no request is
 * made at all.
 *
 * 0.5 is not arbitrary — it is where the table's scoring actually puts its
 * evidence. In `scoreIntent` a bare exact keyword is worth 0.6, a whole-token hit
 * 0.42, a phrase 0.5 + 0.12 per word, and an exact slash command short-circuits
 * to 1. Divided by the 1.6 divisor that puts one exact keyword at ~0.38 and any
 * real phrase or command above 0.5. So 0.5 is the line between "matched one
 * loose word" and "matched a specific request".
 *
 * Asking above this line would mean a network round-trip for `/projects`.
 */
export const REMOTE_CONFIDENCE_THRESHOLD = 0.5;

/**
 * Intents that are never worth a network round-trip, however weakly they scored.
 *
 * `hi` scores 0.375 because it is one exact keyword — which is below the
 * threshold, and would otherwise send a greeting to be classified. There is no
 * version of "hello" that needs a model.
 */
const NEVER_REMOTE: ReadonlySet<IntentId> = new Set<IntentId>([
  "greeting",
  "thanks",
  "clear",
  "help",
]);

/**
 * Whether this message should leave the browser.
 *
 * The server re-runs the classifier anyway and can overrule this, so getting it
 * wrong here is a latency question, never a correctness one. That asymmetry is
 * the whole reason the fast path exists.
 */
export function shouldGoRemote(classification: Classification): boolean {
  if (NEVER_REMOTE.has(classification.intent.id)) return false;
  return classification.confidence < REMOTE_CONFIDENCE_THRESHOLD;
}

export const WELCOME: ChatMessage = {
  id: "welcome",
  from: "groot",
  text: `${AGENT_NAME} here. Ask about Ayush's work and the projects he has built, or leave him a message. Try /projects, /skills, /experience or /contact.`,
  intentId: "greeting",
  confidence: 1,
};

let counter = 0;
/** Monotonic ids. Avoids `crypto.randomUUID` so snapshots stay comparable. */
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

/**
 * Push the id counter past every id already in a restored transcript.
 *
 * The transcript is persisted to localStorage, so after a reload the messages
 * come back carrying ids minted by the *previous* page session — but `counter`
 * starts at 0 again. The next message would be handed `v-1`, colliding with a
 * restored `v-1`, and the transcript renders with `key={message.id}`. React
 * then warns about duplicate keys and may duplicate or silently drop messages.
 *
 * Ids look like `v-12` / `b-7`, so the numeric suffix is enough to resume from.
 * Ids we cannot parse are ignored: a collision is worth avoiding, not worth
 * failing a restore over.
 */
export function reserveIdsFor(messages: readonly { id: string }[]): void {
  for (const message of messages) {
    const suffix = Number.parseInt(message.id.slice(message.id.lastIndexOf("-") + 1), 10);
    if (Number.isFinite(suffix) && suffix > counter) {
      counter = suffix;
    }
  }
}

/**
 * Fallback request-id source, used only when a `send` arrives without one (the
 * tests, and any caller on the deterministic-only path). Monotonic, so a real
 * id from the hook and a fallback id can never collide.
 */
let requestCounter = 0;

function nextRequestId(): number {
  requestCounter += 1;
  return requestCounter;
}

export const initialAgentState: AgentStateShape = {
  status: "idle",
  messages: [WELCOME],
  pendingScrollTo: null,
  formOpen: false,
  paletteOpen: false,
  lastClassification: null,
  pendingIntent: null,
  awaitingRequest: null,
};

/** Derive the orb's visual state from the agent's logical state. */
export function orbStateFor(status: AgentState): OrbState {
  switch (status) {
    case "routing":
      return "thinking";
    case "speaking":
      return "speaking";
    // A collecting turn is still the agent working — the orb should read as
    // busy so the visitor knows the form is a live turn, not a dead end.
    case "collecting":
      return "speaking";
    case "idle":
    default:
      return "idle";
  }
}

function push(messages: ChatMessage[], ...incoming: ChatMessage[]): ChatMessage[] {
  const next = [...messages, ...incoming];
  return next.length > MESSAGE_LIMIT ? next.slice(next.length - MESSAGE_LIMIT) : next;
}

/** Section id for an intent's action, validated against the ids the page has. */
export const KNOWN_SECTIONS = [
  "hero",
  "experience",
  "projects",
  "skills",
  "contact",
] as const;

export type KnownSection = (typeof KNOWN_SECTIONS)[number];

export function isKnownSection(id: string): id is KnownSection {
  return (KNOWN_SECTIONS as readonly string[]).includes(id);
}

function scrollTargetFor(intent: Intent): string | null {
  const action = intent.action;
  if (!action || action.type !== "scrollTo") return null;
  return isKnownSection(action.sectionId) ? action.sectionId : null;
}

/**
 * Core transition. Pure and synchronous — no timers, no promises. The hook owns
 * timing by dispatching `replyShown` after a delay.
 */
export function reduce(state: AgentStateShape, event: AgentEvent): AgentStateShape {
  switch (event.type) {
    case "send": {
      const text = event.text.trim();
      if (!text) return state;

      const classification = classify(text);
      const { intent, confidence } = classification;

      const visitorMessage: ChatMessage = {
        id: nextId("v"),
        from: "visitor",
        text,
      };

      // `/clear` is handled as an action, not a transcript line — echoing
      // "Cleared." then wiping it would look like a glitch.
      if (intent.id === "clear") {
        return {
          ...state,
          status: "idle",
          messages: [{ ...WELCOME, id: nextId("w") }],
          pendingScrollTo: null,
          formOpen: false,
          paletteOpen: false,
          lastClassification: classification,
          // A request in flight belongs to a transcript that no longer exists.
          // Leaving the id set would let its answer land in the cleared session.
          awaitingRequest: null,
        };
      }

      const opensForm = intent.action?.type === "openForm";
      const showPalette = intent.action?.type === "showHelp";

      // Store the action flags on the intent's behalf via pendingIntent; the
      // side effects are applied in `resolve` so the orb reads `thinking`
      // first. Applying them here would make the state jump straight to the
      // answer and the thinking animation would never be seen.
      void opensForm;
      void showPalette;

      return {
        ...state,
        status: "routing",
        messages: push(state.messages, visitorMessage),
        pendingScrollTo: null,
        formOpen: state.formOpen,
        paletteOpen: state.paletteOpen,
        lastClassification: classification,
        pendingIntent: intent,
        // Claim the id now, whether or not a request follows. A new `send`
        // overwrites it, which is what retires the previous answer.
        awaitingRequest: event.requestId ?? nextRequestId(),
      };
    }

    case "resolve": {
      const intent = state.pendingIntent;
      if (!intent || state.status !== "routing") {
        return { ...state, status: "idle", pendingIntent: null };
      }

      const opensForm = intent.action?.type === "openForm";
      const showPalette = intent.action?.type === "showHelp";

      const reply: ChatMessage = {
        id: nextId("b"),
        from: "groot",
        text: intent.reply,
        intentId: intent.id,
        confidence: state.lastClassification?.confidence ?? 1,
      };

      return {
        ...state,
        status: opensForm ? "collecting" : "speaking",
        messages: push(state.messages, reply),
        pendingScrollTo: scrollTargetFor(intent),
        formOpen: opensForm ? true : state.formOpen,
        paletteOpen: showPalette ? true : state.paletteOpen,
        pendingIntent: null,
        awaitingRequest: null,
      };
    }

    case "resolveRemote": {
      // Wrong turn, or no longer routing at all. The visitor typed again, or
      // cleared, while the model was working. Appending now would answer a
      // question that is no longer the last one on screen.
      if (event.requestId !== state.awaitingRequest || state.status !== "routing") {
        return state;
      }

      const text = event.reply.trim();
      if (!text) {
        return { ...state, status: "idle", awaitingRequest: null };
      }

      /*
        When the server says the table produced this text, it is authoritative
        about *which* intent — it saw the whole transcript, the browser saw one
        message. So its action runs here exactly as it would have from `resolve`:
        `openForm` moves the status to `collecting` rather than `speaking`,
        because the visitor now owes us a name and an email, and `scrollTo`
        resumes the page movement.

        Both are the difference between a working bot and one that says "leave a
        note" and then sits there.
      */
      const tableIntent = event.intentId ? INTENT_BY_ID.get(event.intentId) : undefined;
      const opensForm = tableIntent?.action?.type === "openForm";
      const showPalette = tableIntent?.action?.type === "showHelp";

      return {
        ...state,
        status: opensForm ? "collecting" : "speaking",
        messages: push(state.messages, {
          id: nextId("b"),
          from: "groot",
          text,
          // Absent for a model answer, and correctly so: nothing in the table
          // produced that, so the renderer shows no badge rather than a wrong one.
          intentId: tableIntent?.id,
          confidence: state.lastClassification?.confidence ?? 1,
        }),
        pendingScrollTo: tableIntent ? scrollTargetFor(tableIntent) : null,
        formOpen: opensForm ? true : state.formOpen,
        paletteOpen: showPalette ? true : state.paletteOpen,
        pendingIntent: null,
        awaitingRequest: null,
      };
    }

    case "replyShown":
      // Only fall back to idle if nothing else took over in the meantime.
      if (state.status === "speaking") {
        return { ...state, status: "idle", pendingScrollTo: null };
      }
      return state;

    case "openForm":
      return { ...state, status: "collecting", formOpen: true };

    case "closeForm":
      return { ...state, status: "idle", formOpen: false };

    case "formSent":
      return {
        ...state,
        status: "idle",
        formOpen: false,
        messages: push(state.messages, {
          id: nextId("b"),
          from: "groot",
          text: "Sent. Ayush will reply to the email you gave. /clear wipes this terminal.",
          intentId: "contact",
          form: "sent",
        }),
      };

    case "formFailed":
      return {
        ...state,
        status: "collecting",
        formOpen: true,
        messages: push(state.messages, {
          id: nextId("b"),
          from: "groot",
          text: "That didn't go through. Try again, or email directly.",
          intentId: "contact",
          form: "failed",
        }),
      };

    case "togglePalette":
      return { ...state, paletteOpen: !state.paletteOpen };

    case "clear":
      return {
        ...initialAgentState,
        messages: [{ ...WELCOME, id: nextId("w") }],
      };

    case "restore":
      return {
        ...state,
        status: "idle",
        messages: event.messages.length ? event.messages : [WELCOME],
      };

    default:
      return state;
  }
}

/**
 * Suggestion chips shown under an empty transcript. Kept to four so the panel
 * does not turn into a wall of text.
 */
export const SUGGESTIONS: readonly { label: string; send: string }[] = [
  { label: "Projects", send: "/projects" },
  { label: "Skills", send: "/skills" },
  { label: "Experience", send: "/experience" },
  { label: "Contact", send: "/contact" },
];
