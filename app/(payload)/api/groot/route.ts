import { z } from "zod";

import { AGENT_NAME } from "@/lib/groot/agent";
import { classifyRoute, outageOutcomeFor, routeOutcomeFor } from "@/lib/groot/classifier";
import { askGroot } from "@/lib/groot/llm";
import { UNKNOWN_INTENT_ID, classify } from "@/lib/groot/intents";
import type { IntentId } from "@/lib/groot/intents";
import { DEFAULT_EMOTION, EMOTION_EMOJI, EMOTION_IDS, type EmotionId } from "@/lib/groot/emotion";
import type { PromptTurn } from "@/lib/groot/prompt";

/**
 * `POST /api/groot` — the server half of the chat widget.
 *
 * The route does five things and nothing else: validate, rate limit, ask
 * classifier.dev which path to take, take it, respond. Every decision worth
 * arguing about lives in the module that owns it — `lib/groot/prompt.ts` for
 * wording, `lib/groot/intents.ts` for the table, `lib/groot/classifier.ts` for
 * routing, `lib/groot/llm.ts` for the model call — so this file stays a
 * readable trace of the flow rather than a place where the rules hide.
 *
 * The order of those five is not arbitrary. Validation runs *before* the rate
 * limiter on purpose: a malformed body is not a visitor trying to talk to us, it
 * is a client bug or a probe, and charging it against that visitor's budget
 * would let anyone else burn their allowance by sending them garbage.
 *
 * ## Degradation
 *
 * There is a working answer for every input that passes validation, which means
 * this route returns 200 far more often than it returns an error. Missing keys,
 * a dead classifier, a deprecation 404 and a blocked prompt all end the same
 * way: the intent table's own reply, with `mode: "deterministic"` to say so.
 * `mode` describes where the text actually came from, so the client never has
 * to guess whether it is looking at a model answer or a table answer.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `POST` only. Not in the contract, but worth answering explicitly: without an
 * exported `GET` a `GET /api/groot` would fall through to Payload's catch-all
 * at `../[...slug]/route.ts` and return a CMS error page instead of anything
 * shaped like this API. It reuses `bad_request` so the client only ever has to
 * parse one error union, and it never touches the limiter — a `GET` is not a
 * message and should not cost a visitor one of their twenty.
 */
export async function GET(): Promise<Response> {
  return Response.json(
    { ok: false, error: "bad_request" },
    { status: 405, headers: { Allow: "POST" } },
  );
}

/**
 * Per-IP fixed-window limiter, 20/minute.
 *
 * A copy of the pattern in `../contact/route.ts` rather than a shared helper,
 * because the two limits are deliberately different and a shared constant is how
 * one of them quietly becomes the other. `/api/contact` takes 5/minute, which
 * is right for a form: a person fills one in once. Chat is a conversation, and
 * 5/minute breaks a normal three-message exchange mid-sentence, which reads to
 * the visitor as the site breaking rather than as a limit.
 *
 * The bucket is separate in practice because this module has its own map —
 * touching `/api/contact` cannot consume a chat allowance, or the reverse.
 *
 * In-memory on purpose, for the same reason as the contact route: a serverless
 * instance is disposable, so this is a speed bump against casual abuse, not a
 * security boundary. Real rate limiting belongs at the edge.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length > MAX_PER_WINDOW;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-nf-client-connection-ip") ?? "unknown";
}

const MAX_TEXT_CHARS = 2_000;
const MAX_TURNS = 40;
const MAX_TURN_CHARS = 1_000;

const TurnSchema = z.object({
  from: z.enum(["visitor", "groot"]),
  text: z.string().trim().min(1).max(MAX_TURN_CHARS),
});

/**
 * `turns` is optional so the first message of a session does not have to send an
 * empty array — but 40 is the ceiling, well above `MAX_TRANSCRIPT_TURNS` (12) in
 * `lib/groot/prompt.ts`, which is where the transcript is actually truncated.
 * The looser bound here is on the wire: it keeps a runaway client from
 * uploading a novel, not an excuse to send 40 turns to a provider.
 */
const RequestSchema = z.object({
  text: z.string().trim().min(1).max(MAX_TEXT_CHARS),
  turns: z.array(TurnSchema).max(MAX_TURNS).default([]),
  emotion: z.enum(EMOTION_IDS as [EmotionId, ...EmotionId[]]).optional(),
});

type ReplyMode = "deterministic" | "llm";

type GrootError = "bad_request" | "rate_limited" | "unavailable";

const ERROR_STATUS: Record<GrootError, number> = {
  bad_request: 400,
  rate_limited: 429,
  unavailable: 503,
};

/**
 * Failures carry a code and nothing else.
 *
 * No upstream text, no status body, no key, no stack. The visitor has no use for
 * any of it and it can carry their own transcript back out; detail goes to
 * `console.error` in the modules that own it, where an operator can read it.
 */
function fail(error: GrootError): Response {
  return Response.json({ ok: false, error }, { status: ERROR_STATUS[error] });
}

function succeed(args: {
  mode: ReplyMode;
  reply: string;
  intentId: IntentId | null;
  confidence: number;
  emotion?: EmotionId;
}): Response {
  return Response.json({ ok: true, ...args });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("bad_request");
  }

  // Before the limiter. See the file comment.
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail("bad_request");
  }

  if (rateLimited(clientIp(request))) {
    return fail("rate_limited");
  }

  const text = parsed.data.text;
  const turns: PromptTurn[] = parsed.data.turns;

  try {
    // The table's own answer for this text. Computed once and reused by both
    // deterministic branches — it is a pure function over strings, so this costs
    // microseconds and cannot fail.
    const local = classify(text);
    const tableReply = local.intent.reply.trim();

    /**
     * The table's reply, or null when it has nothing to say.
     *
     * `unknown` always has a written reply, so the null is unreachable through
     * `classify` today — but `handoff` carries an empty one, and an empty bubble
     * in front of a visitor is worse than one extra model call.
     */
    const tableResponse = (): Response | null =>
      tableReply
        ? succeed({
            mode: "deterministic",
            reply: tableReply,
            intentId: local.intent.id,
            confidence: local.confidence,
          })
        : null;

    /*
      No usable key means no model path, and no point paying for a routing
      decision whose only possible outcome would be a call we cannot make.
      Skipping the classifier here also keeps visitor text off a third party
      entirely when this site is running as a pure lookup table.

      This checks *any* provider, not just Gemini. It used to test
      `GEMINI_API_KEY` alone, which quietly made the OpenRouter tier
      unreachable in exactly the deployment it exists for — a site provisioned
      with only an OpenRouter key, or one whose Gemini key was revoked, would
      have run as a plain lookup table while a working fallback sat right there
      unused. `askGroot` already skips providers whose key is absent, so the
      honest question is only whether *any* of them can answer.
    */
    const hasModelKey =
      Boolean(process.env.GEMINI_API_KEY?.trim()) ||
      Boolean(process.env.OPENROUTER_API_KEY?.trim());

    if (!hasModelKey) {
      return tableResponse() ?? fail("unavailable");
    }

    const routed = await classifyRoute({ turns, question: text, agentName: AGENT_NAME });

    // One rule, two sources: a live routing decision, or — when routing is
    // unavailable — the exact-command fallback. Both live in `lib/groot/`
    // because both are decisions about routing, and neither can make a network
    // call.
    const outcome = routed.ok ? routeOutcomeFor(routed) : outageOutcomeFor(text);

    if (outcome === "deterministic" && local.intent.id !== UNKNOWN_INTENT_ID) {
      return tableResponse() ?? fail("unavailable");
    }

    /*
      The classifier's whole job is to choose between two things: an action the
      intent table can perform, and the model. It is not a third vote on whether
      to answer, and it cannot supply content.

      So when it says "table" but the table landed on `unknown`, there is no
      action to perform and nothing to say — which is not a reason to decline, it
      is a reason to ask the model. Returning `unknown`'s written reply here is
      what made a reachable model look broken: the visitor got "Groot does not
      know that" for a question Groot could have answered, and the only trace was
      a `deterministic` mode on a response that had never tried.

      `unknown`'s reply is still the right answer in the two places where the
      model genuinely cannot be reached — no key configured, and `answer.ok ===
      false` below. Those are the only two, and that is the rule: the fallback
      exists for an unreachable model, never for a reachable one.
    */

    const answer = await askGroot({
      question: text,
      turns,
      agentName: AGENT_NAME,
      emotion: parsed.data.emotion,
    });

    // `ok === false` rather than `!ok`: this repo runs with `strictNullChecks`
    // off, where truthiness does not narrow a boolean discriminant and `!ok`
    // would leave `answer` as the full union.
    if (answer.ok === false) {
      // No usable model reply — blocked, absent `candidates`, timed out, missing
      // key, deprecation 404. The table reply is the visitor's answer, so it is
      // reported as `deterministic`: that is what it is.
      console.error(`[groot] falling back to the table: ${answer.reason}`);
      return tableResponse() ?? fail("unavailable");
    }

    // `intentId` is null because no intent produced this text. Sending an
    // intent id here would let the widget fire a section scroll off a reply
    // that has nothing to do with that section.
    const moodChanged = Boolean(answer.emotion) && answer.emotion !== (parsed.data.emotion ?? DEFAULT_EMOTION);
    const emoji = answer.emoji ?? (answer.emotion ? EMOTION_EMOJI[answer.emotion] : "");

    return succeed({
      mode: "llm",
      reply: moodChanged && emoji ? `${emoji} ${answer.text}` : answer.text,
      intentId: null,
      confidence: local.confidence,
      emotion: answer.emotion,
    });
  } catch (error) {
    // Last resort. Nothing above should throw, but an unexpected crash must not
    // become a stack trace or an upstream message on a public endpoint.
    console.error("[groot] unhandled error:", error);
    return fail("unavailable");
  }
}
