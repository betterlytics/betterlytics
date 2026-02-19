import { Fragment } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLocale, getTranslations } from 'next-intl/server';

type JourneyVariant = 'entry' | 'core' | 'primary' | 'secondary';
type PathVariant = Extract<JourneyVariant, 'primary' | 'secondary'>;

type JourneyStep = {
  name: string;
  users: number;
};

const variantStyles: Record<JourneyVariant, { ring: string; halo: string; text: string; shadow: string }> = {
  entry: {
    ring: 'ring-sky-400/55 dark:ring-sky-500/45',
    halo: 'from-sky-100/95 via-sky-100/40 to-sky-300/45 dark:from-sky-500/35 dark:via-sky-500/10',
    text: 'text-sky-700 dark:text-sky-200',
    shadow:
      'shadow-[0_18px_38px_-22px_rgba(14,165,233,0.55)] dark:shadow-[0_24px_46px_-28px_rgba(14,165,233,0.45)]',
  },
  core: {
    ring: 'ring-indigo-400/55 dark:ring-indigo-400/45',
    halo: 'from-indigo-100/95 via-indigo-100/40 to-indigo-300/45 dark:from-indigo-500/30 dark:via-indigo-500/10',
    text: 'text-indigo-700 dark:text-indigo-200',
    shadow:
      'shadow-[0_18px_38px_-22px_rgba(79,70,229,0.55)] dark:shadow-[0_24px_46px_-28px_rgba(99,102,241,0.45)]',
  },
  primary: {
    ring: 'ring-emerald-400/60 dark:ring-emerald-400/45',
    halo: 'from-emerald-100/95 via-emerald-100/40 to-emerald-300/45 dark:from-emerald-500/30 dark:via-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-200',
    shadow:
      'shadow-[0_18px_38px_-22px_rgba(16,185,129,0.55)] dark:shadow-[0_24px_46px_-28px_rgba(16,185,129,0.45)]',
  },
  secondary: {
    ring: 'ring-violet-400/60 dark:ring-violet-500/45',
    halo: 'from-violet-100/95 via-violet-100/40 to-violet-300/45 dark:from-violet-500/30 dark:via-violet-500/10',
    text: 'text-violet-700 dark:text-violet-200',
    shadow:
      'shadow-[0_18px_38px_-22px_rgba(139,92,246,0.55)] dark:shadow-[0_24px_46px_-28px_rgba(139,92,246,0.45)]',
  },
};

const connectorStyles: Record<PathVariant, string> = {
  primary:
    'from-emerald-400/85 via-emerald-400/50 to-emerald-400/10 dark:from-emerald-400/70 dark:via-emerald-400/40',
  secondary:
    'from-violet-400/85 via-violet-400/50 to-violet-400/10 dark:from-violet-400/70 dark:via-violet-400/40',
};

const lightModeHighlightOverlay =
  'bg-[radial-gradient(circle_at_32%_30%,rgba(255,255,255,0.92),rgba(255,255,255,0.15)_55%,rgba(255,255,255,0)_100%)]';

export default async function UserJourneyCard() {
  const locale = await getLocale();
  const t = await getTranslations('public.landing.cards.journeys');
  const journeyData = {
    start: { name: 'Landing Page', users: 1000 },
    middle: { name: 'Product Page', users: 650 },
    pathA: [
      { name: 'Add to Cart', users: 320 },
      { name: 'Checkout', users: 180 },
    ],
    pathB: [
      { name: 'Search', users: 330 },
      { name: 'Compare', users: 120 },
    ],
  } as const;

  return (
    <Card className='bg-card/70 border-border/70 dark:border-border/60 before:via-primary/40 before:content-["" overflow-hidden border shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent supports-[backdrop-filter]:backdrop-blur-[2px]'>
      <CardHeader className='pb-3 md:pb-1'>
        <CardTitle className='text-xl'>{t('title')}</CardTitle>
        <CardDescription className='text-base'>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className='pt-0'>
        <div className='relative flex items-center justify-center sm:mt-5 sm:min-h-[12.5rem]'>
          <div className='flex h-full w-full max-w-3xl flex-col items-center gap-1.5 md:gap-[0.75rem]'>
            <JourneyNode variant='entry' name={journeyData.start.name} users={journeyData.start.users} locale={locale} />
            <VerticalConnector />
            <JourneyNode variant='core' name={journeyData.middle.name} users={journeyData.middle.users} locale={locale} />
            <BranchConnector />
            <div className='grid w-full grid-cols-2 gap-2 md:gap-3.5'>
              <PathColumn steps={journeyData.pathA} variant='primary' locale={locale} />
              <PathColumn steps={journeyData.pathB} variant='secondary' locale={locale} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function JourneyNode({ name, users, variant, locale }: { name: string; users: number; variant: JourneyVariant; locale: string }) {
  const { ring, halo, text, shadow } = variantStyles[variant];

  return (
    <div className='flex flex-col items-center text-center'>
      <div
        className={`relative flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-offset-[3px] ring-offset-white backdrop-blur-sm dark:ring-offset-slate-900 ${ring} ${shadow}`}
      >
        <div className={`absolute inset-0 rounded-full bg-gradient-to-b ${halo}`} />
        <span
          aria-hidden='true'
          className={`absolute inset-[1px] rounded-full ${lightModeHighlightOverlay} opacity-90 mix-blend-screen dark:hidden`}
        />
        <span className={`relative text-[10px] font-semibold tracking-tight ${text}`}>{users.toLocaleString(locale)}</span>
      </div>
      <span className='mt-1 text-[10.5px] font-medium text-slate-800 dark:text-slate-100'>{name}</span>
    </div>
  );
}

function VerticalConnector() {
  return (
    <StepConnector
      gradientClass='from-sky-300 via-sky-300/80 to-transparent dark:from-slate-700 dark:via-slate-600/80'
      heightClass='h-6 md:h-6'
    />
  );
}

function BranchConnector() {
  return (
    <div className='relative -mb-1 flex w-full flex-col items-center justify-center md:-mb-2 md:py-0.5'>
      <svg
        viewBox='0 0 120 42'
        className='h-9 w-full max-w-[16rem] md:max-w-none'
        preserveAspectRatio='none'
        aria-hidden='true'
      >
        <defs>
          <style>
            {`
              #branchVertical {
                stroke: rgb(125, 211, 252);
              }
              .dark #branchVertical {
                stroke: rgb(96, 114, 140);
              }
            `}
          </style>
          <linearGradient id='branchEmerald' x1='0' y1='0' x2='0' y2='80' gradientUnits='userSpaceOnUse'>
            <stop offset='0%' stopColor='rgb(16, 185, 129)' stopOpacity='0.85' />
            <stop offset='100%' stopColor='rgb(16, 185, 129)' stopOpacity='0.25' />
          </linearGradient>
          <linearGradient id='branchViolet' x1='0' y1='0' x2='0' y2='80' gradientUnits='userSpaceOnUse'>
            <stop offset='0%' stopColor='rgb(139, 92, 246)' stopOpacity='0.85' />
            <stop offset='100%' stopColor='rgb(139, 92, 246)' stopOpacity='0.25' />
          </linearGradient>
        </defs>

        <g strokeWidth='0.8' fill='none' strokeLinecap='round'>
          <path id='branchVertical' d='M60 0 L60 16' />
        </g>
        <g strokeWidth='1.6' fill='none' strokeLinecap='round'>
          <path d='M60 16 C60 28 34 30 34 42' stroke='url(#branchEmerald)' />
          <path d='M60 16 C60 28 86 30 86 42' stroke='url(#branchViolet)' />
        </g>
      </svg>
    </div>
  );
}

function PathColumn({ steps, variant, locale }: { steps: ReadonlyArray<JourneyStep>; variant: PathVariant; locale: string }) {
  const gradientClass = connectorStyles[variant];

  return (
    <div className='relative flex flex-col items-center gap-1.5 text-center'>
      {steps.map((step, index) => (
        <Fragment key={step.name}>
          <JourneyNode variant={variant} name={step.name} users={step.users} locale={locale} />
          {index < steps.length - 1 ? (
            <StepConnector gradientClass={gradientClass} heightClass='h-5 md:h-7' className='-my-1' />
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}

function StepConnector({
  gradientClass,
  heightClass = 'h-5',
  className = '',
}: {
  gradientClass: string;
  heightClass?: string;
  className?: string;
}) {
  return (
    <div className={`relative flex flex-shrink-0 ${heightClass} items-center justify-center ${className}`}>
      <span
        className={`absolute h-full w-[3px] rounded-full bg-gradient-to-b ${gradientClass} opacity-40 blur-[3px]`}
      />
      <span className={`relative block h-full w-[1.5px] rounded-full bg-gradient-to-b ${gradientClass}`} />
    </div>
  );
}
