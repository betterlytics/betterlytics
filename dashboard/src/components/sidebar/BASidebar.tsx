import {
  LayoutDashboard,
  FileText,
  Smartphone,
  CircleDot,
  Globe,
  Link2,
  Funnel,
  DollarSign,
  Route,
  ExternalLink as ExternalLinkIcon,
  Gauge,
  Video,
  Activity,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import SettingsButton from '../SettingsButton';
import { IntegrationButton } from '@/components/integration/IntegrationButton';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { Suspense } from 'react';
import type { ReactElement } from 'react';
import { getAllUserDashboardsAction, getCurrentDashboardAction } from '@/app/actions/dashboard/dashboard.action';
import type { ServerActionResponse } from '@/middlewares/serverActionHandler';
import { DashboardDropdown } from './DashboardDropdown';

import { getTranslations } from 'next-intl/server';
import { ActiveUsersLabel } from './ActiveUsersLabel';
import { Badge } from '../ui/badge';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { Dashboard } from '@/entities/dashboard/dashboard.entities';
import { QuickStartButton } from '@/components/quickStart';

const ICON_SIZE = 16;

type BASidebarProps = {
  dashboardId: string;
  isDemo: boolean;
};

type SidebarItem = {
  name: string;
  key: string;
  href: string;
  icon: ReactElement;
  hidden?: boolean;
  hideOnMobile?: boolean;
};

export default async function BASidebar({ dashboardId, isDemo }: BASidebarProps) {
  const currentDashboardPromise: Promise<Dashboard> = isDemo
    ? Promise.resolve({
        id: dashboardId,
        siteId: 'demo',
        domain: 'Demo Dashboard',
      })
    : getCurrentDashboardAction(dashboardId);

  const allDashboardsPromise: Promise<ServerActionResponse<Dashboard[]>> = !isDemo
    ? getAllUserDashboardsAction()
    : currentDashboardPromise.then((d) => ({ success: true, data: [d] }));

  const t = await getTranslations('dashboard.sidebar');

  const analyticsItems: SidebarItem[] = [
    { name: t('overview'), key: 'overview', href: '', icon: <LayoutDashboard size={ICON_SIZE} /> },
    { name: t('pages'), key: 'pages', href: '/pages', icon: <FileText size={ICON_SIZE} /> },
    { name: t('referrers'), key: 'referrers', href: '/referrers', icon: <Link2 size={ICON_SIZE} /> },
    {
      name: t('outboundLinks'),
      key: 'outboundLinks',
      href: '/outbound-links',
      icon: <ExternalLinkIcon size={ICON_SIZE} />,
    },
    { name: t('geography'), key: 'geography', href: '/geography', icon: <Globe size={ICON_SIZE} /> },
    { name: t('devices'), key: 'devices', href: '/devices', icon: <Smartphone size={ICON_SIZE} /> },
    {
      name: t('campaigns'),
      key: 'campaigns',
      href: '/campaign',
      icon: <DollarSign size={ICON_SIZE} />,
      hidden: isDemo,
    },
  ];

  const behaviorItems: SidebarItem[] = [
    { name: t('userJourney'), key: 'userJourney', href: '/user-journey', icon: <Route size={ICON_SIZE} /> },
    { name: t('funnels'), key: 'funnels', href: '/funnels', icon: <Funnel size={ICON_SIZE} /> },
    { name: t('events'), key: 'events', href: '/events', icon: <CircleDot size={ICON_SIZE} /> },
    {
      name: t('sessionReplay'),
      key: 'sessionReplay',
      href: '/replay',
      icon: <Video size={ICON_SIZE} />,
      hidden: !isFeatureEnabled('enableSessionReplay') || isDemo,
      hideOnMobile: true,
    },
  ];

  const observabilityItems: SidebarItem[] = [
    { name: t('webVitals'), key: 'webVitals', href: '/web-vitals', icon: <Gauge size={ICON_SIZE} /> },
    {
      name: t('monitoring'),
      key: 'monitoring',
      href: '/monitoring',
      icon: <Activity size={ICON_SIZE} />,
      hidden: !isFeatureEnabled('enableUptimeMonitoring'),
    },
  ];

  return (
    <Sidebar
      variant='sidebar'
      collapsible='icon'
      className='top-0 h-screen border-t md:top-14 md:h-[calc(100vh-3.5rem)]'
    >
      <SidebarHeader className='bg-sidebar rounded-t-xl pt-2'></SidebarHeader>
      <SidebarContent className='bg-sidebar overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupContent className='overflow-hidden'>
            <Suspense fallback={<div className='bg-muted h-6 animate-pulse rounded' />}>
              <DashboardDropdown
                currentDashboardPromise={currentDashboardPromise}
                allDashboardsPromise={allDashboardsPromise}
              />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className='mx-0' />

        <SidebarGroup>
          <SidebarGroupContent>
            <Suspense fallback={null}>
              <ActiveUsersLabel />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('categories.analytics')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {analyticsItems
                .filter((item) => !item.hidden)
                .map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild>
                      <FilterPreservingLink href={item.href} highlightOnPage>
                        <span className='dark:text-muted-foreground/90'>{item.icon}</span>
                        <span>{item.name}</span>
                      </FilterPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('categories.behavior')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {behaviorItems
                .filter((item) => !item.hidden)
                .map((item) => (
                  <SidebarMenuItem
                    key={item.key}
                    className={item.hideOnMobile ? 'hidden md:list-item' : undefined}
                  >
                    <SidebarMenuButton asChild>
                      <FilterPreservingLink
                        href={item.href}
                        highlightOnPage
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-2'>
                          <span className='dark:text-muted-foreground/90'>{item.icon}</span>
                          <span>{item.name}</span>
                        </div>

                        {item.key === 'sessionReplay' && <Badge variant='outline'>Beta</Badge>}
                      </FilterPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('categories.observability')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {observabilityItems
                .filter((item) => !item.hidden)
                .map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton asChild>
                      <FilterPreservingLink
                        href={item.href}
                        highlightOnPage
                        className='flex items-center justify-between'
                      >
                        <div className='flex items-center gap-2'>
                          <span className='dark:text-muted-foreground/90'>{item.icon}</span>
                          <span>{item.name}</span>
                        </div>

                        {item.key === 'monitoring' && <Badge variant='outline'>Beta</Badge>}
                      </FilterPreservingLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!isDemo && (
          <SidebarMenu className='gap-2'>
            <QuickStartButton />
            <IntegrationButton />
            <SettingsButton />
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
