"use client";

import dynamic from "next/dynamic";
import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from "react";
import { Terminal } from "lucide-react";

import type { OrbState } from "@/lib/groot/agent";
import { type EmotionId, orbColorsFor } from "@/lib/groot/emotion";

/**
 * Failure-isolated mount for the ORB-23 shader.
 *
 * This exists because the orb is the one part of the widget that can take the
 * whole page down. `gpu.ts` resolves a WGSL fragment through `tgpu.resolve()`,
 * which needs build-time metadata from `unplugin-typegpu`. If that plugin is
 * missing or misconfigured, the failure happens at *module evaluation* — and a
 * module-evaluation throw inside a statically imported component takes down the
 * entire route with a 500.
 *
 * Two defences:
 *
 *  1. `next/dynamic` with `ssr: false` puts the orb in its own chunk, so the
 *     import is never part of the page's module graph during SSR or first load.
 *  2. An error boundary around it, so a runtime rejection degrades to the static
 *     icon instead of unmounting the tree.
 *
 * The widget must never be unavailable because a GPU shader failed to compile.
 * WebGPU support, the orb's cost, and its licensing are all reasons this stays
 * optional rather than load-bearing.
 */

// Loaded outside the render path on purpose. Named export, so map it explicitly.
const Orb23 = dynamic(
  () => import("@/components/orbs/orb-23").then((mod) => mod.Orb23),
  { ssr: false },
);

interface BoundaryProps {
  children: ReactNode;
  onError: () => void;
}

class OrbBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[orb] shader failed, falling back to static icon:", error, info);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * WebGPU probe. Runs after mount, never during render, so the server HTML and
 * the first client render agree — probing in initial state is a classic source
 * of hydration mismatches.
 */
function useWebGpu(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const gpu = (navigator as Navigator & { gpu?: GPU }).gpu;
    if (!gpu) {
      setSupported(false);
      return;
    }
    gpu
      .requestAdapter()
      .then((adapter) => {
        if (!cancelled) setSupported(Boolean(adapter));
      })
      .catch(() => {
        if (!cancelled) setSupported(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return supported;
}

export interface OrbToggleProps {
  state: OrbState;
  /** True while the terminal panel is open. */
  open: boolean;
  emotion?: EmotionId;
}

/**
 * Must fit inside the 64px (`size-16`) toggle button with room for the border.
 *
 * Do not reach for `scale-[...]` here. The button is a flex container, so an
 * oversized child shrinks to fit and gets squashed — a 132px orb inside `size-16`
 * was rendering at 28.7x60.7px, visibly non-square. Render it at its true size
 * instead.
 */
const ORB_SIZE = 56;

export function OrbToggle({ state, emotion = "calm" }: OrbToggleProps) {
  const webgpu = useWebGpu();
  const [shaderFailed, setShaderFailed] = useState(false);

  if (webgpu === false || shaderFailed) {
    return <Terminal className="size-6 text-primary" aria-hidden="true" />;
  }

  return (
    <OrbBoundary onError={() => setShaderFailed(true)}>
      <Orb23
        size={ORB_SIZE}
        state={state}
        stateColors={orbColorsFor(emotion)}
        /*
         * Deliberately never paused.
         *
         * `ShaderOrb` fades the canvas in on its first rendered frame
         * (`onFirstFrame` -> `paintedKey` -> `opacity: 1`). Pausing before that
         * frame deadlocks the fade, so a paused orb renders at `opacity: 0` —
         * invisible. Pausing on "panel closed and idle" also hid the affordance,
         * since the orb *is* the toggle button's face.
         *
         * Cost is bounded instead: `pauseOffscreen` already stops the frame loop
         * when the orb scrolls out of view or the tab is hidden, and 56px of
         * ASCII shader is cheap.
         */
        paused={false}
        className="pointer-events-none"
        ariaLabel=""
      />
    </OrbBoundary>
  );
}

export default OrbToggle;
