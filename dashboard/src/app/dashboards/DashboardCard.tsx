'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { startTransition, useState } from 'react';
import { toast } from 'sonner';
import { deleteDashboardAction } from '@/app/actions/dashboard';
import { Dashboard } from '@/entities/dashboard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Calendar, ExternalLink, Globe, Settings, Trash2 } from 'lucide-react';

interface DashboardCardProps {
  dashboard: Dashboard;
}

export default function DashboardCard({ dashboard }: DashboardCardProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formattedDate = dashboard.createdAt
    ? new Date(dashboard.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown';

  const handleCardClick = () => {
    router.push(`/dashboard/${dashboard.id}`);
  };

  const handleDeleteDashboard = async () => {
    startTransition(async () => {
      try {
        await deleteDashboardAction(dashboard.id);
        toast.success('Dashboard deleted successfully');
        router.refresh();
      } catch (error) {
        console.error('Failed to delete dashboard:', error);
        toast.error('Failed to delete dashboard. Please try again.');
      }
    });
  };

  return (
    <Card className='group hover:border-primary/30 border-border/50 h-full cursor-pointer transition-all duration-200 hover:shadow-lg'>
      <div className='block h-full' onClick={handleCardClick}>
        <CardHeader className='pb-4'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 group-hover:bg-primary/20 rounded-lg p-2 transition-colors'>
                <Globe className='text-primary h-5 w-5' />
              </div>
              <div className='min-w-0 flex-1'>
                <CardTitle className='group-hover:text-primary truncate text-lg font-semibold transition-colors'>
                  {dashboard.domain}
                </CardTitle>
                <p className='text-muted-foreground mt-1 text-sm'>{dashboard.siteId}</p>
              </div>
            </div>
            <div className='flex w-8 justify-center'>
              <ExternalLink className='text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100' />
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex w-9 justify-center'>
                <Calendar className='text-muted-foreground h-3 w-3' />
              </div>
              <span className='text-muted-foreground text-xs'>Created {formattedDate}</span>
            </div>
            <div className='flex justify-center' onClick={(e) => e.stopPropagation()}>
              <Link
                href={`/dashboard/${dashboard.id}/settings`}
                className='hover:bg-muted inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md p-0 transition-colors'
                title='Dashboard Settings'
              >
                <Settings className='text-muted-foreground h-4 w-4' />
              </Link>
              <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant='link'
                    className='hover:bg-destructive/10 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md p-0 transition-colors'
                    title='Delete Dashboard'
                  >
                    <Trash2 className='text-destructive h-4 w-4' />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className='flex items-center gap-2'>
                      <AlertTriangle className='text-destructive h-5 w-5' />
                      Delete Dashboard
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{dashboard.domain}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteDashboard}
                      className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete Dashboard
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
