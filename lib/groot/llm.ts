/**
 * The provider ladder, and the only surface the route knows about.
 *
 * `app/(payload)/api/groot/route.ts` imports `askGroot` from here and nothing
 * else. It hands over a question and gets back a `LlmResult` — a reply or a
 * reason, never an exception — because the caller's answer to every possible
 * failure is the same: send the intent table's reply instead.
 *
 * ## Shape of the ladder
 *
 *   Gemini   gemini-2.5-flash-lite → gemini-3.5-flash-lite
 *   OpenRouter  four free models, swept and chosen — see ./openrouter.ts
 *
 * Providers are tried in that order, model by model, and each attempt is one
 * HTTP request with its own budget. The order is the design:
 *
 *   - **Gemini first because it is the better model for this job.** `GROOT_VOICE`
 *     is an instruction-following prompt about a fixed set of facts, and a paid
 *     flash-lite model follows it. It also keeps the visitor's transcript off a
 *     third party that aggregates it for a public leaderboard.
 *   - **OpenRouter last because its allowance is 50 requests a day, shared
 *     across every free model.** It is a genuine fallback for a Gemini outage
 *     and a way to keep answering after Gemini's quota is gone, but it is not a
 *     capacity plan, and nothing should ever reach it while Gemini is healthy.
 *
 * ## Two keys, and why one missing key does not end the request
 *
 * The keys are independent. They are provisioned separately, they have separate
 * quotas, and either can be absent, exhausted or revoked while the other works —
 * which is the exact situation a fallback provider exists to survive. So a
 * missing key *skips its provider* instead of failing the request, and only
 * having no key for every provider returns `no_key`.
 *
 * Keys are read per call rather than at module scope, so the value comes from the
 * runtime environment rather than from whenever the module happened to be first
 * evaluated — the old Gemini-only code did the same, and it is why adding a key
 * to the deployment takes effect without a rebuild.
 *
 * Caveat worth knowing before anyone relies on the OpenRouter tier: the route
 * short-circuits to the table when `GEMINI_API_KEY` is unset, before it ever
 * calls in here. So the OpenRouter tier is reachable only while a Gemini key is
 * configured — which is the intended "Gemini is broken, not absent" case, but it
 * does mean an OpenRouter-only deployment still runs as a pure lookup table.
 *
 * ## Three outcomes, and only one of them continues
 *
 * Every provider client resolves to the same `CallOutcome`:
 *
 *   - `ok` — return it. The first model that answers wins; nothing downstream
 *     gets to improve on a reply the visitor is already waiting for.
 *   - `advance` — the failure is about *this model*, so try the next one. 404, 429
 *     and the 5xx family. See `ADVANCE_ON_STATUS`; the 429 case is the one that
 *     matters, because a quota error is exactly when another model helps.
 *   - `failed` — return it immediately, for the whole request. 400/401/403, a
 *     timeout, a network failure, an empty reply, and `unusable_finish`.
 *
 * `unusable_finish` being terminal across providers is deliberate and is the
 * reason the ladder cannot leak a blocked answer: a `SPII` or `SAFETY` verdict is
 * about the content of the prompt, not about which vendor read it, so it would
 * come back from OpenRouter too. The same reasoning rejects a reply the provider
 * truncated mid-sentence. In both cases the correct answer is the table's, and the
 * cheapest way to get it is to stop.
 *
 * ## Where the file boundaries are
 *
 * The request shapes, the response parsing and the vendor-specific reasoning all
 * live in the provider modules — `./gemini.ts` and `./openrouter.ts`. This file
 * owns only the ordering and the key handling, because those are the parts where
 * a third provider would force a change. The shared vocabulary is in
 * `./llm-types.ts`, so no provider module has to import another to satisfy the
 * ladder's type.
 */

import { GROOT_MODELS, callGemini } from "./gemini";
import { type AskArgs, type CallOutcome, type LlmResult } from "./llm-types";
import { OPENROUTER_MODELS, callOpenRouter } from "./openrouter";

/**
 * Re-exported so the route keeps one import path for the whole surface. These
 * live in `./llm-types` because both providers produce them; nothing about them
 * is Gemini-specific any more, and re-exporting keeps `@/lib/groot/llm` the only
 * module the route has to know about.
 */
export type {
  AskArgs,
  LlmAnswer,
  LlmFailure,
  LlmFailureResult,
  LlmResult,
} from "./llm-types";

/**
 * Ceiling on the whole ladder, not on one attempt.
 *
 * Six models at `LLM_TIMEOUT_MS` apne apne is 48 seconds of a visitor watching
 * a blinking cursor, which is worse than the table's honest "groot does not know
 * that". Per-attempt timeouts do not prevent that — they *enable* it, because a
 * timeout is what lets the next rung start.
 *
 * So the ladder also carries a deadline, checked before each new attempt. It is
 * generous enough that a healthy provider has never been cut off (measured: ~1s
 * for a 2.5 reply, ~1-3s for the OpenRouter models) and short enough that the
 * worst case is a few seconds of waiting followed by the table's answer.
 */
const LADDER_BUDGET_MS = 16_000;

/**
 * One rung: the model, and a call already bound to that model and its key.
 *
 * The model is closed over rather than passed to `run` so both providers can keep
 * their own id type — `GrootModel` and `OpenRouterModel` are different unions,
 * and a single `(model: string, ...)` signature would flatten them for no gain.
 */
interface Attempt {
  /** Which module produced it, for the log line when the ladder gives up. */
  provider: "gemini" | "openrouter";
  model: string;
  run: (args: AskArgs) => Promise<CallOutcome>;
}

/**
 * Ask the model, in Groot's voice, about the visitor's question.
 *
 * `turns` is the session so far and is truncated inside `buildAnswerPrompt`, so
 * a long conversation cannot grow the request without bound.
 *
 * Resolves to `LlmResult`. Every failure — including a missing key, a timeout, a
 * blocked prompt and a deprecation 404 — is a value, never an exception.
 *
 * Bounded by `LADDER_BUDGET_MS` across all providers, so a visitor is never left
 * waiting on a six-model chain.
 */
export async function askGroot(args: AskArgs): Promise<LlmResult> {
  // Read per call rather than at module scope so the key is picked up from the
  // runtime environment instead of from whenever the module happened to be first
  // evaluated.
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();

  const attempts: Attempt[] = [];

  if (geminiKey) {
    for (const model of GROOT_MODELS) {
      attempts.push({
        provider: "gemini",
        model,
        run: (a) => callGemini(model, geminiKey, a),
      });
    }
  }

  if (openRouterKey) {
    for (const model of OPENROUTER_MODELS) {
      attempts.push({
        provider: "openrouter",
        model,
        run: (a) => callOpenRouter(model, openRouterKey, a),
      });
    }
  }

  // Reached only when every provider was skipped, i.e. neither key is usable.
  // Checking the built list rather than the two keys means an empty model list
  // cannot produce a ladder that silently answers nothing.
  //
  // Not an error. The site is expected to work as a pure lookup table with no
  // keys configured, and the route turns this into the deterministic reply.
  if (attempts.length === 0) {
    return { ok: false, reason: "no_key" };
  }

  let lastAdvanced: Attempt["provider"] | null = null;

  const startedAt = Date.now();

  for (const attempt of attempts) {
    // Checked *before* starting an attempt, not after one finishes: an attempt
    // that begins with 200ms of budget left would be allowed to spend its full
    // `LLM_TIMEOUT_MS` anyway, which is the hang this deadline exists to stop.
    const spent = Date.now() - startedAt;
    if (spent >= LADDER_BUDGET_MS) {
      console.error(
        `[groot/llm] ladder budget of ${LADDER_BUDGET_MS}ms spent after ${attempts.indexOf(attempt)} attempts — falling back to the table`,
      );
      return { ok: false, reason: "timeout", detail: String(spent) };
    }

    const outcome = await attempt.run(args);

    if (outcome.kind === "ok") {
      return { ok: true, text: outcome.text, model: attempt.model };
    }

    // This model is gone or out of quota. The next rung has its own budget, so
    // try it — see the file comment on why 429 has to land here.
    if (outcome.kind === "advance") {
      // Kept so the exhaustion log below can name which provider ran out of
      // models, which is the first question anyone asks about a
      // `model_unavailable` at 3am.
      lastAdvanced = attempt.provider;
      continue;
    }

    // Terminal for the whole request. See the file comment.
    return { ok: false, reason: outcome.failure, detail: outcome.detail };
  }

  // Every configured model refused us for a model-specific reason — all gone, or
  // all out of quota. Adding more ids is the only fix, and there is nothing for
  // the route to do but fall back to the table.
  console.error(
    `[groot/llm] all ${attempts.length} configured models advanced (last: ${lastAdvanced}) — falling back to the table`,
  );
  return { ok: false, reason: "model_unavailable" };
}
