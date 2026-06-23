'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { type CSSProperties, type ReactNode } from 'react';

type UptimeBarTooltipProps = {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  /**
   * The `.bl-status-page` root. Radix portals tooltip content to document.body by
   * default, which sits outside the element that declares the --sp-* theme variables,
   * so the tooltip would lose the owner's colors and color-scheme. Portaling into the
   * status-page root instead lets the theme cascade into the tooltip. Falls back to
   * the default portal target while the root is being resolved.
   */
  container?: HTMLElement | null;
};

const CARD_STYLE: CSSProperties = {
  background: 'var(--sp-card-bg)',
  borderColor: 'var(--sp-card-border)',
  boxShadow: 'var(--sp-card-shadow)',
};

export function UptimeBarTooltip({ title, description, children, container }: UptimeBarTooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={0} disableHoverableContent>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal container={container ?? undefined}>
        <TooltipPrimitive.Content
          side='top'
          sideOffset={6}
          className='animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 pointer-events-none z-50 rounded-lg border p-2.5 backdrop-blur-sm'
          style={CARD_STYLE}
        >
          <div className='space-y-0.5'>
            <div className='text-xs font-semibold' style={{ color: 'var(--sp-text)' }}>
              {title}
            </div>
            <div className='text-sm font-medium' style={{ color: 'var(--sp-muted)' }}>
              {description}
            </div>
          </div>
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
