"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import {
  type AgentEvent,
  type AgentState,
  type ChatMessage,
  type OrbState,
  MIN_THINKING_MS,
  initialAgentState,
  orbStateFor,
  reduce,
  reserveIdsFor,
  shouldGoRemote,
  speakingDurationMs,
} from "@/lib/groot/agent";
import type { EmotionId } from "@/lib/groot/emotion";
import { type Classification, COMMANDS, classify, type IntentId } from "@/lib/groot/intents";
import type { PromptTurn } from "@/lib/groot/prompt";

/**
 * Old transcripts are deliberately abandoned rather than migrated: they carry
 * `from: "ayush-gpt"`, which no longer satisfies the `ChatMessage` union (it is
 * now `"groot"`), and the
 * site is not launched yet so nobody has a session worth keeping. The new key
 * simply starts from an empty transcript.
 */
const STORAGE_KEY = "groot:transcript:v1";

/**
 * Only the fields worth restoring. Persisting `status` would restore a stale
 * "speaking" with no pending timer to close it.
 */
type Persisted = Pick<ChatMessage, "id" | "from" | "text" | "intentId">[];

function readTranscript(): Persisted | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const clean = parsed.filter(
      (m): m is Persisted[number] =>
        !!m &&
        typeof m === "object" &&
        typeof (m as ChatMessage).text === "string" &&
        ((m as ChatMessage).from === "visitor" ||
          (m as ChatMessage).from === "groot"),
    );
    return clean.length ? clean : null;
  } catch {
    // Private mode, quota, or corrupt JSON. A fresh session is the right
    // fallback — never let storage break the widget.
    return null;
  }
}

/**
 * Response guard for `POST /api/groot`.
 *
 * The route always answers JSON, but an edge worker or proxy sitting in front of
 * it may not, so the shape is verified rather than asserted.
 *
 * `intentId` is carried through when present, and it is load-bearing. The server
 * re-classifies with the whole transcript in hand, so it can land on an intent
 * that carries a side effect — `openForm` on `contact` — which the browser's
 * single-message classification scored too low to act on. Forwarding the id is
 * what stops that becoming a reply that tells the visitor to leave a note and
 * then opens no form.
 */
function isGrootReply(
  data: unknown,
): data is { reply: string; intentId?: IntentId; emotion?: EmotionId } {
  if (typeof data !== "object" || data === null) return false;
  const row = data as Record<string, unknown>;
  return row.ok === true && typeof row.reply === "string" && row.reply.trim() !== "";
}

/**
 * Binds the pure reducer in `lib/groot/agent.ts` to React.
 *
 * All timing lives here and nowhere else, which is the point: the reducer stays
 * synchronous and testable, and the only asynchrony is a network request plus
 * presentation timers that exist so the orb's states are actually visible.
 */
export function useGroot() {
  const [state, dispatch] = useReducer(reduce, initialAgentState);

  const timers = useRef<number[]>([]);

  /*
    The transcript, read at send time rather than taken from the closure.
    `send` needs the session as it was *before* this message, and capturing it
    in the dependency array would rebuild the callback on every keystroke-induced
    render and break memoisation for the input's `onKeyDown` handlers.
  */
  const messagesRef = useRef(state.messages);
  messagesRef.current = state.messages;

  const emotionRef = useRef(state.emotion);
  emotionRef.current = state.emotion;

  /** Live request, so a new message or a clear can abandon the old answer. */
  const inFlight = useRef<AbortController | null>(null);

  /*
    Request ids are minted here, not in the reducer, because the caller is the
    only side that knows whether a request is going out — so it is the only side
    that can hand the same id back when the answer lands.
  */
  const requestCounter = useRef(0);

  const cancelInFlight = useCallback(() => {
    inFlight.current?.abort();
    inFlight.current = null;
  }, []);

  /*
    Drop every pending presentation timer.

    `AbortController` only cancels a request that is still on the wire. It cannot
    reach a timer that has already been scheduled — and by the time the network
    answers, the timer waiting out `MIN_THINKING_MS` usually *is* the thing still
    pending. Those callbacks fire against whatever the newest message is, so a
    second `send` during the thinking window produced two answers to one question,
    or one answer to the wrong question. Clearing them on each send is correct
    because every timer this hook owns belongs to the message that scheduled it,
    and a new message retires that message.
  */
  const cancelPending = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      inFlight.current?.abort();
    },
    [],
  );

  // Restore after mount, never during render. Reading localStorage in the
  // initial state is what produces a server/client HTML mismatch — the server
  // has no localStorage, so the first client render must match it exactly.
  useEffect(() => {
    const stored = readTranscript();
    if (stored) {
      // Resume the id sequence past whatever was restored. Without this the
      // counter restarts at 0 on a fresh page load and the next message reuses
      // an id that is already in the transcript, which the renderer turns into
      // a React duplicate-key warning and potentially a dropped message.
      reserveIdsFor(stored);
      dispatch({ type: "restore", messages: stored });
    }
  }, []);

  // Persist after mount only, so the welcome message on a fresh visit is not
  // written before the restore above has had its chance to run.
  const hasRestored = useRef(false);
  useEffect(() => {
    if (!hasRestored.current) {
      hasRestored.current = true;
      if (!readTranscript()) return;
    }
    try {
      const payload: Persisted = state.messages.map((m) => ({
        id: m.id,
        from: m.from,
        text: m.text,
        intentId: m.intentId,
      }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Storage unavailable. The session still works, it just won't survive a
      // reload. Not worth surfacing to the visitor.
    }
  }, [state.messages]);

  // Perform the scroll the reducer asked for, then release it so it fires once.
  useEffect(() => {
    const id = state.pendingScrollTo;
    if (!id) return;

    const run = () => {
      const el = document.getElementById(id);
      if (!el) {
        /*
          An intent asked to scroll to a section that is not on the page.

          Nothing is dispatched here, and that is the whole fix. The previous
          version dispatched a `send` with a made-up sentence, which was wrong
          twice over: the visitor saw that sentence as *their own* question, and
          `send` moves the machine into `routing` — so the orb painted amber and
          waited for a `resolve` that never came, thinking forever, with no reply
          line. A turn invented inside a scroll effect has no follow-up by
          construction.

          The reply is already on screen regardless. `resolve` scheduled it, and
          the timers that end the turn belong to `send`, not to this effect. So
          the honest behaviour is to skip the scroll and let the answer stand.
          Logged because a scroll target that does not exist is a bug in
          `scrollTargetFor`, and this is where it becomes visible.
        */
        console.warn(`[groot] scroll target "${id}" is not in the DOM — skipping`);
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Wait a frame so the reply is painted before the page moves.
    const raf = window.requestAnimationFrame(run);
    return () => window.cancelAnimationFrame(raf);
  }, [later, state.pendingScrollTo]);

  /*
    Ask the server for an answer the table could not produce.

    Every request ships the whole transcript, so the model has the session. There
    is deliberately no server-side session id: `clear` then needs no explicit
    teardown, because forgetting is the same as having sent nothing.

    `requestId` is minted by the caller and handed back on `resolveRemote`, so a
    late answer for an abandoned question is dropped by the reducer instead of
    being appended to a transcript it was never asked about.
  */
  const askServer = useCallback(
    async (
      question: string,
      turns: readonly PromptTurn[],
      requestId: number,
      fallback: Classification,
      emotion: EmotionId,
    ): Promise<void> => {
      const startedAt = performance.now();
      const controller = new AbortController();
      inFlight.current = controller;

      let reply: string | null = null;
      let replyIntentId: IntentId | null = null;
      let replyEmotion: EmotionId | undefined;
      try {
        const response = await fetch("/api/groot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: question, turns, emotion }),
          signal: controller.signal,
        });
        const data: unknown = await response.json();
        if (isGrootReply(data)) {
          reply = data.reply.trim();
          replyIntentId = data.intentId ?? null;
          replyEmotion = data.emotion;
        }
      } catch {
        // Offline, aborted, rate-limited, or the provider is down. The table's
        // own reply is a perfectly good answer, so the visitor never sees an
        // error state for something they cannot act on.
      } finally {
        if (inFlight.current === controller) inFlight.current = null;
      }

      // The thinking floor runs *alongside* the request, not after it. Adding
      // the two would make every model-backed reply cost floor + latency, which
      // is exactly the sluggishness the floor exists to avoid.
      const wait = Math.max(0, MIN_THINKING_MS - (performance.now() - startedAt));

      if (reply) {
        const spoken = reply.length;
        later(
          () =>
            dispatch({
              type: "resolveRemote",
              reply,
              requestId,
              // Forwarded so a table-produced answer can still open the form or
              // scroll the page. Absent for real model answers, by design.
              intentId: replyIntentId ?? undefined,
              emotion: replyEmotion,
            }),
          wait,
        );
        later(() => dispatch({ type: "replyShown" }), wait + speakingDurationMs(String(spoken)));
        return;
      }

      // Nothing usable came back. Commit the local classification instead, which
      // is the `unknown` reply the visitor would have got before this feature
      // existed — same id, same guard.
      const spoken = fallback.intent.reply.length;
      later(() => dispatch({ type: "resolve" }), wait);
      later(
        () => dispatch({ type: "replyShown" }),
        wait + speakingDurationMs(String(spoken)),
      );
    },
    [later],
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Whatever is in flight belongs to a question that is no longer the last
      // one on screen, and its pending timers are already counting down toward
      // an answer nobody asked for any more. Drop both.
      cancelInFlight();
      cancelPending();

      const classification = classify(trimmed);

      // The session as it stood *before* this message — the question travels
      // separately in `text`, so sending it here too would repeat it.
      const turns: PromptTurn[] = messagesRef.current.map((m) => ({
        from: m.from,
        text: m.text,
      }));

      requestCounter.current += 1;
      const requestId = requestCounter.current;

      dispatch({ type: "send", text: trimmed, requestId });

      // Fast path: the table is confident. No request, no network, no cost.
      if (!shouldGoRemote(classification)) {
        const replyLength = classification.intent.reply.length;
        later(() => dispatch({ type: "resolve" }), MIN_THINKING_MS);
        later(
          () => dispatch({ type: "replyShown" }),
          MIN_THINKING_MS + speakingDurationMs(String(replyLength)),
        );
        return;
      }

      void askServer(trimmed, turns, requestId, classification, emotionRef.current);
    },
    [askServer, cancelInFlight, cancelPending, later],
  );

  const clear = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    cancelInFlight();
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to do */
    }
    dispatch({ type: "clear" });
  }, [cancelInFlight]);

  const orbState: OrbState = useMemo(() => orbStateFor(state.status), [state.status]);

  return {
    // Agent state
    status: state.status,
    messages: state.messages,
    formOpen: state.formOpen,
    paletteOpen: state.paletteOpen,
    lastClassification: state.lastClassification,
    emotion: state.emotion,

    // Presentation
    orbState,
    isThinking: state.status === "routing",
    isSpeaking: state.status === "speaking",
    isFormOpen: state.formOpen,

    // Commands
    commands: COMMANDS,
    send,
    clear,
    openForm: () => dispatch({ type: "openForm" }),
    closeForm: () => dispatch({ type: "closeForm" }),
    formSent: () => dispatch({ type: "formSent" }),
    formFailed: () => dispatch({ type: "formFailed" }),
    togglePalette: () => dispatch({ type: "togglePalette" }),
  };
}

export type Groot = ReturnType<typeof useGroot>;
export type { AgentState, AgentEvent, ChatMessage };
