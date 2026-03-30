import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function ErrorTrackingCard() {
  const t = await getTranslations('public.landing.cards.errorTracking');

  const errors = [
    {
      type: 'TypeError',
      message: "Cannot read properties of null (reading 'user')",
      frame: 'getUserProfile · app.js:142',
      users: 14,
      status: 'unresolved' as const,
      hasReplay: true,
    },
    {
      type: 'ReferenceError',
      message: 'stripe is not defined',
      frame: 'initPayment · checkout.js:87',
      users: 6,
      status: 'unresolved' as const,
      hasReplay: true,
    },
    {
      type: 'TypeError',
      message: 'Failed to fetch',
      frame: 'submitForm · contact.js:31',
      users: 2,
      status: 'resolved' as const,
      hasReplay: true,
    },
  ];

  return (
    <Card className='bg-card/70 border-border/70 dark:border-border/60 before:via-primary/40 relative gap-3 overflow-hidden border shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:content-[""]'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-xl'>{t('title')}</CardTitle>
        <CardDescription className='text-base'>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-1.5'>
        {errors.map((error) => (
          <div
            key={error.type + error.message}
            className={`bg-muted/40 border-border/40 relative overflow-hidden rounded-lg border py-2 pr-3 pl-4 ${
              error.status === 'unresolved'
                ? 'before:bg-destructive/70 before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-[""]'
                : 'before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-green-500/60 before:content-[""]'
            }`}
          >
            <div className='flex items-center gap-1.5'>
              <span className='text-destructive shrink-0 text-xs font-semibold'>{error.type}</span>
              <span
                className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  error.status === 'unresolved'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }`}
              >
                {t(`status.${error.status}`)}
              </span>
              <span className='text-muted-foreground ml-auto flex shrink-0 items-center gap-1 text-[11px] tabular-nums'>
                <Users className='h-2.5 w-2.5' />
                {t('usersAffected', { count: error.users })}
              </span>
            </div>

            <p className='text-foreground/80 mt-0.5 truncate text-xs font-medium'>{error.message}</p>

            <div className='mt-1 flex items-center gap-2'>
              <p className='dark:text-muted-foreground/60 text-muted-foreground min-w-0 truncate font-mono text-[10px]'>at {error.frame}</p>
              <span className='text-muted-foreground/80 ml-auto flex shrink-0 items-center gap-1 text-[11px]'>
                <Play className='h-2.5 w-2.5' />
                {t('watchReplay')}
              </span>
            </div>
          </div>
        ))}

        <div className='border-border/60 border-t pt-2'>
          <div className='text-muted-foreground flex items-center justify-between text-xs'>
            <span>{t('summary')}</span>
            <span className='text-destructive font-medium'>{t('unresolved', { count: 2 })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
