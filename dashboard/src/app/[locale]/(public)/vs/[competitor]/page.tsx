import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import {
  Check,
  ChevronRight,
  Shield,
  Zap,
  Target,
  Sparkles,
  DollarSign,
  Rocket,
  Eye,
  Layers,
  Server,
  Clock,
  Lock,
  Gauge,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComparisonTable } from '@/components/public/comparison-table';
import Logo from '@/components/logo';
import { CtaStrip } from '@/components/public/ctaStrip';
import { getCompetitorData, getCompetitorSlugs, SUPPORTED_LOCALES, type ComparisonLocaleContent } from './config';
import { generateSEO } from '@/lib/seo';

export async function generateStaticParams() {
  const competitors = getCompetitorSlugs();

  return SUPPORTED_LOCALES.flatMap((locale) =>
    competitors.map((competitor) => ({
      locale,
      competitor,
    })),
  );
}

interface PageProps {
  params: Promise<{ competitor: string; locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { competitor, locale } = await params;
  const data = getCompetitorData(competitor, locale);

  if (!data || !data.seo) {
    return {};
  }

  return generateSEO(
    {
      title: data.seo.title,
      description: data.seo.description,
      keywords: data.seo.keywords,
      path: `/vs/${competitor}`,
      structuredDataType: 'webpage',
    },
    { locale },
  );
}

const ICON_MAP: Record<ComparisonLocaleContent['detailedComparison'][number]['icon'], LucideIcon> = {
  shield: Shield,
  zap: Zap,
  target: Target,
  sparkles: Sparkles,
  dollar: DollarSign,
  rocket: Rocket,
  eye: Eye,
  layers: Layers,
  server: Server,
  clock: Clock,
  lock: Lock,
  gauge: Gauge,
};

function HighlightedTitle({ title, highlight }: { title: string; highlight?: string }) {
  if (!highlight) return <>{title}</>;

  const parts = title.split(highlight);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <span className='text-blue-600 dark:text-blue-400'>{highlight}</span>}
        </span>
      ))}
    </>
  );
}

function VsBadge({ competitorName }: { competitorName: string }) {
  return (
    <div className='border-border/40 bg-card/50 mb-10 inline-flex items-center gap-3 rounded-full border px-5 py-2.5 shadow-sm backdrop-blur-sm'>
      <span className='text-foreground text-base font-medium'>Betterlytics</span>
      <span className='relative flex h-6 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-zinc-500 to-zinc-700 px-2.5 text-[10px] font-bold tracking-wider text-white uppercase shadow-inner ring-1 ring-white/10 dark:from-zinc-600 dark:to-zinc-800'>
        <span className='relative z-10'>vs</span>
      </span>
      <span className='text-foreground text-base font-medium'>{competitorName}</span>
    </div>
  );
}

function HeroSection({
  data,
  getStartedText,
  viewPricingText,
}: {
  data: NonNullable<ReturnType<typeof getCompetitorData>>;
  getStartedText: string;
  viewPricingText: string;
}) {
  return (
    <section className='mb-16 pt-8 text-center'>
      <VsBadge competitorName={data.name} />

      <h1 className='mb-8 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl'>
        <HighlightedTitle title={data.hero.title} highlight={data.hero.titleHighlight} />
      </h1>
      <p className='text-muted-foreground mx-auto mb-10 max-w-3xl text-lg leading-relaxed'>{data.hero.subtitle}</p>

      <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
        <Button
          size='lg'
          className='from-primary to-primary/90 bg-gradient-to-r px-8 py-3 text-base font-medium text-white shadow-md transition-all duration-200 hover:shadow-lg'
          asChild
        >
          <Link href='/register' className='flex items-center gap-2'>
            {getStartedText}
            <ChevronRight className='h-4 w-4' />
          </Link>
        </Button>
        <Button
          size='lg'
          variant='outline'
          className='border-border bg-background hover:bg-muted px-8 py-3 text-base font-medium transition-all duration-200'
          asChild
        >
          <Link href='/pricing' className='flex items-center gap-2'>
            {viewPricingText}
            <ChevronRight className='h-4 w-4' />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function DifferentiatorCard({
  item,
  competitorName,
}: {
  item: NonNullable<ReturnType<typeof getCompetitorData>>['keyDifferentiators'][number];
  competitorName: string;
}) {
  return (
    <div>
      <div className='mb-2 flex items-start gap-2'>
        <Check className='mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400' strokeWidth={2.5} />
        <h3 className='font-semibold'>{item.title}</h3>
      </div>
      <p className='text-muted-foreground pl-7 text-sm leading-relaxed'>{item.betterlytics}</p>
      <p className='text-muted-foreground/60 mt-2 pl-7 text-xs leading-relaxed italic'>
        {competitorName}: {item.competitor}
      </p>
    </div>
  );
}

function TimelineItem({
  section,
  isLast,
}: {
  section: NonNullable<ReturnType<typeof getCompetitorData>>['detailedComparison'][number];
  isLast: boolean;
}) {
  const Icon = ICON_MAP[section.icon];

  return (
    <div className='relative'>
      <div className='relative flex gap-6 py-10 sm:gap-10'>
        <div className='relative z-10 flex shrink-0'>
          <div className='bg-background border-border flex h-14 w-14 items-center justify-center rounded-xl border sm:h-16 sm:w-16'>
            <Icon className='text-foreground/70 h-6 w-6 sm:h-7 sm:w-7' strokeWidth={1.5} />
          </div>
        </div>

        <div className='flex-1 pt-1'>
          <h3 className='mb-4 text-xl font-semibold tracking-tight'>{section.title}</h3>
          <div className='text-muted-foreground max-w-2xl space-y-4 leading-relaxed'>
            {section.content.split('\n\n').map((paragraph, pIdx) => (
              <p key={pIdx} className='text-[15px]'>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      {!isLast && <div className='border-border/30 ml-7 border-t sm:ml-8' />}
    </div>
  );
}

export default async function ComparisonPage({ params }: PageProps) {
  const { competitor, locale } = await params;
  const data = getCompetitorData(competitor, locale);
  const t = await getTranslations('public.comparison');

  if (!data) {
    return notFound();
  }

  return (
    <div className='relative isolate overflow-x-clip'>
      <div
        className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.08),transparent)]'
        aria-hidden
      />

      <div className='container mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8'>
        <HeroSection data={data} getStartedText={t('getStartedFree')} viewPricingText={t('viewPricing')} />

        <div className='mt-20 mb-24 grid gap-8 sm:grid-cols-3 sm:gap-10'>
          {data.keyDifferentiators.map((item, idx) => (
            <DifferentiatorCard key={idx} item={item} competitorName={data.name} />
          ))}
        </div>

        <div className='mb-24'>
          <div className='mb-8 text-center'>
            <h2 className='mb-3 text-2xl font-bold sm:text-3xl'>{t('featureComparison.title')}</h2>
            <p className='text-muted-foreground'>{t('featureComparison.subtitle', { competitor: data.name })}</p>
          </div>

          <ComparisonTable
            categories={data.comparison.categories.map((cat) => ({
              name: cat.name,
              features: cat.features.map((f) => ({
                name: f.name,
                values: [f.betterlytics, f.competitor],
              })),
            }))}
            columns={[
              {
                label: 'Betterlytics',
                logo: <Logo variant='icon' width={20} height={20} />,
              },
              {
                label: data.name,
                logo: data.logo ? (
                  <Image
                    src={data.logo}
                    alt={`${data.name} logo`}
                    width={20}
                    height={20}
                    className='object-contain'
                  />
                ) : null,
              },
            ]}
            disclaimer={t('disclaimer')}
          />
        </div>

        <div className='mb-24'>
          <div className='mb-16 text-center'>
            <h2 className='mb-3 text-2xl font-bold sm:text-3xl'>{t('whyBetterlytics.title')}</h2>
            <p className='text-muted-foreground mx-auto max-w-2xl'>{t('whyBetterlytics.subtitle')}</p>
          </div>

          <div className='mx-auto max-w-4xl'>
            <div className='relative'>
              <div className='border-border/50 absolute top-0 bottom-0 left-[1.75rem] hidden w-px border-l sm:left-8 sm:block' />

              <div className='space-y-0'>
                {data.detailedComparison.map((section, idx) => (
                  <TimelineItem key={idx} section={section} isLast={idx === data.detailedComparison.length - 1} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <CtaStrip
          eyebrow={data.cta?.eyebrow}
          title={data.cta?.title}
          subtitle={data.cta?.subtitle}
          buttonText={data.cta?.buttonText}
        />
      </div>
    </div>
  );
}
