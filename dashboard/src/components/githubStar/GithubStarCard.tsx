'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Github, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { baEvent } from '@/lib/ba-event';
import {
  markGithubStarPromptDismissed,
  markGithubStarPromptStarred,
} from '@/actions/githubStarPrompt.action';

const REPO_URL = 'https://github.com/betterlytics/betterlytics';

interface GithubStarCardProps {
  eligibilityPromise: Promise<boolean>;
}

export default function GithubStarCard({ eligibilityPromise }: GithubStarCardProps) {
  const eligible = use(eligibilityPromise);
  const t = useTranslations('githubStar');
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (eligible) baEvent('github-star-shown');
  }, [eligible]);

  if (!eligible || hidden) return null;

  const handleStar = () => {
    baEvent('github-star-clicked');
    setHidden(true);
    markGithubStarPromptStarred().catch((error) => {
      console.error('Failed to mark github star prompt starred', error);
    });
  };

  const handleDismiss = () => {
    baEvent('github-star-dismissed');
    setHidden(true);
    markGithubStarPromptDismissed().catch((error) => {
      console.error('Failed to mark github star prompt dismissed', error);
    });
  };

  return (
    <Card
      role='dialog'
      aria-labelledby='github-star-card-title'
      className='fixed right-4 bottom-4 z-50 w-[calc(100vw-2rem)] max-w-sm gap-3 py-4 shadow-lg'
    >
      <CardContent className='relative flex items-start gap-3 pr-8'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          onClick={handleDismiss}
          aria-label={t('dismiss')}
          className='text-muted-foreground hover:text-foreground absolute top-0 right-0 h-7 w-7'
        >
          <X className='h-4 w-4' />
        </Button>

        <div className='bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md'>
          <Github className='h-5 w-5' />
        </div>
        <div className='min-w-0 flex-1 space-y-1'>
          <CardTitle id='github-star-card-title' className='text-sm'>
            {t('title')}
          </CardTitle>
          <CardDescription className='text-xs leading-snug'>{t('description')}</CardDescription>
          <div className='pt-2'>
            <Button asChild size='sm' onClick={handleStar}>
              <Link href={REPO_URL} target='_blank' rel='noopener noreferrer'>
                <Github className='h-4 w-4' />
                {t('action')}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
