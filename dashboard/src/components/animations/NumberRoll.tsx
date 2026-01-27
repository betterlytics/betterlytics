"use client";

import { injectStyles } from "./injectStyles";
import { styles } from "./styles";

// Inject styles once when module loads (SSR-safe)
injectStyles(styles);

import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "./utils";
import { ZeroWidthSpace } from "./ZeroWidthSpace";
import { DigitReel } from "./DigitReel";
import { SymbolSlot } from "./SymbolSlot";
import { Token, TokenPhase, diffTokens, createInitialTokens } from "./tokens";

export const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type Digit = (typeof DIGITS)[number];

export type DigitPhase = "idle" | "animating" | "entering" | "exiting";

export type NumberRollProps = {
  /** The number to display */
  value: number;
  /** Locale for number formatting (default: 'en-US') */
  locales?: Intl.LocalesArgument;
  /** Intl.NumberFormat options for formatting */
  formatOptions?: Intl.NumberFormatOptions;
  /** Animation duration in milliseconds (default: 600) */
  duration?: number;
  /** Allow text selection (default: false) */
  withTextSelect?: boolean;
  /** Additional CSS classes for the outer wrapper */
  className?: string;
};

type State = {
  tokens: Token[];
  parts: Intl.NumberFormatPart[];
};

function NumberRollComponent({
  value,
  locales,
  formatOptions,
  duration = 600,
  withTextSelect = false,
  className,
}: NumberRollProps) {
  // Memoize the formatter - only recreate when locales/formatOptions change
  // Use 'en-US' as default to prevent hydration mismatch
  const resolvedLocales = locales ?? "en-US";
  const formatterRef = useRef<Intl.NumberFormat | null>(null);
  const prevOptsRef = useRef({ locales: resolvedLocales, formatOptions });

  if (
    !formatterRef.current ||
    resolvedLocales !== prevOptsRef.current.locales ||
    formatOptions !== prevOptsRef.current.formatOptions
  ) {
    formatterRef.current = new Intl.NumberFormat(
      resolvedLocales,
      formatOptions,
    );
    prevOptsRef.current = { locales: resolvedLocales, formatOptions };
  }

  const formatter = formatterRef.current;

  // Get parts from formatter
  const rawParts = useMemo(
    () => formatter.formatToParts(value),
    [formatter, value],
  );

  // State: tokens for rendering + parts for next diff
  const [state, setState] = useState<State>(() => ({
    tokens: createInitialTokens(rawParts),
    parts: rawParts,
  }));
  const prevValueRef = useRef(value);
  const prevRawPartsRef = useRef(rawParts);

  // Diff when value OR parts change (parts change = locale/format change)
  useLayoutEffect(() => {
    if (rawParts === prevRawPartsRef.current) return;

    setState((prev: State) => ({
      tokens: diffTokens(prev.tokens, prev.parts, rawParts),
      parts: rawParts,
    }));

    prevValueRef.current = value;
    prevRawPartsRef.current = rawParts;
  }, [value, rawParts]);

  // Handle phase completion
  const handlePhaseComplete = useCallback(
    (id: string, action: "completed" | "exited" | "entered") => {
      setState((prev: State) => ({
        ...prev,
        tokens:
          action === "exited"
            ? prev.tokens.filter((t: Token) => t.id !== id)
            : prev.tokens.map((t: Token) =>
                t.id === id
                  ? { ...t, phase: "idle" as TokenPhase, fromValue: undefined }
                  : t,
              ),
      }));
    },
    [],
  );

  // Formatted string for text selection and ghost measurement
  const formattedString = useMemo(
    () => formatter.format(value),
    [formatter, value],
  );

  // Ghost measurement for accurate container width
  const ghostRef = useRef<HTMLSpanElement>(null);
  const [targetWidth, setTargetWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (ghostRef.current) {
      const rect = ghostRef.current.getBoundingClientRect();
      setTargetWidth(rect.width);
    }
  }, [formattedString]);

  return (
    <span
      className={cn(
        "ba-number-roll-outer",
        !withTextSelect && "ba-no-select",
        className,
      )}
    >
      <span
        className="ba-number-roll-root"
        style={{ "--ba-duration": `${duration}ms` } as React.CSSProperties}
      >
        {/* Ghost for measurement - must NOT be constrained by container to measure natural width */}
        <span
          ref={ghostRef}
          aria-hidden="true"
          className="ba-number-roll-ghost"
          style={
            {
              letterSpacing: "calc(var(--ba-digit-width) - 1ch)",
              fontFeatureSettings: '"tnum"',
            } as React.CSSProperties
          }
        >
          {formattedString}
        </span>

        <span aria-hidden="true" className="ba-number-mask">
          <span
            className="ba-number-roll-sizer"
            style={
              {
                "--ba-target-width": targetWidth ? `${targetWidth}px` : "auto",
              } as React.CSSProperties
            }
          >
            <span className="ba-number-roll-tokens">
              <ZeroWidthSpace />
              {state.tokens.map((token: Token) => {
                if (token.type === "digit") {
                  return (
                    <DigitReel
                      key={token.id}
                      id={token.id}
                      digit={parseInt(token.value, 10) as Digit}
                      phase={token.phase as DigitPhase}
                      fromDigit={
                        token.fromValue
                          ? (parseInt(token.fromValue, 10) as Digit)
                          : null
                      }
                      onPhaseComplete={handlePhaseComplete}
                    />
                  );
                } else {
                  return (
                    <SymbolSlot
                      key={token.id}
                      id={token.id}
                      value={token.value}
                      phase={
                        token.phase as
                          | "idle"
                          | "entering"
                          | "exiting"
                          | "animating"
                      }
                      fromValue={token.fromValue}
                      onPhaseComplete={handlePhaseComplete}
                    />
                  );
                }
              })}
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}

export const NumberRoll = React.memo(NumberRollComponent);
NumberRoll.displayName = "NumberRoll";
