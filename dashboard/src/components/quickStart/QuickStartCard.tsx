'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Check, Circle, X, ChevronRight, ChevronDown, Sparkles, Route, Users, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  QuickStartProgress,
  OnboardingGoalCategory,
  OnboardingGoalState,
  ONBOARDING_GOALS,
} from '@/entities/dashboard/quickStart.entities';
import { skipGoalAction, unskipGoalAction } from '@/app/actions/dashboard/quickStart.action';
import { useQuickStartOptional } from './QuickStartContext';

interface QuickStartCardProps {
  dashboardId: string;
  onOpenIntegration?: () => void;
}

const CATEGORY_ICONS: Record<OnboardingGoalCategory, React.ReactElement> = {
  get_started: <Sparkles className='h-4 w-4' />,
  analytics: <Route className='h-4 w-4' />,
  team: <Users className='h-4 w-4' />,
};

const GOAL_NAVIGATION: Record<string, string> = {
  install_script: '',
  first_pageview: '',
  create_funnel: '/funnels',
  create_saved_filter: '',
  invite_team_member: '/settings/members',
};

export function QuickStartCard({ dashboardId, onOpenIntegration }: QuickStartCardProps) {
  const t = useTranslations('components.quickStart');
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const quickStart = useQuickStartOptional();

  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  const [localProgress, setLocalProgress] = useState<QuickStartProgress | null>(null);

  useEffect(() => {
    if (quickStart?.progress) {
      setLocalProgress(quickStart.progress);
    }
  }, [quickStart?.progress]);

  if (!quickStart || !quickStart.isOpen || !localProgress) {
    return null;
  }

  const { setIsOpen, setProgress } = quickStart;
  const progress = localProgress;

  if (progress.percentage === 100) {
    return null;
  }

  const goalsByCategory = ONBOARDING_GOALS.reduce(
    (acc, goalDef) => {
      if (!acc[goalDef.category]) {
        acc[goalDef.category] = [];
      }
      const goalState = progress.goals.find((g) => g.id === goalDef.id);
      if (goalState) {
        acc[goalDef.category].push(goalState);
      }
      return acc;
    },
    {} as Record<OnboardingGoalCategory, OnboardingGoalState[]>,
  );

  const handleSkip = (goalId: string) => {
    startTransition(async () => {
      await skipGoalAction(dashboardId, goalId);
      const newProgress = {
        ...progress,
        goals: progress.goals.map((g) =>
          g.id === goalId ? { ...g, status: 'skipped' as const, skippedAt: new Date() } : g,
        ),
        completedCount: progress.completedCount + 1,
        percentage: Math.round(((progress.completedCount + 1) / progress.totalCount) * 100),
      };
      setLocalProgress(newProgress);
      setProgress(newProgress);
    });
  };

  const handleUnskip = (goalId: string) => {
    startTransition(async () => {
      await unskipGoalAction(dashboardId, goalId);
      const newProgress = {
        ...progress,
        goals: progress.goals.map((g) =>
          g.id === goalId ? { ...g, status: 'pending' as const, skippedAt: null } : g,
        ),
        completedCount: progress.completedCount - 1,
        percentage: Math.round(((progress.completedCount - 1) / progress.totalCount) * 100),
      };
      setLocalProgress(newProgress);
      setProgress(newProgress);
    });
  };

  const handleNavigate = (goalId: string) => {
    if (goalId === 'install_script' && onOpenIntegration) {
      setIsOpen(false);
      onOpenIntegration();
      return;
    }

    const target = GOAL_NAVIGATION[goalId];
    if (target) {
      const basePath = pathname.split('/').slice(0, 4).join('/');
      router.push(`${basePath}${target}`);
      setIsOpen(false);
    }
  };

  const categories: OnboardingGoalCategory[] = ['get_started', 'analytics', 'team'];

  return (
    <div className='fixed right-4 bottom-4 z-50'>
      <div
        className={cn(
          'bg-card border-border rounded-xl border shadow-lg transition-all duration-200',
          isExpanded ? 'w-80' : 'w-auto',
        )}
      >
        <div className='flex items-center gap-3 p-3'>
          <button onClick={() => setIsExpanded(!isExpanded)} className='flex flex-1 items-center gap-3'>
            <div className='relative h-10 w-10 flex-shrink-0'>
              <svg className='h-10 w-10 -rotate-90' viewBox='0 0 36 36'>
                <circle className='text-muted stroke-current' strokeWidth='3' fill='none' cx='18' cy='18' r='15' />
                <circle
                  className='text-primary stroke-current transition-all duration-300'
                  strokeWidth='3'
                  strokeLinecap='round'
                  fill='none'
                  cx='18'
                  cy='18'
                  r='15'
                  strokeDasharray={`${progress.percentage}, 100`}
                />
              </svg>
              <div className='absolute inset-0 flex items-center justify-center'>
                <Sparkles className='text-primary h-4 w-4' />
              </div>
            </div>

            <div className='flex-1 text-left'>
              <div className='text-sm font-medium'>{t('title')}</div>
              <div className='text-muted-foreground text-xs'>
                {progress.completedCount}/{progress.totalCount} {t('subtitle')}
              </div>
            </div>

            {isExpanded ? (
              <Minus className='text-muted-foreground h-4 w-4' />
            ) : (
              <ChevronDown className='text-muted-foreground h-4 w-4' />
            )}
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className='text-muted-foreground hover:text-foreground p-1 transition-colors'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        {isExpanded && (
          <div className='border-border border-t'>
            <div className='px-4 py-3'>
              <Progress value={progress.percentage} className='h-1.5' color='var(--primary)' />
            </div>

            <div className='max-h-80 overflow-y-auto px-2 pb-2'>
              {categories.map(
                (category) =>
                  goalsByCategory[category]?.length > 0 && (
                    <div key={category} className='mb-2'>
                      <div className='text-muted-foreground flex items-center gap-2 px-2 py-1.5 text-xs font-medium'>
                        {CATEGORY_ICONS[category]}
                        {t(`categories.${category}`)}
                      </div>
                      <div className='space-y-1'>
                        {goalsByCategory[category].map((goal) => (
                          <GoalItem
                            key={goal.id}
                            goal={goal}
                            isExpanded={expandedGoalId === goal.id}
                            onToggle={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}
                            onSkip={() => handleSkip(goal.id)}
                            onUnskip={() => handleUnskip(goal.id)}
                            onNavigate={() => handleNavigate(goal.id)}
                            t={t}
                          />
                        ))}
                      </div>
                    </div>
                  ),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GoalItem({
  goal,
  isExpanded,
  onToggle,
  onSkip,
  onUnskip,
  onNavigate,
  t,
}: {
  goal: OnboardingGoalState;
  isExpanded: boolean;
  onToggle: () => void;
  onSkip: () => void;
  onUnskip: () => void;
  onNavigate: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const isCompleted = goal.status === 'completed';
  const isSkipped = goal.status === 'skipped';
  const isPending = goal.status === 'pending';

  return (
    <div className='rounded-lg'>
      <button
        onClick={onToggle}
        className='hover:bg-muted/50 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors'
      >
        {isCompleted ? (
          <div className='bg-primary flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full'>
            <Check className='text-primary-foreground h-2.5 w-2.5' />
          </div>
        ) : isSkipped ? (
          <div className='bg-muted flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full'>
            <X className='text-muted-foreground h-2.5 w-2.5' />
          </div>
        ) : (
          <Circle className='text-muted-foreground h-4 w-4 flex-shrink-0' />
        )}

        <span
          className={cn(
            'flex-1 text-xs',
            isCompleted && 'text-muted-foreground line-through',
            isSkipped && 'text-muted-foreground',
          )}
        >
          {t(`goals.${goal.id}.title`)}
        </span>

        {isSkipped && (
          <button
            className='text-muted-foreground hover:text-foreground text-xs underline'
            onClick={(e) => {
              e.stopPropagation();
              onUnskip();
            }}
          >
            {t('goals.unskip')}
          </button>
        )}

        {isPending && (
          <ChevronRight
            className={cn('text-muted-foreground h-3 w-3 transition-transform', isExpanded && 'rotate-90')}
          />
        )}
      </button>

      {isExpanded && isPending && (
        <div className='bg-muted/30 mx-2 mb-1 rounded-lg px-2 py-2'>
          <p className='text-muted-foreground mb-2 text-xs'>{t(`goals.${goal.id}.description`)}</p>
          <div className='flex items-center gap-2'>
            <Button size='sm' className='h-6 text-xs' onClick={onNavigate}>
              {t(`goals.${goal.id}.cta`)}
            </Button>
            <Button variant='ghost' size='sm' className='text-muted-foreground h-6 text-xs' onClick={onSkip}>
              {t('goals.skip')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
