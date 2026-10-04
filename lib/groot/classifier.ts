/**
 * classifier.dev client — the switch between the intent table and Gemini.
 *
 * ## What this call is for
 *
 * `intents.ts` answers a fixed set of questions for free, instantly, and
 * identically every time. Everything else has to go to a language model, which
 * costs money and adds a round trip. This call is the thing that decides which
 * of the two happens, and it is the only reason the LLM path does not simply
 * run on every message.
 *
 * The provider is given two labels and no third option on purpose. There is no
 * "none of the above" outcome here: something always happens, the only question
 * is which path produces it, and a label set needs a real outcome for every
 * input or the classifier is guessing.
 *
 * ## `share_data: false` is load-bearing, in two places
 *
 * classifier.dev switched to opt-out training retention on 2026-10-04. That
 * means an omitted flag retains visitor transcripts for training. Opting out
 * requires **both** of:
 *
 *   - the `X-Classifier-Share-Data: false` request header, and
 *   - `share_data: false` in the request body.
 *
 * Dropping either one silently re-enables retention of what people type into a
 * portfolio chat widget, which is exactly the kind of input that should never
 * reach a training set. If this block ever looks like a redundant duplicate,
 * it is not — do not "simplify" it away.
 *
 * ## Why the timeout is shorter than Gemini's
 *
 * The classifier is an optimisation, not a dependency. Every outcome it produces
 * is reproducible without it: `routeOutcomeFor` degrades to the model, and
 * `outageOutcomeFor` below degrades to the model as well. So the right way for a
 * slow classifier to fail is early, while there is still budget in the request
 * for the actual answer. At `LLM_TIMEOUT_MS` it would instead add its own
 * timeout on top of the model's, and the visitor would wait out both.
 */

import { INTENTS, normalize } from "./intents";
import {
  type PromptTurn,
  ROUTE_CONFIDENCE_THRESHOLD,
  ROUTE_LABEL_MODEL,
  ROUTE_LABELS,
  buildRouteInput,
  buildRouteInstruction,
} from "./prompt";

const CLASSIFIER_URL = "https://classifier.dev/v1/classify";

/**
 * Hard ceiling on the classifier call, enforced with `AbortSignal.timeout` so a
 * hung socket cannot outlive it. Must stay below `LLM_TIMEOUT_MS` - see the
 * note at the top of this file.
 *
 * 2.5s is comfortably above the provider's "fast" tier on a warm connection and
 * comfortably below the point where a visitor decides the orb is broken.
 */
export const CLASSIFIER_TIMEOUT_MS = 2500;

const SHARE_DATA_HEADER = "X-Classifier-Share-Data";

/** Which path produces the visitor-visible reply. */
export type RouteOutcome = "deterministic" | "llm";

export type ClassifierFailure =
  /** Aborted by `AbortSignal.timeout`. */
  | "timeout"
  /** DNS, TLS, connection reset — fetch threw. */
  | "network"
  /** Non-200 from the provider. */
  | "http"
  /** 200, but no usable `results[0]`. */
  | "malformed";

/** A usable routing answer, including a `null` confidence. */
export interface ClassifierDecision {
  ok: true;
  /** The chosen label, verbatim. Compared against `ROUTE_LABELS`. */
  label: string;
  /**
   * 0..1, or `null` when the provider returned no score.
   *
   * `null` means "unscored", not "zero". It is kept as a distinct value all the
   * way to the branch instead of being coerced, because coercing it to 0 would
   * silently turn "the provider told us nothing" into "the provider said no".
   * Both route to the model, but only one of them is a claim about confidence.
   */
  confidence: number | null;
}

export interface ClassifierUnavailable {
  ok: false;
  reason: ClassifierFailure;
  /** HTTP status, when there was a response. Server-side logging only. */
  status?: number;
}

export type ClassifierResult = ClassifierDecision | ClassifierUnavailable;

/**
 * Short body snippet for the server log.
 *
 * Truncated hard and wrapped: this text goes to the console, never to the
 * client, and it must not be able to drag a whole upstream payload — or an
 * echoed request body containing a visitor transcript — into the log line.
 */
async function readErrorSnippet(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.replace(/\s+/g, " ").slice(0, 200);
  } catch {
    return "<unreadable body>";
  }
}

/**
 * Ask classifier.dev whether the fixed table can answer this message.
 *
 * Never throws and never returns a raw `Response`: every failure mode is folded
 * into `ClassifierUnavailable` so the route has exactly two cases to handle.
 */
export async function classifyRoute(args: {
  turns: readonly PromptTurn[];
  question: string;
  agentName: string;
}): Promise<ClassifierResult> {
  // Optional on purpose. With no key the request still goes out unauthenticated
  // and the provider decides; sending a bad header would be worse than sending
  // none. An unauthenticated 401 lands in `outageOutcomeFor` like any other
  // outage, which is the correct behaviour for "routing is unavailable".
  const key = process.env.CLASSIFIER_API_KEY?.trim();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // See the header comment: required alongside the body field. Do not drop.
    [SHARE_DATA_HEADER]: "false",
  };
  if (key) headers.Authorization = `Bearer ${key}`;

  const body = {
    inputs: [
      buildRouteInput({
        turns: args.turns,
        question: args.question,
        agentName: args.agentName,
      }),
    ],
    labels: [...ROUTE_LABELS],
    instructions: buildRouteInstruction({ agentName: args.agentName }),
    // Required alongside the header. Do not drop. See the file comment.
    share_data: false,
    // "fast" is the cheap, low-latency tier. This call runs in front of every
    // message, so it has to be cheap; accuracy is bought back by the 0.85
    // threshold in `routeOutcomeFor` instead.
    tier: "fast",
  };

  try {
    const response = await fetch(CLASSIFIER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(CLASSIFIER_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      const snippet = await readErrorSnippet(response);
      // Status and snippet only — never the key, never the transcript.
      console.error(`[groot/classifier] HTTP ${response.status}: ${snippet}`);
      return { ok: false, reason: "http", status: response.status };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      console.error("[groot/classifier] 200 with a body that is not JSON");
      return { ok: false, reason: "malformed" };
    }

    const results = (payload as { results?: unknown } | null)?.results;
    // `results` aligns with `inputs`, and exactly one input is sent, so a short
    // or empty array means the provider did not answer our question at all.
    if (!Array.isArray(results) || results.length === 0) {
      console.error("[groot/classifier] 200 with no results[]");
      return { ok: false, reason: "malformed" };
    }

    const first = results[0] as { label?: unknown; confidence?: unknown } | undefined;
    if (!first || typeof first.label !== "string") {
      console.error("[groot/classifier] results[0] has no label");
      return { ok: false, reason: "malformed" };
    }

    // `confidence` is genuinely nullable on the wire. Anything that is not a
    // finite number — absent, null, a string, NaN — is normalised to null,
    // which `routeOutcomeFor` treats as "not confident".
    const raw = first.confidence;
    const confidence =
      typeof raw === "number" && Number.isFinite(raw) ? raw : null;

    return { ok: true, label: first.label, confidence };
  } catch (error) {
    // `AbortSignal.timeout` aborts with a `TimeoutError` DOMException; an
    // explicit caller abort would be an `AbortError`. Everything else that
    // reaches here is a transport failure.
    const name = (error as { name?: string } | null)?.name;
    if (name === "TimeoutError" || name === "AbortError") {
      console.error(`[groot/classifier] timed out after ${CLASSIFIER_TIMEOUT_MS}ms`);
      return { ok: false, reason: "timeout" };
    }
    console.error("[groot/classifier] request failed:", error);
    return { ok: false, reason: "network" };
  }
}

/**
 * Which path a successful classifier answer selects.
 *
 * Unrecognised labels land on the model. A label this build has never heard of
 * is not evidence that the table is sufficient, so it cannot be used to skip
 * the model — the safe reading of an unknown label is "ask someone who can
 * actually answer".
 */
export function routeOutcomeFor(decision: ClassifierDecision): RouteOutcome {
  if (decision.label === ROUTE_LABEL_MODEL) return "llm";

  if (
    decision.label === ROUTE_LABELS[0] &&
    decision.confidence !== null &&
    decision.confidence >= ROUTE_CONFIDENCE_THRESHOLD
  ) {
    return "deterministic";
  }

  // Below threshold, or an unscored (null) confidence, or an unknown label.
  return "llm";
}

/**
 * Which path to take when the classifier itself is unavailable — no key, a 5xx,
 * a timeout, or a 200 it could not parse.
 *
 * ## Why an outage routes *toward* the model
 *
 * The obvious fallback is "decline to answer when you cannot classify". That is
 * backwards. The table can only ever produce a reply for input it recognises,
 * and an outage tells us nothing about whether *this* input is one it
 * recognises. Declining on an infrastructure blip would mean the visitor sees
 * nothing precisely because our own dependency was down — the failure would be
 * ours, invisible to them, and unfixable from the client. Routing to the model
 * instead means an outage costs money and latency but still produces an answer,
 * and for a table-shaped question the model is also correct.
 *
 * ## The bar is deliberately high
 *
 * Only an *exact* command or a single *exact* keyword is trusted here
 * (`/projects`, `projects`). That is a literal string comparison against the
 * table's own vocabulary, so it cannot be wrong about a message the table has
 * never seen — and it is precisely the case where paying for a model call to
 * say "four projects" is the worst possible trade. Everything else goes to the
 * model, because everything else is the case where the table would say
 * "nothing on that one".
 */
export function outageOutcomeFor(text: string): RouteOutcome {
  const normalized = normalize(text);
  if (!normalized) return "llm";

  for (const intent of INTENTS) {
    if (intent.command && normalized === intent.command) return "deterministic";
    for (const keyword of intent.keywords) {
      if (normalize(keyword) === normalized) return "deterministic";
    }
  }

  return "llm";
}
