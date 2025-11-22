'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WhatsNewEntry } from '@/content/whats-new';

type WhatsNewDialogProps = {
  entry: Omit<WhatsNewEntry, 'Content'>;
  children: React.ReactNode;
};

export function WhatsNewDialog({ entry, children }: WhatsNewDialogProps) {
  const [isOpen, setIsOpen] = useState(true);

  const releaseDateLabel = useMemo(() => {
    const parsedDate = new Date(entry.releasedAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return entry.releasedAt;
    }
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(parsedDate);
  }, [entry.releasedAt]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='w-full max-w-xl border-none bg-transparent p-0 shadow-none'>
        <article className='border-border/60 bg-background overflow-hidden rounded-[24px] border shadow-2xl ring-1 ring-black/5 dark:ring-white/5'>
          <header className='from-primary/15 via-primary/10 dark:from-primary/25 dark:via-primary/15 relative overflow-hidden bg-gradient-to-br to-transparent px-6 py-6'>
            <div className='absolute inset-y-0 right-0 hidden w-1/2 opacity-20 md:block'>
              <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent_55%)]' />
            </div>
            <div className='relative flex items-center justify-between text-white'>
              <DialogHeader className='text-left text-white'>
                <p className='flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.35em] text-white/70 uppercase'>
                  <Sparkles className='size-3.5 text-white' />
                  What&apos;s New
                </p>
                <DialogDescription className='mt-1 text-sm text-white/90'>
                  Version {entry.version} &middot; Released on {releaseDateLabel}
                </DialogDescription>
              </DialogHeader>
              <Badge
                variant='secondary'
                className='rounded-full bg-white/15 px-3 py-1 text-[0.7rem] font-semibold text-white backdrop-blur'
              >
                {entry.version}
              </Badge>
            </div>
          </header>

          <section className='text-muted-foreground space-y-4 px-5 py-6 text-sm leading-6 md:px-6'>
            <div className='[&_a]:text-primary [&_h2]:border-border/40 [&_h2]:text-foreground/60 [&_li]:marker:text-primary space-y-4 [&_a]:underline [&_h2]:mt-3 [&_h2]:border-t [&_h2]:pt-3 [&_h2]:text-[0.7rem] [&_h2]:font-semibold [&_h2]:tracking-[0.35em] [&_h2]:uppercase'>
              {children}
            </div>
          </section>

          <DialogFooter className='border-border/60 bg-muted/30 text-muted-foreground flex flex-col gap-2 rounded-b-[24px] border-t px-5 py-4 text-left text-[0.7rem] sm:flex-row sm:items-center sm:justify-between md:px-6'>
            <p className='text-muted-foreground/80 max-w-sm text-[0.65rem] tracking-[0.2em] uppercase sm:max-w-none sm:text-[0.7rem]'>
              Spot something we should refine? Drop us a note so the next release is even better.
            </p>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <Button variant='outline' asChild className='w-full cursor-pointer text-sm sm:w-auto'>
                <Link href='/changelog'>View all updates</Link>
              </Button>
              <Button className='w-full cursor-pointer text-sm sm:w-auto' onClick={() => setIsOpen(false)}>
                Got it
              </Button>
            </div>
          </DialogFooter>
        </article>
      </DialogContent>
    </Dialog>
  );
}
