/**
 * Split a reply into one sentence per line.
 *
 * ## Why
 *
 * The panel is a terminal, and a terminal reads as a stream of short lines rather
 * than as a paragraph. Three sentences collapsed into one 123-character run-on
 * is what makes a short reply *feel* long: the eye loses its place mid-clause and
 * the whole bubble scans as a wall. One sentence per line keeps each unit
 * scannable and gives the reply the same rhythm as the `>` / `$` prompt lines
 * around it.
 *
 * ## Scope
 *
 * Agent text only. The visitor's own words are never reflowed — they were typed
 * as one thought, and reformatting someone's message back at them misquotes it.
 *
 * The model is instructed to break its own lines (see `GROOT_VOICE`), so this is
 * the safety net for the table's replies and for any model that ignores the
 * rule — not the primary mechanism.
 *
 * ## Role markers are stripped
 *
 * A model that has seen a transcript format will sometimes emit the format
 * along with the content. This was not hypothetical: the voice's few-shot
 * examples used to be written with a `you:` prefix, and the production build
 * came back with it — `you: he works mainly in python...` — on every line of
 * every reply. The prompt has since been rewritten so there is no prefix left to
 * copy, but six different models answer this question and a prompt is not a
 * guarantee. So the marker is stripped here as well, once per line, before the
 * sentence is rendered.
 *
 * Both halves matter: fixing only the prompt would have left one stray token away
 * from shipping the same bug again, and fixing only this would leave the model
 * being *told* to emit something that is then deleted.
 *
 * ## Stripped on every line, not the first
 *
 * The observed failure put the marker on all three lines of the reply, not just
 * the opening one — stripping only a prefix would have left the rest of it on
 * screen. `>` and `$` are in the list for the same reason: they are the
 * terminal's own markers, so a model echoing one is the identical bug wearing a
 * different token.
 *
 * ## Deliberately naive
 *
 * Splits on `.` / `!` / `?` followed by whitespace. Every reply in the table and
 * everything the voice rules produce fits that, and this site's copy has no
 * abbreviations, decimals, version numbers or quoted ellipses to trip it. A real
 * sentence tokenizer would be a dependency imported to solve a problem the copy
 * does not have.
 */

/**
 * A leading role or terminal marker.
 *
 * The names are the ones that appear in this site's own transcript and prompt —
 * `you` from the old few-shot examples, the rest from the conversation's two
 * participants. Anchored at the start, so a colon anywhere else in a sentence
 * (`stack: python`) is untouched.
 */
const ROLE_MARKER =
  /^(?:you|assistant|ai|model|agent|groot|ayush|bot|visitor)\s*:\s*|[>$]\s+/i;

export function toLines(text: string): string[] {
  return text
    .split("\n")
    .flatMap((rawLine) => {
      const line = rawLine.trim().replace(ROLE_MARKER, "");
      if (!line) return [];
      // Keep each terminator attached to the sentence it ends — "Groot here.",
      // never "Groot here" followed by a line holding only ".".
      return line.match(/[^.!?]+[.!?]+["')\]]*|\S[^.!?]*$/g) ?? [line];
    })
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}