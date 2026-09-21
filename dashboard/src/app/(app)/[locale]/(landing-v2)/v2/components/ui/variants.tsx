'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  DEFAULT_VARIANT,
  VARIANT_KEY,
  VARIANTS,
  type VariantId,
} from '@/app/(app)/[locale]/(landing-v2)/v2/lib/variants';

const Ctx = createContext<{ variant: VariantId; setVariant: (next: VariantId) => void }>({
  variant: DEFAULT_VARIANT,
  setVariant: () => {},
});

const isVariant = (v: unknown): v is VariantId => VARIANTS.some((x) => x.id === v);

/**
 * Holds the chosen layout variant. The server renders the default; on mount
 * the choice is read from `?variant=` first, then localStorage, and persisted.
 */
export function VariantProvider({ children }: { children: ReactNode }) {
  const [variant, set] = useState<VariantId>(DEFAULT_VARIANT);
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('variant');
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(VARIANT_KEY);
    } catch {}
    const pick = isVariant(fromUrl) ? fromUrl : isVariant(stored) ? stored : DEFAULT_VARIANT;
    set(pick);
  }, []);
  const setVariant = (v: VariantId) => {
    set(v);
    try {
      window.localStorage.setItem(VARIANT_KEY, v);
    } catch {}
  };
  return <Ctx.Provider value={{ variant, setVariant }}>{children}</Ctx.Provider>;
}

/** Renders the slot for the active variant. Slots are server-rendered and passed in as props. */
export function Variants(slots: Record<VariantId, ReactNode>) {
  const { variant } = useContext(Ctx);
  return <>{slots[variant]}</>;
}

/** The floating segmented control, bottom right. Preview-only. */
export function VariantToggle() {
  const { variant, setVariant } = useContext(Ctx);
  return (
    <div className='vt' role='radiogroup' aria-label='Layout variant'>
      <span className='vt__lab'>One script</span>
      {VARIANTS.map((v) => (
        <button
          key={v.id}
          type='button'
          role='radio'
          aria-checked={variant === v.id}
          title={v.hint}
          className={cn(variant === v.id && 'is-on')}
          onClick={() => setVariant(v.id)}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
