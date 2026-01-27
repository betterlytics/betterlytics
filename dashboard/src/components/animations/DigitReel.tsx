"use client";

import React, { useCallback } from "react";
import { cn } from "./utils";
import { DIGITS, type Digit, type DigitPhase } from "./NumberRoll";

type DigitReelProps = {
  id: string;
  digit: Digit;
  phase: DigitPhase;
  fromDigit: Digit | null;
  onPhaseComplete: (id: string, action: "completed" | "exited") => void;
};

function DigitReelComponent({ id, digit, phase, onPhaseComplete }: DigitReelProps) {
  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent) => {
      if (e.target !== e.currentTarget) return;

      if (e.animationName.includes("digit-exit")) {
        onPhaseComplete(id, "exited");
      } else if (e.animationName.includes("digit-enter")) {
        onPhaseComplete(id, "completed");
      }
    },
    [onPhaseComplete, id],
  );

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent) => {
      if (e.target !== e.currentTarget) return;
      if (phase === "animating" && e.propertyName === "transform") {
        onPhaseComplete(id, "completed");
      }
    },
    [onPhaseComplete, phase, id],
  );

  return (
    <span
      className="ba-digit-reel-wrapper"
      data-phase={phase}
      onAnimationEnd={handleAnimationEnd}
      onTransitionEnd={handleTransitionEnd}
    >
      <span className="ba-digit-reel-mask">
        <span
          className="ba-digit-reel-inner"
          style={
            {
              "--ba-target-offset": `${-digit * 10}%`,
            } as React.CSSProperties
          }
          data-phase={phase}
        >
          {DIGITS.map((d) => (
            <span
              key={d}
              className={cn(
                "ba-digit-reel-digit",
                d !== digit && "ba-inactive",
              )}
            >
              {d}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

export const DigitReel = React.memo(DigitReelComponent);
DigitReel.displayName = "DigitReel";
