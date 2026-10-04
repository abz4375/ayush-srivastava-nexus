/**
 * Gemini client — the primary provider, and the only one that costs money.
 *
 * Everything upstream of it is free: the intent table answers from a literal,
 * and classifier.dev decides whether to get here at all. So this file is written
 * defensively — one attempt, one narrow retry, and every failure folded into a
 * value the ladder in `llm.ts` can fall back from. It never throws.
 *
 * ## Model and fallback
 *
 * `gemini-2.5-flash-lite` first, `gemini-3.5-flash-lite` as the automatic
 * fallback. Google is deprecating the 2.5 family, so the fallback is a
 * scheduled removal, not a hypothetical.
 *
 * ## Which failures advance the ladder
 *
 * An earlier version advanced on **404 and nothing else**, on the reasoning that
 * a quota error would just be spent twice. That was wrong, and it cost the site
 * its model answers entirely: free-tier quota on `2.5-flash-lite` ran out, every
 * request came back 429, the loop bailed, and the route served the table reply
 * with `mode: "deterministic"` — which is indistinguishable, to a visitor, from
 * having no model at all.
 *
 * Quota is enforced **per model**, not per key. Measured on one key at one
 * moment: `gemini-2.5-flash-lite` → `429 RESOURCE_EXHAUSTED`, and
 * `gemini-3.5-flash-lite` → `200`. So a 429 is exactly the case where trying the
 * next model helps, and refusing to try it was the bug.
 *
 * Advanced on: 404 (id gone), 429 (this model's quota), 500/502/503/504
 * (transient upstream). Terminal on 400, 401 and 403 — a malformed request, a
 * missing key and a rejected key are properties of *this* request, and would
 * come back identically from the second model while doubling the visitor's
 * wait.
 *
 * ## Safety is not negotiable
 *
 * `finishReason` is checked, and anything other than `STOP` is treated as no
 * answer at all. That includes `SPII`, which is a genuinely likely outcome
 * here rather than a theoretical one: a visitor's transcript can contain their
 * own email address, and Gemini is right to notice. The right response to that
 * is the deterministic table reply, not a safety relaxation.
 *
 * ## Request shape
 *
 * `systemInstruction` + `contents` against `:generateContent`, key in the
 * `x-goog-api-key` header. Not the newer `/interactions` shape: `systemInstruction`
 * is text-only, needs no extra parts, and is the shape this endpoint has
 * actually been serving for both the 2.5 and 3.x flash-lite families.
 *
 * ## Log prefix
 *
 * Still `[groot/llm]`, not `[groot/gemini]`. The file moved but the tag did not:
 * operators already have log filters on this string, and a rename would split one
 * stream of past incidents into two. The OpenRouter client, which has no such
 * history, uses its own tag.
 */

import { type AskArgs, type CallOutcome, ADVANCE_ON_STATUS, isRecord, LLM_MAX_TOKENS, LLM_TEMPERATURE, LLM_TIMEOUT_MS } from "./llm-types";
import { GROOT_VOICE, buildAnswerPrompt } from "./prompt";

const GENERATIVE_LANGUAGE_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Attempted in order. See `ADVANCE_ON_STATUS` for which failures move on to the
 * next entry, and the file comment for why 429 has to be one of them.
 */
export const GROOT_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash-lite",
] as const;

export type GrootModel = (typeof GROOT_MODELS)[number];

/**
 * Gemini's spelling of the two shared budgets. Kept local so this module reads as
 * one complete description of the request it makes — if either number in
 * `llm-types.ts` changes, this object changes with it.
 */
const GENERATION_CONFIG = {
  temperature: LLM_TEMPERATURE,
  maxOutputTokens: LLM_MAX_TOKENS,
} as const;

/**
 * One attempt against one model. Never throws.
 */
export async function callGemini(
  model: GrootModel,
  apiKey: string,
  args: AskArgs,
): Promise<CallOutcome> {
  const url = `${GENERATIVE_LANGUAGE_BASE}/${model}:generateContent`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Header, not `?key=` — a URL query string ends up in every proxy log and
    // every `Referer` on the way through.
    "x-goog-api-key": apiKey,
  };

  const body = {
    // Text-only parts. No role, no inline images.
    systemInstruction: { parts: [{ text: GROOT_VOICE }] },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: buildAnswerPrompt({
              question: args.question,
              turns: args.turns,
              agentName: args.agentName,
              emotion: args.emotion,
            }),
          },
        ],
      },
    ],
    generationConfig: { ...GENERATION_CONFIG },
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
        console.error(`[groot/llm] HTTP ${response.status} from ${model} — trying the next one`);
        return { kind: "advance", status: response.status };
      }
      // 400 / 401 / 403: the request or the key, not the model. See the file
      // comment — retrying would only make the visitor wait longer for the same
      // answer.
      console.error(`[groot/llm] HTTP ${response.status} from ${model}`);
      return { kind: "failed", failure: "http", detail: String(response.status) };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      console.error(`[groot/llm] ${model} returned 200 with a non-JSON body`);
      return { kind: "advance", status: 502 };
    }

    const candidates = isRecord(payload) ? payload.candidates : undefined;

    // Absent on a 200 is documented, not hypothetical: Gemini omits `candidates`
    // when a prompt is blocked before generation starts. Null-check before
    // indexing or this throws on the one response that most needs handling.
    if (!Array.isArray(candidates) || candidates.length === 0) {
      console.error(`[groot/llm] ${model} returned 200 with no candidates[]`);
      return { kind: "advance", status: 502 };
    }

    const first = candidates[0];
    const finishReason = isRecord(first) ? first.finishReason : undefined;

    // Only a clean stop is a usable reply. SAFETY, SPII, RECITATION,
    // MAX_TOKENS, BLOCKLIST, PROHIBITED_CONTENT and MODEL_ARMOR all mean there
    // is nothing here to show a visitor, and none of them are worth retrying
    // against a second model — the verdict is about the content, not the model.
    if (finishReason !== "STOP") {
      console.error(
        `[groot/llm] ${model} finishReason=${String(finishReason)} — no usable reply`,
      );
      return {
        kind: "failed",
        failure: "unusable_finish",
        detail: String(finishReason),
      };
    }

    const content = isRecord(first) ? first.content : undefined;
    const parts = isRecord(content) ? content.parts : undefined;

    const text = Array.isArray(parts)
      ? parts
          .map((part) => (isRecord(part) && typeof part.text === "string" ? part.text : ""))
          .join("")
          .trim()
      : "";

    if (!text) {
      console.error(`[groot/llm] ${model} finished STOP with no text`);
      return { kind: "advance", status: 502 };
    }

    return { kind: "ok", text };
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    if (name === "TimeoutError" || name === "AbortError") {
      console.error(
        `[groot/llm] ${model} timed out after ${LLM_TIMEOUT_MS}ms — trying the next one`,
      );
      return { kind: "advance", status: 408 };
    }
    console.error(`[groot/llm] request to ${model} failed:`, error);
    return { kind: "advance", status: 503 };
  }
}
