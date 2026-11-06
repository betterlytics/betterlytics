"use client";

// a copy of dashboard/src/components/notFound/InkedNumerals.tsx: the docs app can't import from the dashboard package

import { useEffect, useRef, type CSSProperties } from "react";
import { Schibsted_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";
import styles from "./InkedNumerals.module.css";

const heavy = Schibsted_Grotesk({ subsets: ["latin"], weight: "800" });

/* Schibsted Grotesk 800 at 1000 units: each digit's ink from its origin; a 4 rises 703, the 0 overshoots 16 each way */
const INK = { "4": [16, 625], "0": [31, 609] } as const;
const OVERLAP = 60;

let cursor = 0;
const GLYPHS = (["4", "0", "4"] as const).map((char) => {
  const x = cursor - INK[char][0];
  cursor = x + INK[char][1] - OVERLAP;
  return { char, x };
});
const WIDTH = cursor + OVERLAP;
const BASELINE = 719;
const PAD = 4;
const VIEW = {
  x: -PAD,
  y: -PAD,
  width: WIDTH + 2 * PAD,
  height: BASELINE + 16 + 2 * PAD,
};

/* in viewBox units, about 180px across at the 820px cap */
const LENS_RADIUS = 360;
/* share of the remaining distance the lens covers each frame */
const FOLLOW = 0.14;

function Glyphs() {
  return GLYPHS.map(({ char, x }, i) => (
    <text key={i} x={x} y={BASELINE}>
      {char}
    </text>
  ));
}

function useLens() {
  const rootRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const lens = lensRef.current;
    if (!root || !lens) return;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let target: { x: number; y: number } | null = null;
    let at: { x: number; y: number } | null = null;
    let frame = 0;
    const step = () => {
      frame = 0;
      if (!target) return;
      at = at
        ? {
            x: at.x + (target.x - at.x) * FOLLOW,
            y: at.y + (target.y - at.y) * FOLLOW,
          }
        : target;
      lens.setAttribute("cx", at.x.toFixed(1));
      lens.setAttribute("cy", at.y.toFixed(1));
      if (Math.hypot(target.x - at.x, target.y - at.y) > 0.5)
        frame = requestAnimationFrame(step);
    };
    const hide = () => {
      delete root.dataset.lens;
      at = null;
    };
    const move = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const x =
        VIEW.x + ((event.clientX - rect.left) / rect.width) * VIEW.width;
      const y =
        VIEW.y + ((event.clientY - rect.top) / rect.height) * VIEW.height;
      const near =
        x > VIEW.x - LENS_RADIUS &&
        x < VIEW.x + VIEW.width + LENS_RADIUS &&
        y > VIEW.y - LENS_RADIUS &&
        y < VIEW.y + VIEW.height + LENS_RADIUS;
      if (!near) return hide();
      root.dataset.lens = "";
      target = { x, y };
      if (!frame) frame = requestAnimationFrame(step);
    };
    const leave = (event: PointerEvent) => {
      if (!event.relatedTarget) hide();
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerout", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerout", leave);
      cancelAnimationFrame(frame);
      hide();
    };
  }, []);

  return { rootRef, lensRef };
}

export function InkedNumerals({ className }: { className?: string }) {
  const { rootRef, lensRef } = useLens();
  return (
    <div
      ref={rootRef}
      className={cn(styles.numerals, className)}
      style={{ aspectRatio: `${VIEW.width} / ${VIEW.height}` } as CSSProperties}
      role="img"
      aria-label="404"
    >
      <svg
        className={cn(styles.svg, heavy.className)}
        viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.width} ${VIEW.height}`}
        aria-hidden
      >
        <defs>
          <pattern
            id="not-found-hatch"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <path d="M0 0V20" className={styles.hatchLine} />
          </pattern>
          <pattern
            id="not-found-cross"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <path d="M0 0V20M0 0H20" className={styles.crossLine} />
          </pattern>
          {/* masks the outline to outside the glyphs: only its outer half shows, and the overlaps merge into one */}
          <mask id="not-found-outside" maskUnits="userSpaceOnUse" {...VIEW}>
            <rect {...VIEW} fill="white" />
            <g fill="black">
              <Glyphs />
            </g>
          </mask>
          <radialGradient id="not-found-lens-fade">
            <stop offset="0" stopColor="white" />
            <stop offset="0.4" stopColor="white" stopOpacity="0.7" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="not-found-lens" maskUnits="userSpaceOnUse" {...VIEW}>
            <circle
              ref={lensRef}
              r={LENS_RADIUS}
              cx={-LENS_RADIUS}
              cy={-LENS_RADIUS}
              fill="url(#not-found-lens-fade)"
            />
          </mask>
        </defs>
        <g className={styles.outline} mask="url(#not-found-outside)">
          <Glyphs />
        </g>
        <g className={styles.tint}>
          <Glyphs />
        </g>
        <g className={styles.hatch}>
          <Glyphs />
        </g>
        <g className={styles.lens} mask="url(#not-found-lens)">
          <g className={styles.cross}>
            <Glyphs />
          </g>
          <g className={styles.lensOutline} mask="url(#not-found-outside)">
            <Glyphs />
          </g>
        </g>
      </svg>
    </div>
  );
}
