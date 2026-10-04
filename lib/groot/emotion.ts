/**
 * Groot's mood. Pure data and pure functions, shared by the browser and the server.
 *
 * The model decides it. Every model answer ends with a mood tag that is parsed
 * off the reply, so one call produces both the words and the colour. Deterministic
 * replies never change it.
 */

export type EmotionId = "calm" | "curious" | "amused" | "wary" | "cold";

export const EMOTION_IDS: readonly EmotionId[] = ["calm", "curious", "amused", "wary", "cold"];

export const DEFAULT_EMOTION: EmotionId = "calm";

const MOOD_TAG = /\[\s*mood\s*:\s*([a-z]+)\s*(?:[|,]\s*([^\]]*?))?\s*\]/gi;
const EMOJI = /^\p{Extended_Pictographic}[\p{Extended_Pictographic}‍️\p{Emoji_Modifier}]*$/u;

/** Splits the mood tag, and the emoji the model picked for it, off a model reply. Never throws. */
export function parseMoodReply(raw: string): { text: string; emotion?: EmotionId; emoji?: string } {
  let emotion: EmotionId | undefined;
  let emoji: string | undefined;
  const text = raw
    .replace(MOOD_TAG, (_, id: string, pick?: string) => {
      const found = EMOTION_IDS.find((e) => e === id.toLowerCase());
      if (found) emotion = found;
      const candidate = pick?.trim();
      if (candidate && EMOJI.test(candidate)) emoji = candidate;
      return "";
    })
    .trim();
  return { text, emotion, emoji };
}

export const EMOTION_EMOJI: Record<EmotionId, string> = {
  calm: "🌱",
  curious: "👀",
  amused: "😄",
  wary: "😒",
  cold: "🥶",
};

interface EmotionMeta {
  /** Orb glow and body, plus the ring colour while speaking and thinking. */
  glow: string;
  deep: string;
  thinking: string;
  phrases: readonly string[];
}

export const EMOTIONS: Record<EmotionId, EmotionMeta> = {
  calm: {
    glow: "#22c55e",
    deep: "#0b3b2d",
    thinking: "#fbbf24",
    phrases: [
      "One moment...",
      "Groot is considering...",
      "Checking the logs...",
      "Reading the notes...",
      "On it...",
    ],
  },
  curious: {
    glow: "#38bdf8",
    deep: "#0c3a52",
    thinking: "#7dd3fc",
    phrases: ["Groot is listening...", "Hm. Groot wonders...", "Leaning in..."],
  },
  amused: {
    glow: "#a3e635",
    deep: "#2a3b0b",
    thinking: "#d9f99d",
    phrases: ["Groot is smiling...", "Heh. One moment...", "Groot likes that..."],
  },
  wary: {
    glow: "#d97706",
    deep: "#3b1d06",
    thinking: "#f59e0b",
    phrases: ["Groot waits...", "Slowly now...", "Groot is watching..."],
  },
  cold: {
    glow: "#64748b",
    deep: "#1e293b",
    thinking: "#94a3b8",
    phrases: ["...", "Groot waits.", "Still here..."],
  },
};

/** Orb colour overrides for an emotion. Calm returns undefined so the orb keeps its own palette. */
export function orbColorsFor(emotion: EmotionId) {
  if (emotion === "calm") return undefined;
  const e = EMOTIONS[emotion];
  return {
    idle: { glow: e.glow, deep: e.deep },
    speaking: { glow: e.glow, deep: e.deep },
    thinking: { glow: e.thinking, deep: e.deep },
  };
}

/** Cooler moods answer in fewer lines. Applied to table replies only. */
export function clipForEmotion(lines: string[], emotion: EmotionId): string[] {
  if (emotion === "cold") return lines.slice(0, 1);
  if (emotion === "wary") return lines.slice(0, 2);
  return lines;
}

/** What the model is told about its mood, and how to report the next one. */
export function moodBrief(current: EmotionId): string[] {
  return [
    `GROOT'S CURRENT MOOD: ${current}.`,
    "Moods: calm (default, warm and plain), curious (a little warmer), amused (quietly pleased), wary (flat, one or two short sentences), cold (one short flat sentence).",
    "Judge the visitor's newest message against the transcript. Pointless, rude or insulting messages, especially repeated ones, move the mood one step cooler: calm to wary to cold. Kind or sensible messages move it back toward calm.",
    "Cooler moods mean shorter replies. Never sarcastic, never say you are annoyed, never break character, never explain the mood.",
    "Begin the reply with its mood tag on its own, exactly like [mood: calm | 🌱], then the reply text. The tag is mandatory and is never shown to the visitor.",
    "After the bar put exactly one emoji that fits the mood AND the whole conversation so far, the topic and the visitor's last message, not a generic face. It is shown to the visitor in front of the reply when the mood changes.",
  ];
}
