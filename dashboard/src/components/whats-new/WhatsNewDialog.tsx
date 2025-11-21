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
      <DialogContent className='w-full max-w-2xl border-none bg-transparent p-0 shadow-none'>
        <article className='border-border/60 bg-background overflow-hidden rounded-[28px] border shadow-2xl ring-1 ring-black/5 dark:ring-white/5'>
          <header className='from-primary/15 via-primary/10 dark:from-primary/25 dark:via-primary/15 relative overflow-hidden bg-gradient-to-br to-transparent px-7 py-8'>
            <div className='absolute inset-0 opacity-30'>
              <div className='bg-primary/40 absolute top-1/2 -right-10 hidden h-48 w-48 -translate-y-1/2 rounded-full blur-[120px] md:block' />
            </div>
            <div className='relative flex items-center justify-between text-white'>
              <DialogHeader className='text-left text-white'>
                <p className='flex items-center gap-2 text-xs font-semibold tracking-[0.3em] text-white/80 uppercase'>
                  <Sparkles className='size-4 text-white' />
                  What&apos;s New
                </p>
                <DialogTitle className='mt-3 text-2xl leading-tight font-semibold text-white'>
                  Latest release highlights
                </DialogTitle>
                <DialogDescription className='mt-1 text-sm text-white/90'>
                  Version {entry.version} &middot; Released on {releaseDateLabel}
                </DialogDescription>
              </DialogHeader>
              <Badge
                variant='secondary'
                className='rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur'
              >
                {entry.version}
              </Badge>
            </div>
          </header>

          <section className='space-y-6 px-6 py-8 md:px-8'>
            <div className='text-muted-foreground [&_a]:text-primary [&_h2]:text-foreground [&_li]:marker:text-primary space-y-4 text-sm leading-6 [&_a]:underline [&_h2]:mt-4 [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:tracking-[0.25em] [&_h2]:uppercase'>
              {children}
            </div>
          </section>

          <DialogFooter className='border-border/60 bg-muted/30 flex flex-col gap-2 rounded-b-[28px] border-t px-6 py-5 text-left md:flex-row md:items-center md:justify-between md:px-8'>
            <p className='text-muted-foreground text-xs'>
              Spot something we should refine? Drop us a note so the next release is even better.
            </p>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <Button variant='outline' asChild className='w-full sm:w-auto'>
                <Link href='/changelog'>View all updates</Link>
              </Button>
              <Button className='w-full cursor-pointer sm:w-auto' onClick={() => setIsOpen(false)}>
                Got it
              </Button>
            </div>
          </DialogFooter>
        </article>
      </DialogContent>
    </Dialog>
  );
}
