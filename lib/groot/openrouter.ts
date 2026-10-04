/**
 * OpenRouter client — the last resort, and the only provider on this site that
 * costs nothing.
 *
 * It exists because a chat widget that degrades to a lookup table the moment
 * Gemini's free tier runs out looks broken to the visitor, and because Gemini's
 * quota is per-model while OpenRouter's is a separate, independent pool: one
 * provider being exhausted says nothing about the other. What it is not is a
 * co-equal option. This is the bottom of the ladder in `llm.ts`, reached only
 * after both Gemini models have declined, and it is written to fail quietly.
 *
 * ## Why these four models and not the other thirteen
 *
 * `OPENROUTER_MODELS` is the result of sweeping **all 17 free models** OpenRouter
 * listed against the real prompt — the real `GROOT_VOICE`, the real
 * `buildAnswerPrompt`, `max_tokens: 300` — on **2026-10-04**. It is four entries
 * long on purpose, for two measured reasons.
 *
 * **(a) Five free models were returning HTTP 429 at the time of the sweep.** They
 * are not listed because an id that is rate-limited on the one day we probed it
 * tells us nothing about its answer quality, and an id that 429s in production
 * is worse than no id at all.
 *
 * **(b) The free tier is dominated by reasoning models, and reasoning models
 * cannot answer this prompt.** They spend the entire `max_tokens: 300` budget on
 * hidden thinking tokens and return an empty message. Measured, one word or
 * nothing at all from each:
 *
 *   - `nvidia/nemotron-3-ultra-550b-a55b`
 *   - `nvidia/nemotron-3-super-120b-a12b`
 *   - `qwen/qwen3.8-27b`
 *   - `apodex/apodex-1.1-mini`
 *   - `dots-studio/dots-3-note-preview`
 *
 * And `nvidia/nemotron-3.5-lightning` is the failure mode that matters: after 11
 * seconds it returned **176 words of its own chain-of-thought as the reply**. That
 * is not a short answer, it is not truncated, and no finish-reason check catches
 * it — the model genuinely finished. The only defence is not to send visitor text
 * to that class of model, so reasoning ids stay out of the list.
 *
 * `nvidia/nemotron-3.5-content-safety` is out for a different reason: it is a
 * classifier, not a chat model, and it answered the visitor's question with
 * `User Safety: safe`.
 *
 * **Do not add an id back without probing it first**, with the real prompt and
 * the real 300-token cap, and reading the actual reply rather than just the
 * status code. The free catalogue changes weekly and a passing HTTP 200 is not
 * evidence of an answer.
 *
 * ## The account constraint that puts this file last
 *
 * Free-model requests on a free account are capped at **50 per day, shared across
 * every free model** — not per model, not per hour. Fifty visitor conversations a
 * day is the entire allowance, so a single bug that reached this provider while
 * Gemini was healthy would spend the month's budget in minutes. That is the whole
 * reason the ladder tries Gemini first and this tier last, and the reason nothing
 * in this file retries.
 *
 * ## No `HTTP-Referer`
 *
 * OpenRouter accepts it and uses it only to attribute usage on its public
 * rankings page. The repo has no production site URL in the environment:
 * `NEXT_PUBLIC_SERVER_URL` exists but is documented in `.env.example` as a local
 * development value (`http://localhost:3000`), and the canonical URL lives in the
 * Payload `siteSettings` global, which a `lib/groot/` module cannot read without
 * importing the CMS config. Sending a localhost referer would be worse than
 * sending none, so the header is omitted rather than invented.
 */

import {
  type AskArgs,
  type CallOutcome,
  ADVANCE_ON_STATUS,
  isRecord,
  LLM_MAX_TOKENS,
  LLM_TEMPERATURE,
  LLM_TIMEOUT_MS,
} from "./llm-types";
import { GROOT_VOICE, buildAnswerPrompt } from "./prompt";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

/**
 * Attempted in order. See the file comment for how this list was measured and
 * why it is four entries rather than seventeen.
 */
export const OPENROUTER_MODELS = [
  "poolside/laguna-s-2.1:free",
  "inclusionai/ling-3.0-flash-sante:free",
  "liquid/lfm-2.5-2.6b:free",
  "cohere/north-mini-code:free",
] as const;

export type OpenRouterModel = (typeof OPENROUTER_MODELS)[number];

/**
 * OpenRouter's spelling of the two shared budgets. See the note in `gemini.ts`:
 * same numbers, different key names, and both must track `llm-types.ts`.
 *
 * `max_tokens` is the OpenAI-compatible field name. `max_completion_tokens` is
 * the newer one and is the only field the reasoning models respect, which is
 * another way of saying those models will not answer us within any cap we would
 * be willing to pay for.
 */
const GENERATION_CONFIG = {
  temperature: LLM_TEMPERATURE,
  max_tokens: LLM_MAX_TOKENS,
} as const;

/**
 * One attempt against one free model. Never throws.
 *
 * The response handling is deliberately the same shape as `callGemini` in
 * `./gemini.ts`, so the ladder has one code path to reason about: `advance` on
 * the same statuses, `no_candidates` for a 200 with nothing in it,
 * `unusable_finish` for anything but a clean stop, `empty` for whitespace.
 */
export async function callOpenRouter(
  model: OpenRouterModel,
  apiKey: string,
  args: AskArgs,
): Promise<CallOutcome> {
  const url = `${OPENROUTER_BASE}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // OpenRouter is the one provider here where a bearer token in a header is
    // the documented and expected shape.
    Authorization: `Bearer ${apiKey}`,
    // Names this app on the provider's dashboard. It is an attribution label,
    // not an identifier, so a static string is the whole of what it needs to be.
    "X-Title": "ayush-nexus-groot",
  };

  const body = {
    model,
    messages: [
      // OpenRouter has no `systemInstruction`; the system role is the
      // equivalent, and it is the position the voice has to sit in for it to be
      // followed over the transcript inside the user turn.
      { role: "system", content: GROOT_VOICE },
      {
        role: "user",
        content: buildAnswerPrompt({
          question: args.question,
          turns: args.turns,
          agentName: args.agentName,
          emotion: args.emotion,
        }),
      },
    ],
    ...GENERATION_CONFIG,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      if (ADVANCE_ON_STATUS.has(response.status)) {
        console.error(`[groot/openrouter] HTTP ${response.status} from ${model} — trying the next one`);
        return { kind: "advance", status: response.status };
      }
      // 400 / 401 / 403: the request or the key, not the model. Same reasoning
      // as the Gemini client — see `gemini.ts`.
      console.error(`[groot/openrouter] HTTP ${response.status} from ${model}`);
      return { kind: "failed", failure: "http", detail: String(response.status) };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      console.error(`[groot/openrouter] ${model} returned 200 with a non-JSON body`);
      return { kind: "advance", status: 502 };
    }

    const choices = isRecord(payload) ? payload.choices : undefined;

    // Guarded before indexing, exactly like `candidates` in `gemini.ts`: a
    // provider returning 200 with an empty list is a documented outcome on a
    // routed, mixed-vendor endpoint, and indexing into it would throw on the
    // response that most needs handling.
    if (!Array.isArray(choices) || choices.length === 0) {
      console.error(`[groot/openrouter] ${model} returned 200 with no choices[]`);
      return { kind: "advance", status: 502 };
    }

    const first = choices[0];
    const finishReason = isRecord(first) ? first.finish_reason : undefined;

    // Only a clean stop is a usable reply, and on this endpoint that rule is
    // stricter than it looks. `length` means the reply was cut mid-sentence at
    // 300 tokens: a visitor sees half a thought, which is worse than seeing the
    // intent table's clean "groot does not know that". `content_filter` and
    // everything unrecognised are rejected for the same reason the Gemini client
    // rejects SPII — a blocked answer is not an answer, and it is not worth
    // retrying the prompt against another vendor.
    if (finishReason !== "stop") {
      console.error(
        `[groot/openrouter] ${model} finish_reason=${String(finishReason)} — no usable reply`,
      );
      return {
        kind: "failed",
        failure: "unusable_finish",
        detail: String(finishReason),
      };
    }

    const message = isRecord(first) ? first.message : undefined;
    const raw = isRecord(message) ? message.content : undefined;

    // `content` is a plain string on this endpoint, unlike Gemini's `parts[]`.
    // It is still typed-checked rather than cast: some routed models return an
    // array of content blocks here, and `String(array)` would render as
    // "[object Object]".
    const text = typeof raw === "string" ? raw.trim() : "";

    if (!text) {
      console.error(`[groot/openrouter] ${model} finished stop with no text`);
      return { kind: "failed", failure: "empty" };
    }

    return { kind: "ok", text };
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    if (name === "TimeoutError" || name === "AbortError") {
      console.error(`[groot/openrouter] ${model} timed out after ${LLM_TIMEOUT_MS}ms`);
      return { kind: "failed", failure: "timeout" };
    }
    console.error(`[groot/openrouter] request to ${model} failed:`, error);
    return { kind: "failed", failure: "network" };
  }
}
