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
 * ## Deliberately naive
 *
 * Splits on `.` / `!` / `?` followed by whitespace. Every reply in the table and
 * everything the voice rules produce fits that, and this site's copy has no
 * abbreviations, decimals, version numbers or quoted ellipses to trip it. A real
 * sentence tokenizer would be a dependency imported to solve a problem the copy
 * does not have.
 */
export function toLines(text: string): string[] {
  return text
    .split("\n")
    .flatMap((rawLine) => {
      const line = rawLine.trim();
      if (!line) return [];
      // Keep each terminator attached to the sentence it ends — "Groot here.",
      // never "Groot here" followed by a line holding only ".".
      return line.match(/[^.!?]+[.!?]+["')\]]*|\S[^.!?]*$/g) ?? [line];
    })
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}