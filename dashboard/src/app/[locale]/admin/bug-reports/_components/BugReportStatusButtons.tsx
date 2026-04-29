'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { BugReportStatus } from '@prisma/client';
import { setBugReportStatusAction } from '@/actions/superadmin/bugReports.action';

interface Props {
  reportId: string;
  currentStatus: BugReportStatus;
}

export function BugReportStatusButtons({ reportId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStatus(status: BugReportStatus) {
    setLoading(true);
    const result = await setBugReportStatusAction(reportId, status);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className='flex items-center gap-1'>
      {currentStatus !== 'resolved' && (
        <Button variant='ghost' size='sm' disabled={loading} onClick={() => handleStatus('resolved')}>
          Resolve
        </Button>
      )}
      {currentStatus !== 'ignored' && (
        <Button
          variant='ghost'
          size='sm'
          disabled={loading}
          className='text-muted-foreground'
          onClick={() => handleStatus('ignored')}
        >
          Ignore
        </Button>
      )}
      {currentStatus !== 'open' && (
        <Button variant='ghost' size='sm' disabled={loading} onClick={() => handleStatus('open')}>
          Reopen
        </Button>
      )}
    </div>
  );
}
