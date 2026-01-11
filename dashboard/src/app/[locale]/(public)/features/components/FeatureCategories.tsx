import { getTranslations } from 'next-intl/server';
import { FeatureCard } from './FeatureCard';
import {
  Activity,
  Filter,
  Video,
  GitBranch,
  TrendingUp,
  MousePointerClick,
  Target,
  ExternalLink,
  Gauge,
  MonitorCheck,
  ShieldCheck,
  Cookie,
  Scale,
  Server,
  UserX,
  Database,
  Users,
  KeyRound,
  LogIn,
  Mail,
  Zap,
  Headphones,
  FileCheck,
  Eye,
  TrendingDown,
  ArrowRightLeft,
  Globe,
  Smartphone,
  Languages,
  Link2,
  StickyNote,
  BarChart3,
  Github,
  Code,
  HardDrive,
  Cloud,
  Blocks,
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'coreAnalytics',
    features: [
      { id: 'pageViews', icon: Eye },
      { id: 'visitors', icon: Users },
      { id: 'bounceRate', icon: TrendingDown },
      { id: 'trafficSources', icon: ArrowRightLeft },
      { id: 'location', icon: Globe },
      { id: 'devices', icon: Smartphone },
      { id: 'languages', icon: Languages },
      { id: 'filtering', icon: Filter },
      { id: 'realtimeData', icon: Activity },
      { id: 'customEvents', icon: MousePointerClick },
      { id: 'utmTracking', icon: Target },
      { id: 'linkTracking', icon: Link2 },
    ],
  },
  {
    id: 'advancedAnalytics',
    features: [
      { id: 'sessionReplay', icon: Video },
      { id: 'userJourneys', icon: GitBranch },
      { id: 'funnels', icon: TrendingUp },
      { id: 'goals', icon: Target },
      { id: 'annotations', icon: StickyNote },
      { id: 'timePeriodComparison', icon: BarChart3 },
      { id: 'outboundLinks', icon: ExternalLink },
    ],
  },
  {
    id: 'performanceMonitoring',
    features: [
      { id: 'coreWebVitals', icon: Gauge },
      { id: 'uptimeMonitoring', icon: MonitorCheck },
      { id: 'sslMonitoring', icon: ShieldCheck },
    ],
  },
  {
    id: 'privacyData',
    features: [
      { id: 'cookieless', icon: Cookie },
      { id: 'gdprCcpa', icon: Scale },
      { id: 'euHosting', icon: Server },
      { id: 'anonymousByDefault', icon: UserX },
      { id: 'dataOwnership', icon: Database },
      { id: 'openSource', icon: Github },
    ],
  },
  {
    id: 'accessSecurity',
    features: [
      { id: 'memberRoles', icon: Users },
      { id: 'twoFactorAuth', icon: KeyRound },
      { id: 'oauthLogin', icon: LogIn },
    ],
  },
  {
    id: 'developerDeployment',
    features: [
      { id: 'simpleScriptTag', icon: Code },
      { id: 'frameworkSdks', icon: Blocks },
      { id: 'selfHosting', icon: HardDrive },
      { id: 'fullyManaged', icon: Cloud },
      { id: 'lightweightScript', icon: Zap },
      { id: 'highPerformance', icon: Gauge },
    ],
  },
  {
    id: 'support',
    features: [
      { id: 'emailSupport', icon: Mail },
      { id: 'prioritySupport', icon: Zap },
      { id: 'dedicatedSupport', icon: Headphones },
      { id: 'slaGuarantee', icon: FileCheck },
    ],
  },
] as const;

export async function FeatureCategories() {
  const t = await getTranslations('public.features');

  return (
    <section className='relative overflow-visible py-16 sm:py-24'>
      <div className='relative container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-6xl'>
          {CATEGORIES.map((category, index) => (
            <div key={category.id} className={index === 0 ? 'space-y-8' : 'mt-16 space-y-8 sm:mt-20'}>
              <div className='flex flex-col items-center gap-4 text-center'>
                <span className='border-border/60 bg-card/50 inline-flex items-center rounded-full border px-5 py-2 text-sm font-semibold tracking-wide backdrop-blur-sm'>
                  {t(`categories.${category.id}`)}
                </span>
              </div>

              <div className='grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {category.features.map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    icon={feature.icon}
                    title={t(`items.${feature.id}.title`)}
                    description={t(`items.${feature.id}.description`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
