'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { type CSSProperties, type ReactNode } from 'react';
import type { StatusPageTheme } from '@/entities/analytics/statusPage/statusPage.entities';

type UptimeBarTooltipProps = {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  /**
   * Owner theme, re-declared on the tooltip itself. The content portals to document.body
   * (Radix default), outside the `.bl-status-page` scope that declares the --sp-* variables
   * and color-scheme, so the content re-establishes that scope via the class + data attribute.
   *
   * Portaling into the status-page root instead would break positioning: the root is a
   * container-query container, which Floating UI still treats as a `position: fixed`
   * containing block while browsers no longer do, and in the studio preview the root
   * additionally sits inside a CSS `zoom` wrapper that Floating UI doesn't account for.
   */
  theme: StatusPageTheme;
};

const CARD_STYLE: CSSProperties = {
  background: 'var(--sp-card-bg)',
  borderColor: 'var(--sp-card-border)',
  boxShadow: 'var(--sp-card-shadow)',
};

export function UptimeBarTooltip({ title, description, children, theme }: UptimeBarTooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={0} disableHoverableContent>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side='top'
          sideOffset={6}
          data-sp-theme={theme}
          className='bl-status-page animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 pointer-events-none z-50 rounded-lg border p-2.5 font-sans antialiased backdrop-blur-sm'
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
