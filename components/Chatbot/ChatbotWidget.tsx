"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  CornerDownLeft,
  Eraser,
  Terminal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactForm } from "@/components/Chatbot/ContactForm";
import { OrbToggle } from "@/components/Chatbot/OrbToggle";
import { useGroot } from "@/hooks/useGroot";
import { AGENT_NAME, SUGGESTIONS } from "@/lib/groot/agent";
import { INTENT_BY_ID } from "@/lib/groot/intents";
import { toLines } from "@/lib/groot/lines";

/**
 * Groot — the shell around the agent.
 *
 * Everything visual here is driven by one value: `orbState`, derived from the
 * agent's status by `orbStateFor()`. The orb cannot disagree with the logic
 * because nothing sets it directly.
 *
 * Voice: Groot is Ayush's, so it talks in the first person and never narrates its
 * own architecture. Earlier drafts opened with "I'm keyword-matched, not an AI"
 * and carried a "no model, no cost" tooltip — that is a reassurance for the
 * author, not for the visitor, and it made the whole thing read like a demo.
 * Dropped. The replies answer the question and stop.
 *
 * Colours are design tokens only. The previous version hardcoded
 * `text-emerald-400` / `bg-zinc-900` / `border-zinc-700`, which meant it could
 * not follow the theme and broke the moment a token changed.
 */

/**
 * The orb lives behind `OrbToggle`, which probes WebGPU after mount and keeps
 * the shader in its own chunk. Nothing here may probe capabilities during
 * render, or the server and client markup disagree.
 */

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [paletteIndex, setPaletteIndex] = useState(0);

  const groot = useGroot();

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = useMemo(() => {
    const query = draft.trim().toLowerCase();
    if (!query.startsWith("/")) return [];
    return groot.commands.filter((command) => command.startsWith(query));
  }, [draft, groot.commands]);

  const showPalette = filteredCommands.length > 0;

  // Keep the newest line in view as the transcript grows.
  useLayoutEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [groot.messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Ctrl/Cmd+K toggles the terminal, Escape closes it.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const submit = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value) return;
      groot.send(value);
      setDraft("");
      setPaletteIndex(0);
    },
    [groot],
  );

  /*
    What the terminal shows while the answer is being worked out.

    "routing" was the honest word and the wrong one to put on screen — it is
    infrastructure vocabulary, and it told the visitor nothing about the wait
    they were having to sit through. These are in Groot's voice instead: flat,
    lowercase, unbothered, and never apologising for the pause.

    They rotate on a counter rather than a timer, so the phrase advances when the
    visitor asks something rather than while they watch, which keeps a long think
    from cycling through all of them like a loading spinner.
  */
  const THINKING_PHRASES = [
    "one moment",
    "groot is considering",
    "checking the logs",
    "assembling that",
    "give groot a second",
    "reading the notes",
    "on it",
  ] as const;

  const thinkingPhrase = useRef(0);
  if (groot.status === "routing") thinkingPhrase.current += 1;

  const thinkingText =
    THINKING_PHRASES[thinkingPhrase.current % THINKING_PHRASES.length];

  const statusLabel =
    groot.status === "routing"
      ? thinkingText
      : groot.status === "collecting"
        ? "awaiting input"
        : groot.status === "speaking"
          ? "replying"
          : "idle";

  /*
    The orb's own shader animation is the nicest signal, but it is the *only*
    one that can vanish: no WebGPU, or a shader that fails to compile, and the
    toggle falls back to a static lucide icon with no state in it at all. These
    two rings are the state cue that always renders. The shader is texture; the
    ring is meaning.
  */
  const speaking = groot.orbState === "speaking";
  const thinking = groot.orbState === "thinking";
  const busy = speaking || thinking;

  // A ~4Hz syllable cadence. Any faster and the ring strobes instead of talking.
  const beat = speaking ? 0.55 : 1.05;

  /*
    The hello plays itself, on the same cue as a hover. Without it the bot is a
    face nobody discovers, and a widget that only speaks after being spoken to
    is indistinguishable from decoration.

    `greetedOnce` is a ref, not state, because opening and closing the panel
    must not re-arm it: a second unsolicited "heyy" mid-session reads as a
    glitch rather than as a greeting. 1.4s of delay so the orb's first painted
    frame exists before something points at it — the canvas fades in on frame
    one, and a tooltip that arrives first introduces nothing.
  */
  const [hovered, setHovered] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const greetedOnce = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (greetedOnce.current) return;
    greetedOnce.current = true;
    const show = window.setTimeout(() => setGreeted(true), 1400);
    const hide = window.setTimeout(() => setGreeted(false), 5200);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, []);

  const showHint = !open && (hovered || greeted);

  return (
    <>
      {/* Toggle. The orb is the affordance, so it stays interactive-looking even
          when the panel is closed. */}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {open ? (
            <motion.section
              key="tty-panel"
              role="dialog"
              aria-label={`${AGENT_NAME} terminal`}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex max-h-[min(32rem,80vh)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-border bg-card/95 font-mono text-sm shadow-2xl backdrop-blur-md sm:w-96"
            >
              <header className="flex items-center justify-between gap-2 border-b border-border bg-muted/60 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Terminal className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="truncate font-medium">{AGENT_NAME}</span>
                  <span
                    className="shrink-0 text-xs text-muted-foreground"
                    title="Ask about Ayush's work, or leave him a message"
                  >
                    {statusLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={groot.clear}
                    aria-label="Clear terminal history"
                  >
                    <Eraser className="size-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setOpen(false)}
                    aria-label="Close terminal"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </header>

              <div
                ref={logRef}
                className="flex-1 space-y-2 overflow-y-auto px-3 py-3"
                role="log"
                aria-live="polite"
                aria-atomic="false"
              >
                {/*
                    Terminal colour pairing: the visitor's own words are white,
                    Groot's replies are light green.

                    Both are dark-variant literals on purpose — the site is
                    dual-theme (`defaultTheme="system"`), and in light mode the
                    panel background is the white card. A literal `text-white` and
                    a literal light green there would be ~1.6:1 contrast, i.e.
                    unreadable. So light mode gets the same hierarchy with legible
                    equivalents: near-black for the visitor, deep green for the
                    reply.

                    `--primary` could not be used for this. It is the right green in
                    dark mode (140 90% 65%) but 156 72% 24% in light mode, which is
                    a dark forest green — using one token for both would make the
                    reply vanish on one theme or the other.

                    The markers carry the distinction too (`>` vs `$`), so this is
                    never colour-alone.
                  */}
                {groot.messages.map((message) => {
                  const isVisitor = message.from === "visitor";

                  return (
                    <div key={message.id} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className={
                          isVisitor
                            ? "shrink-0 font-bold text-emerald-600 dark:text-emerald-400"
                            : "shrink-0 text-emerald-600/70 dark:text-emerald-300/70"
                        }
                      >
                        {isVisitor ? ">" : "$"}
                      </span>

                      {/*
                        One sentence per line for Groot, verbatim for the visitor.

                        The single `$` marker stays on the first line only, so the
                        reply reads as one utterance that happens to wrap across
                        lines rather than as a list of separate statements — which
                        is what it is. Hanging a `$` on every sentence turned the
                        reply into what looked like three separate answers.
                      */}
                      <div
                        className={
                          isVisitor
                            ? "min-w-0 break-words font-medium text-neutral-900 dark:text-white"
                            : "min-w-0 space-y-0.5 text-emerald-700 dark:text-emerald-300"
                        }
                      >
                        {isVisitor ? (
                          message.text
                        ) : (
                          <>
                            {toLines(message.text).map((line) => (
                              <p key={line} className="break-words">
                                {line}
                              </p>
                            ))}
                            {message.intentId && message.confidence !== undefined ? (
                              <span className="text-[10px] text-emerald-700/60 dark:text-emerald-300/50">
                                {message.intentId}
                              </span>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {groot.status === "routing" ? (
                  <div className="flex gap-2">
                    <span
                      className="shrink-0 text-emerald-600/70 dark:text-emerald-300/70"
                      aria-hidden="true"
                    >
                      $
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-300">
                      {thinkingText}
                      <span className="blinking-cursor-block" aria-hidden="true" />
                    </span>
                  </div>
                ) : null}

                {/* Only offered before the visitor has typed anything, so the
                    panel never becomes a wall of text. */}
                {groot.messages.length <= 1 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion.send}
                        type="button"
                        onClick={() => submit(suggestion.send)}
                        className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                      >
                        {suggestion.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {groot.isFormOpen ? (
                <ContactForm
                  intent="contact"
                  onSent={groot.formSent}
                  onFailed={groot.formFailed}
                  onCancel={groot.closeForm}
                />
              ) : (
                <form
                  className="flex items-center gap-2 border-t border-border px-3 py-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submit(draft);
                  }}
                >
                  <span className="shrink-0 text-primary" aria-hidden="true">
                    &gt;
                  </span>
                  <div className="relative flex-1">
                    <Input
                      ref={inputRef}
                      value={draft}
                      onChange={(event) => {
                        setDraft(event.target.value);
                        setPaletteIndex(0);
                      }}
                      onKeyDown={(event) => {
                        if (!showPalette) return;
                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          setPaletteIndex((i) =>
                            i >= filteredCommands.length - 1 ? 0 : i + 1,
                          );
                        } else if (event.key === "ArrowUp") {
                          event.preventDefault();
                          setPaletteIndex((i) =>
                            i <= 0 ? filteredCommands.length - 1 : i - 1,
                          );
                        } else if (event.key === "Tab") {
                          event.preventDefault();
                          submit(filteredCommands[paletteIndex] ?? draft);
                        }
                      }}
                      placeholder="Type a command, or /help..."
                      aria-label={`Message ${AGENT_NAME}`}
                      aria-expanded={showPalette}
                      aria-controls={showPalette ? "groot-palette" : undefined}
                      autoComplete="off"
                      spellCheck={false}
                      className="border-border bg-transparent pr-8 font-mono"
                    />
                    <CornerDownLeft
                      className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />

                    <AnimatePresence>
                      {showPalette ? (
                        <motion.ul
                          id="groot-palette"
                          role="listbox"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.12 }}
                          className="absolute bottom-full left-0 z-10 mb-2 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg"
                        >
                          {filteredCommands.map((command, index) => {
                            const intent = INTENT_BY_ID.get(
                              command.replace("/", "") as never,
                            );
                            return (
                              <li key={command}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={index === paletteIndex}
                                  onMouseEnter={() => setPaletteIndex(index)}
                                  onClick={() => submit(command)}
                                  className={`flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left text-xs ${
                                    index === paletteIndex
                                      ? "bg-accent text-accent-foreground"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  <span>{command}</span>
                                  <span className="flex items-center gap-1 truncate text-[10px] opacity-70">
                                    {intent?.action?.type === "scrollTo"
                                      ? "scroll"
                                      : intent?.action?.type === "openForm"
                                        ? "form"
                                        : "reply"}
                                    <ChevronRight className="size-3" aria-hidden="true" />
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </motion.ul>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </form>
              )}
            </motion.section>
          ) : null}
        </AnimatePresence>

        {/*
          Wrapper exists to host the hint and the state rings. The handlers are
          explicit rather than `group-hover` because visibility is now a union of
          two sources (pointer/focus AND the one-shot greeting) — expressed in
          CSS it would have to be duplicated in two class strings and drift.
          `onFocus`/`onBlur` bubble in React, so keyboard focus lights the hint
          too; a tooltip that only answers the mouse is not an accessible
          tooltip.
        */}
        <div
          className="relative flex size-16 items-center justify-center"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
        >
          {/*
            Attention glow. Always on, slow, low-opacity — its only job is to
            make a 56px orb findable on a long scrolling page, so it must never
            become the loudest thing on screen. Placed before the button in DOM
            order so the button's `backdrop-blur` composites over it rather
            than washing it out.

            Deliberately a blurred sibling rather than a Tailwind arbitrary
            `shadow-[...]`: the project's tokens are bare HSL triplets
            (`--primary: 156 72% 24%`), and `hsl(var(--primary)/0.6)` inside a
            class name is a parser hazard for a glow that a plain div does
            better.
          */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-1 rounded-full bg-primary/20 blur-xl"
            animate={
              reduceMotion
                ? { opacity: 0.55 }
                : { opacity: [0.35, 0.75, 0.35], scale: [1, 1.05, 1] }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 4.5, ease: "easeInOut", repeat: Infinity }
            }
          />

          {/*
            The hello is a message, not a tooltip.

            A tooltip is chrome: grey surface, tiny text, no personality, and
            hovering it feels like inspecting the widget. What this needs to
            convey is "someone is in there", so it is drawn as a speech bubble
            in the same green the transcript uses for Groot's replies, with a
            tail aimed at the orb so the line of authorship is unambiguous.

            `rounded-br-sm` plus a rotated square with only two borders meeting
            in a corner is the whole tail. A CSS triangle would have been one
            fewer element and would have needed a hardcoded fill colour, which
            cannot follow the theme.
          */}
          <AnimatePresence>
            {showHint ? (
              <motion.div
                key="groot-hint"
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="pointer-events-none absolute bottom-full right-0 z-10 mb-4 w-max max-w-[14rem] rounded-2xl rounded-br-sm border border-emerald-600/30 bg-card px-3 py-2 font-mono text-xs shadow-xl"
              >
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1.5 right-4 size-3 rotate-45 border-r border-b border-emerald-600/30 bg-card"
                />
                <p className="text-emerald-700 dark:text-emerald-300">
                  {hovered ? `Hey!! ${AGENT_NAME} this side.` : `Hey!! ${AGENT_NAME} here.`}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/*
            State rings. The shader is the good version of this, but it is not
            guaranteed: no WebGPU, or a failed compile, and the toggle falls back
            to a static lucide icon carrying no state at all. Reduced motion
            gets a static ring rather than nothing — the colour still has to
            report the state, only the pulsing stops.
          */}
          {busy ? (
            reduceMotion ? (
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 rounded-full border-2 ${
                  speaking ? "border-primary/70" : "border-amber-400/70"
                }`}
              />
            ) : (
              <>
                <motion.span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 rounded-full blur-lg ${
                    speaking ? "bg-primary/25" : "bg-amber-400/25"
                  }`}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 0.85, 0.3] }}
                  transition={{ duration: beat, ease: "easeInOut", repeat: Infinity }}
                />
                <motion.span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-1 rounded-full border-2 ${
                    speaking ? "border-primary/70" : "border-amber-400/70"
                  }`}
                  initial={{ opacity: 0.65, scale: 1 }}
                  animate={{ opacity: [0.65, 0, 0.65], scale: [1, 1.3, 1] }}
                  transition={{ duration: beat, ease: "easeOut", repeat: Infinity }}
                />
              </>
            )
          ) : null}

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-label={open ? `Close ${AGENT_NAME}` : `Open ${AGENT_NAME}`}
            className="flex size-16 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-md transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {/*
              `OrbToggle` owns capability detection and its own failure handling,
              so this button renders unconditionally. It renders the static icon
              when WebGPU is missing or the shader fails to compile — the toggle
              itself must never depend on the orb being available.
            */}
            <OrbToggle state={groot.orbState} open={open} />
          </button>
        </div>
      </div>
    </>
  );
}

export default ChatbotWidget;
