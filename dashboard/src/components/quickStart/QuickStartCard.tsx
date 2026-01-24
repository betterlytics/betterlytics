'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Check, X, ChevronRight, Sparkles, Route, Users, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { CircularProgress } from '@/components/progress-08';
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
  get_started: <Sparkles className='h-3.5 w-3.5' />,
  analytics: <Route className='h-3.5 w-3.5' />,
  team: <Users className='h-3.5 w-3.5' />,
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
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    get_started: true,
    analytics: true,
    team: true,
  });
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

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const categories: OnboardingGoalCategory[] = ['get_started', 'analytics', 'team'];

  return (
    <div className='animate-in fade-in slide-in-from-bottom-2 fixed right-4 bottom-4 z-50 duration-200'>
      <Card className={cn('gap-0 py-0 shadow-lg', isExpanded ? 'w-[320px]' : 'w-auto')}>
        <CardHeader className='space-y-0 px-4 py-3'>
          <div className='flex items-center gap-2'>
            <CircularProgress
              value={progress.percentage}
              size={28}
              strokeWidth={2.5}
              showLabel
              renderLabel={() => progress.completedCount}
              labelClassName='text-[10px] font-bold'
            />
            <CardTitle className='flex-1 text-sm'>{t('title')}</CardTitle>
            <div className='flex items-center gap-0.5'>
              <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => setIsExpanded(!isExpanded)}>
                <Minus className='h-4 w-4' />
              </Button>
              <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => setIsOpen(false)}>
                <X className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className='mt-2 space-y-1'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-xs'>
                  {progress.completedCount}/{progress.totalCount} {t('subtitle')}
                </span>
                <span className='text-muted-foreground text-xs'>{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className='h-1.5' />
            </div>
          )}
        </CardHeader>

        {isExpanded && (
          <>
            <Separator />

            <div className='max-h-[320px] overflow-y-auto'>
              {categories.map(
                (category) =>
                  goalsByCategory[category]?.length > 0 && (
                    <CategorySection
                      key={category}
                      category={category}
                      goals={goalsByCategory[category]}
                      isOpen={expandedCategories[category]}
                      onToggle={() => toggleCategory(category)}
                      expandedGoalId={expandedGoalId}
                      onToggleGoal={(id) => setExpandedGoalId(expandedGoalId === id ? null : id)}
                      onSkip={handleSkip}
                      onUnskip={handleUnskip}
                      onNavigate={handleNavigate}
                      t={t}
                    />
                  ),
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function CategorySection({
  category,
  goals,
  isOpen,
  onToggle,
  expandedGoalId,
  onToggleGoal,
  onSkip,
  onUnskip,
  onNavigate,
  t,
}: {
  category: OnboardingGoalCategory;
  goals: OnboardingGoalState[];
  isOpen: boolean;
  onToggle: () => void;
  expandedGoalId: string | null;
  onToggleGoal: (id: string) => void;
  onSkip: (id: string) => void;
  onUnskip: (id: string) => void;
  onNavigate: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const completedCount = goals.filter((g) => g.status === 'completed' || g.status === 'skipped').length;

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger className='hover:bg-muted/50 flex w-full items-center gap-2 px-4 py-2 transition-colors'>
        <span className='text-muted-foreground'>{CATEGORY_ICONS[category]}</span>
        <span className='flex-1 text-left text-xs font-medium'>{t(`categories.${category}`)}</span>
        <span className='text-muted-foreground text-xs'>
          {completedCount}/{goals.length}
        </span>
        <ChevronRight
          className={cn('text-muted-foreground h-3.5 w-3.5 transition-transform', isOpen && 'rotate-90')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='px-2 pb-1'>
          {goals.map((goal) => (
            <GoalItem
              key={goal.id}
              goal={goal}
              isExpanded={expandedGoalId === goal.id}
              onToggle={() => onToggleGoal(goal.id)}
              onSkip={() => onSkip(goal.id)}
              onUnskip={() => onUnskip(goal.id)}
              onNavigate={() => onNavigate(goal.id)}
              t={t}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
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
    <div className={cn('rounded-md', isExpanded && isPending && 'bg-muted/50')}>
      <button
        onClick={onToggle}
        className='hover:bg-muted/50 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors'
      >
        {isCompleted ? (
          <div className='bg-primary/20 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full'>
            <Check className='text-primary h-2.5 w-2.5' />
          </div>
        ) : isSkipped ? (
          <div className='bg-muted flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full'>
            <X className='text-muted-foreground h-2.5 w-2.5' />
          </div>
        ) : (
          <div className='border-muted-foreground/40 h-4 w-4 flex-shrink-0 rounded-full border-[1.5px]' />
        )}

        <span className={cn('flex-1 text-sm', (isCompleted || isSkipped) && 'text-muted-foreground line-through')}>
          {t(`goals.${goal.id}.title`)}
        </span>

        {isSkipped && (
          <Button
            variant='link'
            size='sm'
            className='text-muted-foreground h-auto p-0 text-xs'
            onClick={(e) => {
              e.stopPropagation();
              onUnskip();
            }}
          >
            {t('goals.unskip')}
          </Button>
        )}
      </button>

      {isExpanded && isPending && (
        <div className='px-2 pb-2'>
          <div className='ml-[22px]'>
            <p className='text-muted-foreground mb-2 text-xs'>{t(`goals.${goal.id}.description`)}</p>
            <div className='flex items-center gap-2'>
              <Button size='sm' className='h-7 text-xs' onClick={onNavigate}>
                {t(`goals.${goal.id}.cta`)}
              </Button>
              <Button variant='ghost' size='sm' className='text-muted-foreground h-7 text-xs' onClick={onSkip}>
                {t('goals.skip')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
