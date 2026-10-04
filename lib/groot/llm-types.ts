/**
 * Shared surface for every model provider in `lib/groot/`.
 *
 * Nothing here performs I/O. It exists so that `gemini.ts` and `openrouter.ts`
 * can be written as independent clients — different endpoints, different
 * response shapes, different ways of expressing "stopped for a reason" — while
 * still looking like one function to the ladder in `llm.ts`. The ladder should
 * not be able to tell which provider answered it, and `CallOutcome` is the
 * reason it does not have to.
 *
 * ## Two budgets, one number each
 *
 * The reply length cap and the temperature are shared rather than per-provider,
 * because they describe the *answer*, not the vendor: if Gemini is configured to
 * write at most 300 tokens at 0.7, a fallback that is allowed 400 at 0.9 is not
 * a fallback for the same product, it is a different product with the same
 * prompt. Same for the timeout — the visitor is waiting on the whole ladder, so
 * a per-provider timeout that drifts upwards turns a slow provider into a slow
 * site.
 */

import type { EmotionId } from "./emotion";
import type { PromptTurn } from "./prompt";

/**
 * Total budget for one model attempt, enforced with `AbortSignal.timeout`.
 * Formerly `GEMINI_TIMEOUT_MS` in `llm.ts`; now shared, because the ladder can
 * make more than one kind of call and the wait has to be bounded once.
 *
 * Deliberately larger than `CLASSIFIER_TIMEOUT_MS` in `./classifier.ts`: by the
 * time this runs, the classifier's share of the budget is already spent or
 * already skipped, and this is the call that produces the answer. A flash-lite
 * reply capped at {@link LLM_MAX_TOKENS} is normally well under a second.
 */
export const LLM_TIMEOUT_MS = 8000;

/**
 * Hard ceiling on the reply, in tokens, for every provider.
 *
 * `GROOT_VOICE` tells the model never to go past 40 words, so 300 is roughly
 * three times the intended answer — enough headroom that a chatty free-tier
 * model still finishes rather than being cut off, and low enough that a runaway
 * generation cannot turn into a large bill or a wall of text in the widget.
 */
export const LLM_MAX_TOKENS = 300;

/**
 * Sampling temperature for every provider.
 *
 * Below 1 on purpose: the failure mode for a portfolio assistant is a confident
 * invention about someone's employer, and low temperature is the cheapest
 * mitigation available that costs nothing to implement.
 */
export const LLM_TEMPERATURE = 0.7;

/** What `askGroot` is given. One question plus the session it was asked in. */
export interface AskArgs {
  question: string;
  /**
   * The session so far. Truncated inside `buildAnswerPrompt`, so a long
   * conversation cannot grow the request without bound.
   */
  turns: readonly PromptTurn[];
  agentName: string;
  emotion?: EmotionId;
}

export type LlmFailure =
  /** Neither provider key is set. The table has to carry the site on its own. */
  | "no_key"
  /** Aborted by `AbortSignal.timeout`. */
  | "timeout"
  /** DNS, TLS, connection reset — fetch threw. */
  | "network"
  /** Non-200 that was not one of `ADVANCE_ON_STATUS`. */
  | "http"
  /** Every model on the ladder was gone or out of quota. */
  | "model_unavailable"
  /** HTTP 200 with no candidates/choices at all. */
  | "no_candidates"
  /** HTTP 200, but the provider did not report a clean stop. */
  | "unusable_finish"
  /** HTTP 200, a clean stop, but nothing but whitespace came back. */
  | "empty";

export interface LlmAnswer {
  ok: true;
  /** The reply, trimmed and ready to send. */
  text: string;
  /**
   * Which model actually answered. Server-side logging only.
   *
   * A plain `string`, not a union of the ids we happen to configure: the ladder
   * has more than one provider and OpenRouter's catalogue is not a set we own,
   * so there is no closed list to narrow to. The value is only ever compared by
   * a human reading a log line.
   */
  model: string;
  /** Mood the model reported for this turn, if it reported a valid one. */
  emotion?: EmotionId;
  /** Emoji the model chose for this turn's mood, if it gave a valid one. */
  emoji?: string;
}

export interface LlmFailureResult {
  ok: false;
  reason: LlmFailure;
  /**
   * Diagnostic for the server log — an upstream finish reason, an HTTP status.
   * Never returned to the client, and never the key.
   */
  detail?: string;
}

export type LlmResult = LlmAnswer | LlmFailureResult;

/**
 * Per-attempt outcome. Every provider client resolves to this and nothing else.
 *
 * `advance` is separated from the other failures because it is the only one that
 * earns a try on the next model. Everything else is terminal for the whole
 * request — including `unusable_finish`, because a block or a truncated
 * generation is a property of the prompt and the content, not of the model, and
 * would come back identically from the next id (and from the next provider).
 */
export type CallOutcome =
  | { kind: "ok"; text: string }
  | { kind: "advance"; status: number }
  | { kind: "failed"; failure: LlmFailure; detail?: string };

/**
 * Statuses that earn a try on the next model.
 *
 * 404 — the id no longer exists. 429 — *this model's* free-tier quota is spent.
 * For Gemini that quota is per-model rather than per-key, so the next id has its
 * own budget; OpenRouter's free allowance is per-account and shared by every free
 * model, so a 429 there is a signal to try a different model anyway rather than
 * to give up on the provider. 500/502/503/504 — transient upstream trouble, most
 * likely to clear in the ~1s the next attempt costs.
 *
 * Deliberately excluded: 400, 401, 403. Those describe the request or the key
 * rather than the model, so they repeat identically on the next id while making
 * the visitor wait twice as long for the same outcome.
 */
export const ADVANCE_ON_STATUS: ReadonlySet<number> = new Set([
  404, 429, 500, 502, 503, 504,
]);

/**
 * Narrow an unknown JSON value to something whose properties can be read.
 *
 * Exported rather than duplicated: both providers parse a body they do not
 * control, and a per-file copy of this is how the two clients drift apart on
 * what counts as malformed.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
