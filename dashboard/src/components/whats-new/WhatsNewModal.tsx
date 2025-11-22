'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getCurrentWhatsNewModalDisplayForLocale } from '@/content/whats-new';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { markWhatsNewSeenAction } from '@/app/actions/whatsNew';
import { useLocale, useTranslations } from 'next-intl';

export function WhatsNewModal() {
  const t = useTranslations('components.whatsNew');
  const locale = useLocale();
  const currentWhatsNewModalDisplay = getCurrentWhatsNewModalDisplayForLocale(locale);

  if (!currentWhatsNewModalDisplay) {
    return null;
  }

  const { data: session } = useSession();
  const { Content, ...metadata } = currentWhatsNewModalDisplay;
  const sessionSeenVersion = session?.user?.changelogVersionSeen ?? 'v0';

  const [isOpen, setIsOpen] = useState(false);
  const [lastSeenVersion, setLastSeenVersion] = useState(sessionSeenVersion);
  const [isMarkingSeen, startMarkingSeen] = useTransition();

  useEffect(() => {
    if (!session?.user?.changelogVersionSeen) {
      return;
    }
    setLastSeenVersion(session.user.changelogVersionSeen);
  }, [session?.user?.changelogVersionSeen]);

  const isUnread = metadata.version !== lastSeenVersion;

  const parsedDate = new Date(metadata.releasedAt);
  const releaseDateLabel = Number.isNaN(parsedDate.getTime())
    ? metadata.releasedAt
    : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(parsedDate);

  useEffect(() => {
    if (!isUnread || !isOpen || isMarkingSeen) {
      return;
    }

    startMarkingSeen(async () => {
      try {
        await markWhatsNewSeenAction(metadata.version);
        setLastSeenVersion(metadata.version);
      } catch (error) {
        console.error('Failed to update changelog version seen', error);
      }
    });
  }, [isUnread, isOpen, isMarkingSeen, metadata.version, startMarkingSeen]);

  return (
    <>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className={cn(
                'text-foreground hover:bg-muted/60 relative h-10 w-10 rounded-full transition-colors',
                isUnread && 'bg-primary/10 hover:bg-primary/20',
              )}
              aria-label={`View what's new in version ${metadata.version}`}
              onClick={() => setIsOpen(true)}
            >
              <Sparkles className='text-foreground h-4 w-4' />
              {isUnread && (
                <span className='bg-primary pointer-events-none absolute -top-1.5 right-0 flex translate-x-1/2 items-center rounded-full px-1.5 py-0.5 text-[0.55rem] font-semibold tracking-[0.25em] text-white uppercase shadow-lg'>
                  New
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isUnread ? 'New release available' : "What's new"}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='w-full max-w-xl border-none bg-transparent p-0 shadow-none'>
          <article className='border-border/90 bg-background overflow-hidden rounded-3xl border shadow-2xl ring-1 ring-black/5 dark:ring-white/5'>
            <header className='from-primary/90 via-primary to-primary/80 border-border/60 relative overflow-hidden border-b bg-gradient-to-br px-6 py-4'>
              <div className='absolute inset-y-0 right-0 hidden w-1/2 opacity-40 md:block'>
                <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)]' />
              </div>
              <div className='relative flex items-center justify-between'>
                <DialogHeader className='text-left'>
                  <DialogTitle className='text-primary-foreground/90 flex items-center gap-2 text-xs font-semibold tracking-[0.32em] uppercase sm:text-sm'>
                    <Sparkles className='text-primary-foreground size-3.5' />
                    {t('title')}
                  </DialogTitle>
                  <DialogDescription className='text-primary-foreground/80 mt-0.5 text-xs'>
                    {metadata.version} &middot; {releaseDateLabel}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </header>

            <section className='text-muted-foreground/90 space-y-4 px-5 py-6 text-sm leading-6 md:px-6'>
              <div className='[&_a]:text-primary [&_h2]:text-foreground [&_li]:marker:text-muted-foreground [&_section+section]:border-border/40 space-y-4 [&_a]:underline [&_h2]:text-[0.7rem] [&_h2]:font-semibold [&_h2]:tracking-[0.35em] [&_h2]:uppercase [&_section+section]:mt-4 [&_section+section]:border-t [&_section+section]:pt-4'>
                <Content />
              </div>
            </section>

            <DialogFooter className='border-border/60 bg-muted/30 text-muted-foreground flex flex-col gap-3 rounded-b-[24px] border-t px-5 py-5 text-left text-[0.7rem] sm:flex-row sm:items-center sm:justify-between md:px-6'>
              <p className='text-muted-foreground/80 max-w-sm text-[0.7rem] leading-snug sm:max-w-md'>
                {t('haveFeedback')}
              </p>
              <div className='flex flex-col gap-2 sm:flex-row'>
                <Button variant='ghost' asChild className='w-full cursor-pointer text-sm sm:w-auto'>
                  <Link href='/changelog'>{t('viewAll')}</Link>
                </Button>
                <Button className='w-full cursor-pointer text-sm sm:w-auto' onClick={() => setIsOpen(false)}>
                  {t('gotIt')}
                </Button>
              </div>
            </DialogFooter>
          </article>
        </DialogContent>
      </Dialog>
    </>
  );
}
