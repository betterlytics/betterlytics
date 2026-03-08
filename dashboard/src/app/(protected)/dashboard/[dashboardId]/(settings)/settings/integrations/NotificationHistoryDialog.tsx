'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { History, CheckCircle2, XCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { getNotificationHistoryAction } from '@/app/actions/dashboard/notificationHistory.action';
import { NotificationHistoryRow } from '@/entities/dashboard/notificationHistory.entities';
import { formatRelativeTimeFromNow } from '@/utils/dateFormatters';

type NotificationHistoryDialogProps = {
  monitorId?: string;
};

export function NotificationHistoryDialog({ monitorId }: NotificationHistoryDialogProps = {}) {
  const t = useTranslations('integrationsSettings');
  const dashboardId = useDashboardId();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<NotificationHistoryRow[] | null>(null);
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setOpen(true);
    setError(false);
    startTransition(async () => {
      try {
        const data = await getNotificationHistoryAction(dashboardId, monitorId);
        setRows(data);
      } catch {
        setError(true);
      }
    });
  };

  return (
    <>
      <Button variant='outline' size='sm' className='cursor-pointer' onClick={handleOpen}>
        <History className='h-4 w-4' />
        {t('history.button')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-5xl'>
          <DialogHeader>
            <DialogTitle>{t('history.title')}</DialogTitle>
          </DialogHeader>

          {isPending ? (
            <div className='flex justify-center py-8'>
              <Spinner size='default' />
            </div>
          ) : error ? (
            <div className='text-destructive py-8 text-center text-sm'>{t('history.error')}</div>
          ) : rows === null || rows.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center text-sm'>{t('history.empty')}</div>
          ) : (
            <div className='max-h-[60vh] overflow-y-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[140px]'>{t('history.columns.time')}</TableHead>
                    <TableHead className='w-[120px]'>{t('history.columns.integration')}</TableHead>
                    <TableHead className='w-[200px]'>{t('history.columns.notification')}</TableHead>
                    <TableHead className='w-[100px]'>{t('history.columns.status')}</TableHead>
                    <TableHead>{t('history.columns.error')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className='text-muted-foreground text-xs'>
                        {formatRelativeTimeFromNow(row.ts)}
                      </TableCell>
                      <TableCell>
                        <span className='flex items-center gap-2'>
                          <Image
                            src={`/images/integrations/${row.integrationType}.svg`}
                            alt={row.integrationType}
                            width={18}
                            height={18}
                          />
                          <span className='capitalize'>{row.integrationType}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className='line-clamp-2 whitespace-normal'>{row.title}</span>
                      </TableCell>
                      <TableCell>
                        {row.status === 'sent' ? (
                          <span className='flex items-center gap-1.5 text-green-600'>
                            <CheckCircle2 className='h-3.5 w-3.5 shrink-0' />
                            <span className='text-xs font-medium'>{t('history.status.sent')}</span>
                          </span>
                        ) : (
                          <span className='text-destructive flex items-center gap-1.5'>
                            <XCircle className='h-3.5 w-3.5 shrink-0' />
                            <span className='text-xs font-medium'>{t('history.status.failed')}</span>
                          </span>
                        )}
                        {row.attemptCount > 1 && (
                          <p className='text-muted-foreground mt-0.5 text-xs'>
                            {t('history.attempts', { count: row.attemptCount })}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className='font-mono text-xs break-words whitespace-normal'>
                        {row.errorMessage || null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
