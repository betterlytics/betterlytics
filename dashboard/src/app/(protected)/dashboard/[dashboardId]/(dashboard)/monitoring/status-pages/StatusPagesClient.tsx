'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ChevronRight, Copy, ExternalLink, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { createDraftStatusPageAction, deleteStatusPageAction } from '@/app/actions/analytics/statusPage.actions';
import type { StatusPageListItem } from '@/entities/analytics/statusPage.entities';
import { StatusPagesEmptyState } from './StatusPagesEmptyState';

function accentForeground(accentHex: string): string {
  const channel = (offset: number) => {
    const c = parseInt(accentHex.slice(offset, offset + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.45 ? '#16181c' : '#ffffff';
}

function PageBrandChip({ page }: { page: StatusPageListItem }) {
  return (
    <span className='relative flex-none'>
      {page.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- owner-provided logo (arbitrary origin / data URI), not optimizable via next/image
        <img src={page.logoUrl} alt='' className='border-border h-10 w-10 rounded-lg border object-contain' />
      ) : (
        <span
          className='flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold'
          style={{ backgroundColor: page.accentColor, color: accentForeground(page.accentColor) }}
        >
          {page.name.charAt(0).toUpperCase()}
        </span>
      )}
      <span
        aria-hidden
        className={`border-background absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full border-2 ${
          page.isPublished ? 'bg-emerald-500' : 'bg-muted-foreground/60'
        }`}
      />
    </span>
  );
}

type StatusPagesClientProps = {
  dashboardId: string;
  statusPages: StatusPageListItem[];
  publicBaseUrl: string;
};

export function StatusPagesClient({ dashboardId, statusPages, publicBaseUrl }: StatusPagesClientProps) {
  const t = useTranslations('statusPagesPage');
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: async () => createDraftStatusPageAction(dashboardId),
    onSuccess: (created) => {
      router.push(`/dashboard/${dashboardId}/monitoring/status-pages/${created.id}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('error'));
    },
  });

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${publicBaseUrl}/status/${slug}`);
    toast.success(t('actions.linkCopied'));
  };

  const [deleteTarget, setDeleteTarget] = useState<StatusPageListItem | null>(null);
  const deleteMutation = useMutation({
    mutationFn: async (statusPageId: string) => deleteStatusPageAction(dashboardId, statusPageId),
    onSuccess: () => {
      toast.success(t('editor.deleted'));
      setDeleteTarget(null);
      router.refresh();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const publicHost = publicBaseUrl.replace(/^https?:\/\//, '');

  const createButton = (label: string) => (
    <PermissionGate>
      {(disabled) => (
        <Button
          disabled={disabled || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className='cursor-pointer'
        >
          <Plus className='mr-1 h-4 w-4' />
          {label}
        </Button>
      )}
    </PermissionGate>
  );

  if (statusPages.length === 0) {
    return <StatusPagesEmptyState createButton={createButton(t('empty.cta'))} />;
  }

  return (
    <div className='space-y-4'>
      <DashboardHeader title={t('title')}>{createButton(t('newStatusPage'))}</DashboardHeader>

      <div className='bg-card border-border overflow-hidden rounded-xl border'>
          {statusPages.map((page) => (
            <div
              key={page.id}
              className='border-border hover:bg-muted/40 relative flex flex-col gap-3 border-b px-4 py-4 transition-colors last:border-b-0 sm:flex-row sm:items-center sm:gap-4 sm:px-5'
            >
              <div className='flex min-w-0 flex-1 items-center gap-3.5'>
                <PageBrandChip page={page} />
                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    {/* Stretched link: the whole row opens the editor */}
                    <Link
                      href={`/dashboard/${dashboardId}/monitoring/status-pages/${page.id}`}
                      className='truncate font-semibold after:absolute after:inset-0'
                    >
                      {page.name}
                    </Link>
                    <Badge variant={page.isPublished ? 'default' : 'secondary'} className='flex-none'>
                      {page.isPublished ? t('badge.public') : t('badge.draft')}
                    </Badge>
                  </div>
                  <div className='text-muted-foreground mt-0.5 truncate text-sm'>
                    {`${publicHost}/status/${page.slug}`}
                    {' · '}
                    {t('monitorCount', { count: page.monitorCount })}
                  </div>
                </div>
              </div>
              <div className='flex flex-none items-center gap-1 self-end sm:self-auto'>
                {page.isPublished ? (
                  <div className='relative z-10 flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-muted-foreground hover:text-foreground cursor-pointer'
                      onClick={() => copyLink(page.slug)}
                    >
                      <Copy className='mr-1 h-3.5 w-3.5' />
                      {t('actions.copyLink')}
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-muted-foreground hover:text-foreground'
                      asChild
                    >
                      <a href={`${publicBaseUrl}/status/${page.slug}`} target='_blank' rel='noopener noreferrer'>
                        <ExternalLink className='mr-1 h-3.5 w-3.5' />
                        {t('actions.viewPage')}
                      </a>
                    </Button>
                  </div>
                ) : (
                  <span className='text-muted-foreground px-2 text-xs'>{t('finishSetup')}</span>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-muted-foreground hover:text-foreground relative z-10 h-8 w-8 cursor-pointer p-0'
                      aria-label={t('actions.more')}
                    >
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <PermissionGate>
                      {(disabled) => (
                        <DropdownMenuItem
                          disabled={disabled}
                          onSelect={() => setDeleteTarget(page)}
                          className='text-destructive focus:text-destructive cursor-pointer'
                        >
                          <Trash2 className='text-destructive mr-1 h-3.5 w-3.5' />
                          {t('editor.delete')}
                        </DropdownMenuItem>
                      )}
                    </PermissionGate>
                  </DropdownMenuContent>
                </DropdownMenu>
                <ChevronRight className='text-muted-foreground/40 ml-1 hidden h-4 w-4 sm:block' aria-hidden />
              </div>
            </div>
          ))}
      </div>

      <AlertDialog open={deleteTarget != null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('editor.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('editor.deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='cursor-pointer'>{t('editor.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className='bg-destructive hover:bg-destructive/90 cursor-pointer text-white'
            >
              {t('editor.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
