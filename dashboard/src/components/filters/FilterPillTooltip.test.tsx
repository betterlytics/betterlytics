import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { TooltipProvider } from '@/components/ui-extended/tooltip';
import { FilterPillTooltip } from '@/components/filters/FilterPillTooltip';
import en from '../../../messages/en.json';

function render(disabled: boolean) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale='en' messages={en}>
      <TooltipProvider>
        <FilterPillTooltip
          filter={{ id: 'f', column: 'url', operator: '=', values: ['/a', '/b'] }}
          disabled={disabled}
        >
          <span data-filter-pill='f'>pill</span>
        </FilterPillTooltip>
      </TooltipProvider>
    </NextIntlClientProvider>,
  );
}

describe('FilterPillTooltip', () => {
  it('makes the pill itself the trigger', () => {
    expect(render(false)).toMatch(/<span data-filter-pill="f"[^>]*data-state="closed"[^>]*>pill<\/span>/);
  });
});
