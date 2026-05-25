'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Github, Star, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { baEvent } from '@/lib/ba-event';
import {
  getGithubStarPromptEligibility,
  markGithubStarPromptDismissed,
  markGithubStarPromptStarred,
} from '@/actions/githubStarPrompt.action';
import { useIsMobile } from '@/hooks/use-mobile';

const REPO_URL = 'https://github.com/betterlytics/betterlytics';

interface GithubStarCardProps {
  eligibilityPromise: ReturnType<typeof getGithubStarPromptEligibility>;
}

const SHOW_DELAY_MS = 15_000;
const EXIT_ANIMATION_MS = 500;

export default function GithubStarCard({ eligibilityPromise }: GithubStarCardProps) {
  const eligibilityResponse = use(eligibilityPromise);
  const eligible = eligibilityResponse.success && eligibilityResponse.data;
  const isMobile = useIsMobile();
  const t = useTranslations('githubStar');
  const [hidden, setHidden] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!eligible || isMobile) return;
    const timer = setTimeout(() => {
      setVisible(true);
      baEvent('github-star-shown');
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [eligible, isMobile]);

  if (!eligible || hidden || isMobile) return null;

  const animateOutThenHide = () => {
    setVisible(false);
    setTimeout(() => setHidden(true), EXIT_ANIMATION_MS);
  };

  const handleStar = () => {
    baEvent('github-star-clicked');
    animateOutThenHide();
    markGithubStarPromptStarred().catch((error) => {
      console.error('Failed to mark github star prompt starred', error);
    });
  };

  const handleDismiss = () => {
    baEvent('github-star-dismissed');
    animateOutThenHide();
    markGithubStarPromptDismissed().catch((error) => {
      console.error('Failed to mark github star prompt dismissed', error);
    });
  };

  return (
    <Card
      aria-labelledby='github-star-card-title'
      inert={!visible}
      className={`fixed right-4 bottom-4 z-50 hidden w-[calc(100vw-2rem)] max-w-xs gap-0 overflow-hidden border-0 p-0 shadow-2xl transition-all duration-500 ease-out motion-reduce:transition-none md:flex ${
        visible ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-8 opacity-0'
      }`}
    >
      <div className='from-primary/90 via-primary to-primary/80 relative h-20 bg-gradient-to-br'>
        <div className='absolute inset-y-0 right-0 w-1/2 opacity-40'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)]' />
        </div>

        <Star className='absolute top-3 right-14 h-2 w-2 fill-white/40 text-white/40' />
        <Star className='absolute top-9 right-6 h-3 w-3 fill-white/35 text-white/35' />
        <Star className='absolute top-5 left-40 h-2.5 w-2.5 fill-white/30 text-white/30' />

        <Button
          type='button'
          variant='ghost'
          size='icon'
          onClick={handleDismiss}
          aria-label={t('dismiss')}
          className='absolute top-2 right-2 h-7 w-7 cursor-pointer text-white/70 hover:bg-white/15 hover:text-white'
        >
          <X className='h-4 w-4' />
        </Button>

        <div className='bg-background absolute -bottom-6 left-5 flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl ring-4 ring-black/5 dark:ring-white/20'>
          <Github className='text-foreground h-6 w-6' />
        </div>
      </div>

      <CardContent className='space-y-3 px-5 pt-9 pb-5'>
        <div>
          <CardTitle id='github-star-card-title' className='text-lg font-bold'>
            {t('title')}
          </CardTitle>
          <CardDescription className='mt-1 text-sm leading-snug'>{t('description')}</CardDescription>
        </div>

        <Button asChild size='default' className='w-full' onClick={handleStar}>
          <Link href={REPO_URL} target='_blank' rel='noopener noreferrer'>
            <Star className='h-4 w-4 fill-amber-400 text-amber-400' />
            {t('action')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
