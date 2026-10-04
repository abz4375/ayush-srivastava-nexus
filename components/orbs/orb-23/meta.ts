import type { OrbVariant } from "@/components/orbs/canvas";
import { orb23Params, orb23Shader } from "@/components/orbs/orb-23/gpu";

export const meta = {
  description: "an ASCII glyph matrix in CRT green, wrapped on the ball",
  files: ["index.tsx", "meta.ts", "gpu.ts"],
  slug: "orb-23",
  title: "ORB-23",
} as const;

export const orb23Orb: OrbVariant = {
  colors: [
    { default: "#57ffc9", key: "glow", label: "Glow" },
    { default: "#0b3b2d", key: "deep", label: "Deep" },
  ],
  key: meta.slug,
  label: meta.title,
  note: meta.description,
  params: [
    {
      default: 0.55,
      integrate: true,
      key: "drift",
      label: "Drift",
      max: 10,
      min: 0,
      step: 0.05,
    },
    {
      default: 0.05,
      integrate: true,
      key: "scroll",
      label: "Scroll",
      max: 10,
      min: 0,
      step: 0.05,
    },
    {
      default: 0.5,
      integrate: true,
      key: "speed",
      label: "Pulse rate",
      max: 10,
      min: 0.015,
      step: 0.05,
    },
    {
      default: 0,
      key: "pulse",
      label: "Pulse depth",
      max: 2,
      min: 0,
      step: 0.01,
    },
    {
      default: 0.12,
      integrate: true,
      key: "spin",
      label: "Roll",
      max: 5,
      min: 0,
      step: 0.03,
    },
    {
      default: 0.9,
      key: "radius",
      label: "Radius",
      max: 3,
      min: 0.15,
      step: 0.015,
    },
    {
      default: 40,
      key: "cells",
      label: "Glyph grid",
      max: 120,
      min: 16,
      step: 2,
    },
    {
      default: 1.6,
      key: "scale",
      label: "Field scale",
      max: 10,
      min: 0.3,
      step: 0.1,
    },
    {
      default: 0.48,
      key: "density",
      label: "Glyph density",
      max: 2,
      min: 0,
      step: 0.01,
    },
    {
      default: 0.48,
      key: "dropout",
      label: "Dropout",
      max: 1,
      min: 0,
      step: 0.01,
    },
    {
      default: 0.6,
      key: "light",
      label: "Key light",
      max: 3,
      min: 0,
      step: 0.015,
    },
    {
      default: 0.45,
      key: "rim",
      label: "Rim glow",
      max: 3,
      min: 0,
      step: 0.015,
    },
    {
      default: 1,
      key: "gain",
      label: "Phosphor gain",
      max: 5,
      min: 0.05,
      step: 0.05,
    },
    {
      default: 1,
      key: "contrast",
      label: "Contrast",
      max: 10,
      min: 0.15,
      step: 0.05,
    },
  ],
  shader: orb23Shader,
  /*
    Recoloured from the registry defaults (violet / aqua / red) to fit this site's
    terminal theme. Those three read as a generic "AI" palette and fought the
    emerald phosphor used everywhere else. Now: green at rest, amber while
    working, full-brightness green while answering — so a glance at the orb
    reports the agent's state in the same two colours as the rest of the UI.
  */
  stateColors: {
    idle: { glow: "#22c55e" },
    speaking: { glow: "#57ffc9" },
    thinking: { glow: "#fbbf24" },
  },
  /*
    Each state ANIMATES differently — its own kind of motion, not just its
    own speed — and each has its own phosphor colour. Every motion has its own
    integrated clock, so a rate gliding to zero freezes that motion in place
    with its phase intact; the pulse depth is an amplitude, not a rate.

    Tuned for the 56px toggle button, where three things decide legibility.

    CELLS is a divisor with a floor, not a glyph count: the shader computes
    `cellPx = max(res / cells, 4)` DEVICE pixels, so at 56 CSS px on a 2x
    display any `cells` >= 28 clamps to the same 4px block and changing it
    does nothing at all. Sitting on that floor left every glyph's four dash
    rows at 1 device px each — sub-pixel, hence the grey mush. Raising
    `cells` cannot fix that; the values below go BELOW the floor (16-20) so
    the clamp releases and the cell actually grows to 5.6-7 device px, i.e.
    2.8-3.5 CSS px. At 1x the floor still binds and every state lands on
    4 CSS px, which is fine — motion carries the distinction there.

    GAIN x DENSITY set how much of a cell lights. The shader lights dash row
    `i` when `dens * 4 * gainNow >= i + 0.5`, so that product has to stay
    near 3, not 4, or every cell saturates into one solid bar and the orb
    collapses to a bright smear with no readable motion — which is what
    speaking's old gain of 2.95 did. Speaking now sits at 2.9 typically, and
    its beat sweeps that down to 1.2 and up to 4.6, i.e. one lit row -> three
    -> four. That sweep IS the animation, and it never reaches zero, so the
    matrix dims rather than blinks off.

    SCALE decides whether the noise reads as glyphs or as static. `field` is
    5-octave fbm sampled once per cell, and `p2` spans at most ~2.5 * scale
    periods from centre to rim, so at the old 5.1-7.2 there was well under
    one noise period per cell: every cell drew an independent value and the
    result was salt-and-pepper. At 1.6-2.8 a period spans ~1-2 cells, so
    brightness travels across the matrix as coherent bands instead.

    Beat rate: the pulse wave is `sin(r * 5.5 - speed * 2.4)` on an
    integrated clock, and the renderer's global `speed` scalar sits at ~0.94
    in speaking, so `f = 2.4 * 0.94 * speed / 2pi`. Speaking runs `speed:
    9.8` for 3.5Hz — a syllable cadence, and the ceiling for this param is
    10 (3.6Hz), so it is as rhythmic as the shader allows without strobing.
  */
  statePresets: {
    /*
      Resting. Diagonal lava-drift only, slow enough to read as breathing
      rather than moving: the drift clock advances ~0.46 units/s against a
      field ~8 periods across, so a feature takes ~17s to cross the ball. The
      dome rolls once every ~45s. Nothing pulses — `pulse` is left near zero
      so idle carries no rings — but the drift keeps it from reading as a
      paused frame. Mid brightness, soft contrast: legible, not demanding.
    */
    idle: {
      cells: 18,
      contrast: 1.35,
      density: 0.26,
      drift: 1.1,
      dropout: 0.42,
      gain: 0.88,
      light: 0.7,
      pulse: 0.12,
      rim: 0.6,
      scale: 1.6,
      scroll: 0.05,
      speed: 0.22,
      spin: 0.25,
    },
    /*
      Working. Deliberately NOT rhythmic: no beat worth the name, because
      `pulse` stays at 0.2 and `speed` at 0.55, which is a ~6s swell the
      renderer rate-modulates at ~0.17Hz — too slow to read as a cadence.
      The restlessness is diagonal turbulence instead, drift ~2.7x idle's,
      plus the fastest dome roll of the three. `drift` and `spin` run at
      non-harmonic periods so they never lock into a loop. Deliberately the
      dimmest state (gain 0.72, lowest density) so amber reads as background
      labour rather than as an answer forming, and the finest cell of the
      three for a busier, less settled texture.
    */
    thinking: {
      cells: 20,
      contrast: 1.6,
      density: 0.18,
      drift: 3,
      dropout: 0.3,
      gain: 0.72,
      light: 0.45,
      pulse: 0.2,
      rim: 0.45,
      scale: 2.8,
      scroll: 0.9,
      speed: 0.55,
      spin: 0.9,
    },
    /*
      Answering. The only state with a beat, and the most legible: the
      largest cell (16), the sharpest contrast (2.2), the fewest dropouts.
      Motion is a near-pure vertical page — drift is 12x smaller than
      thinking's, so the field travels one way at ~1.5 units/s while the
      radial pulse lands on top of it at 3.5Hz, swapping each cell between
      one lit row in the trough, three typically, and four at the crest.
      `speed` is doing the beating and `pulse` its depth; nothing else here
      should compete for attention.
    */
    speaking: {
      cells: 16,
      contrast: 2.2,
      density: 0.34,
      drift: 0.25,
      dropout: 0.24,
      gain: 1.05,
      light: 0.5,
      pulse: 0.95,
      rim: 0.5,
      scale: 2.4,
      scroll: 1.5,
      speed: 9.8,
      spin: 0.15,
    },
  },
  uniforms: orb23Params,
};
