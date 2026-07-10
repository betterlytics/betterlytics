'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SupportedLanguages } from '@/constants/i18n';
import { formatElapsedTime, formatLocalDateTime, formatRelativeTimeFromNow } from '@/utils/dateFormatters';
import { useDisplayHour12 } from '@/hooks/use-display-hour12';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { type DetectedOutageSuggestion } from '@/entities/analytics/statusPage/statusPageIncident.entities';
import { IMPACT_BADGE, IMPACT_DOT, STATUS_TONE_BADGE } from '@/components/statusPage/incidentToneStyles';
import { MonitorPills } from './MonitorPills';

type IncidentSuggestionsPanelProps = {
  suggestions: DetectedOutageSuggestion[];
  onCreateIncident: (suggestion: DetectedOutageSuggestion) => void;
};

export function IncidentSuggestionsPanel({ suggestions, onCreateIncident }: IncidentSuggestionsPanelProps) {
  const t = useTranslations('statusPagesPage.editor.incidents');
  const locale = useLocale() as SupportedLanguages;
  const hour12 = useDisplayHour12();
  const [panelOpen, setPanelOpen] = useState(false);

  if (suggestions.length === 0) return null;

  return (
    <div className='overflow-hidden rounded-xl border border-amber-500/40 bg-amber-500/5'>
      <button
        type='button'
        onClick={() => setPanelOpen((prev) => !prev)}
        aria-expanded={panelOpen}
        className='flex w-full cursor-pointer items-center gap-3 bg-amber-500/6 px-4 py-3 text-left'
      >
        <TriangleAlert className='h-5 w-5 flex-none text-amber-500' />
        <div className='min-w-0 flex-1'>
          <div className='text-sm font-semibold'>{t('detectedPanelTitle', { count: suggestions.length })}</div>
          <div className='text-muted-foreground text-xs'>{t('suggestionsHint')}</div>
        </div>
        <ChevronDown
          className={cn(
            'text-muted-foreground h-4 w-4 flex-none transition-transform',
            panelOpen && 'rotate-180',
          )}
        />
      </button>
      {panelOpen && (
        <div className='max-h-80 overflow-y-auto'>
          <table className='w-full'>
            <thead>
              <tr className='text-muted-foreground border-y border-amber-500/20 bg-amber-500/7 text-left text-[11px] tracking-wider uppercase'>
                <th className='py-2 pr-3 pl-4 font-semibold'>{t('suggestionsTable.outage')}</th>
                <th className='hidden px-3 py-2 font-semibold md:table-cell'>{t('suggestionsTable.monitors')}</th>
                <th className='hidden px-3 py-2 font-semibold sm:table-cell'>{t('suggestionsTable.detected')}</th>
                <th className='hidden px-3 py-2 font-semibold lg:table-cell'>{t('suggestionsTable.duration')}</th>
                <th className='px-3 py-2 font-semibold'>{t('suggestionsTable.status')}</th>
                <th className='py-2 pr-4 pl-3' />
              </tr>
            </thead>
            <tbody className='divide-y divide-amber-500/15'>
              {suggestions.map((suggestion) => {
                const isMulti = suggestion.monitors.length > 1;
                const heading = isMulti
                  ? t('detectedGroupMulti', { count: suggestion.monitors.length })
                  : suggestion.monitors[0].monitorPublicName;
                const detected = suggestion.ongoing
                  ? formatRelativeTimeFromNow(suggestion.startedAt, locale)
                  : (formatLocalDateTime(suggestion.startedAt, locale, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12,
                    }) ?? '');
                const durationMs =
                  (suggestion.ongoing
                    ? Date.now()
                    : new Date(suggestion.resolvedAt ?? suggestion.startedAt).getTime()) -
                  new Date(suggestion.startedAt).getTime();
                const duration = formatElapsedTime(new Date(Date.now() - durationMs), locale);
                return (
                  <tr key={suggestion.detectedIncidentId} className='hover:bg-amber-500/6'>
                    <td className='w-full max-w-0 min-w-[160px] py-2.5 pr-3 pl-4'>
                      <div className='flex items-center gap-2.5'>
                        <span className='relative flex h-2 w-2 flex-none'>
                          {suggestion.ongoing && (
                            <span
                              className={cn(
                                'absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping',
                                IMPACT_DOT[suggestion.suggestedImpact],
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              'relative inline-flex h-2 w-2 rounded-full',
                              suggestion.ongoing ? IMPACT_DOT[suggestion.suggestedImpact] : 'bg-emerald-500',
                            )}
                          />
                        </span>
                        <span className='truncate text-sm font-medium'>{heading}</span>
                      </div>
                    </td>
                    <td className='hidden px-3 py-2.5 md:table-cell'>
                      <MonitorPills names={suggestion.monitors.map((monitor) => monitor.monitorPublicName)} />
                    </td>
                    <td
                      suppressHydrationWarning
                      className='text-muted-foreground hidden px-3 py-2.5 text-xs whitespace-nowrap sm:table-cell'
                    >
                      {detected}
                    </td>
                    <td
                      suppressHydrationWarning
                      className='text-muted-foreground hidden px-3 py-2.5 text-xs whitespace-nowrap lg:table-cell'
                    >
                      {duration}
                    </td>
                    <td className='px-3 py-2.5'>
                      <Badge
                        variant='outline'
                        className={cn(
                          'whitespace-nowrap',
                          suggestion.ongoing ? IMPACT_BADGE[suggestion.suggestedImpact] : STATUS_TONE_BADGE.green,
                        )}
                      >
                        {suggestion.ongoing ? t('suggestionsTable.ongoing') : t('suggestionsTable.resolved')}
                      </Badge>
                    </td>
                    <td className='py-2.5 pr-4 pl-3 text-right'>
                      <PermissionGate>
                        {(disabled) => (
                          <Button
                            size='sm'
                            disabled={disabled}
                            onClick={() => onCreateIncident(suggestion)}
                            className='flex-none cursor-pointer'
                          >
                            {t('createFromSuggestion')}
                          </Button>
                        )}
                      </PermissionGate>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
