import { ArrowUpCircle } from 'lucide-react';
import ExternalLink from '@/components/ExternalLink';
import { getAvailableUpdate } from '@/services/system/updateCheck.service';

export async function AdminUpdateNotice() {
  const update = await getAvailableUpdate();
  if (!update) return null;

  return (
    <div className='border-primary/30 bg-primary/5 flex flex-col gap-1 rounded-md border p-2 text-xs'>
      <p className='text-foreground flex items-center gap-1.5 font-medium'>
        <ArrowUpCircle size={14} className='text-primary shrink-0' />
        <span>
          Update available: <span className='font-mono'>{update.version}</span>
        </span>
      </p>
      <div className='flex flex-wrap gap-x-3 gap-y-1'>
        <ExternalLink
          href={update.releaseNotesUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary hover:underline'
        >
          Release notes
        </ExternalLink>
        <ExternalLink
          href={update.updatingDocsUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary hover:underline'
        >
          How to update
        </ExternalLink>
      </div>
    </div>
  );
}
