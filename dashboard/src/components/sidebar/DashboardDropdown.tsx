'use client';

import { useState, use } from 'react';
import { useBARouter } from '@/hooks/use-ba-router';
import { ChevronDown, Globe, List } from 'lucide-react';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { Dashboard } from '@/entities/dashboard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ServerActionResponse } from '@/middlewares/serverActionHandler';

interface DashboardDropdownProps {
  currentDashboardPromise: Promise<Dashboard>;
  allDashboardsPromise: Promise<ServerActionResponse<Dashboard[]>>;
}

export function DashboardDropdown({ currentDashboardPromise, allDashboardsPromise }: DashboardDropdownProps) {
  const dashboardId = useDashboardId();
  const router = useBARouter();
  const [isOpen, setIsOpen] = useState(false);

  const currentDashboard = use(currentDashboardPromise);
  const allDashboards = use(allDashboardsPromise);

  const handleDashboardSwitch = (newDashboardId: string) => {
    setIsOpen(false);
    router.push(`/dashboard/${newDashboardId}`);
  };

  const allDashboardsList = allDashboards.success ? allDashboards.data : [];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='h-auto w-full min-w-0 justify-between border px-2.5 py-1.5 text-sm font-medium'
        >
          <div className='flex min-w-0 flex-1 items-center gap-2 overflow-hidden'>
            <Globe className='text-muted-foreground h-4 w-4 flex-shrink-0' />{' '}
            {/* TODO: Add the domains' favicons */}
            <span className='truncate text-left'>{currentDashboard.domain}</span>
          </div>
          <ChevronDown className='text-muted-foreground h-3 w-3 flex-shrink-0' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='start' className='w-56'>
        <div className='px-2 py-1.5'>
          <p className='text-muted-foreground text-xs font-medium'>Switch Dashboard</p>
        </div>
        <DropdownMenuSeparator />

        {allDashboardsList.map((dashboard) => (
          <DropdownMenuItem
            key={dashboard.id}
            onClick={() => handleDashboardSwitch(dashboard.id)}
            className={`focus:text-foreground cursor-pointer ${
              dashboard.id === dashboardId ? 'bg-secondary' : ''
            }`}
          >
            <div className='flex w-full items-center gap-2'>
              <Globe className='text-muted-foreground h-4 w-4' />
              <span className='flex-1 truncate'>{dashboard.domain}</span>
              {dashboard.id === dashboardId && <div className='bg-primary h-2 w-2 flex-shrink-0 rounded-full' />}
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push('/dashboards')} className='cursor-pointer'>
          <div className='flex w-full items-center gap-2'>
            <List className='text-muted-foreground h-4 w-4' />
            <span>View all Dashboards</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
