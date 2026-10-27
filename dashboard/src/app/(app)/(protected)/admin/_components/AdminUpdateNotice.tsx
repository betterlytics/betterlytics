import { ArrowUpCircle } from 'lucide-react';
import ExternalLink from '@/components/ExternalLink';
import { getAvailableUpdate } from '@/services/system/updateCheck.service';

export async function AdminUpdateNotice() {
  const update = await getAvailableUpdate();
  if (!update) return null;

  const label = `Update available: ${update.version}. Open the release notes`;

  return (
    <>
      <ExternalLink
        href={update.releaseNotesUrl}
        target='_blank'
        rel='noopener noreferrer'
        title={label}
        aria-label={label}
        className='bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs transition-colors group-data-[collapsible=icon]:hidden'
      >
        <ArrowUpCircle size={12} className='shrink-0' />
        <span>{update.version}</span>
      </ExternalLink>
      <ExternalLink
        href={update.releaseNotesUrl}
        target='_blank'
        rel='noopener noreferrer'
        title={label}
        aria-label={label}
        className='text-primary hover:bg-sidebar-accent relative hidden size-8 items-center justify-center rounded-md transition-colors group-data-[collapsible=icon]:flex'
      >
        <ArrowUpCircle size={16} />
        <span aria-hidden='true' className='bg-primary absolute top-1 right-1 size-1.5 rounded-full' />
      </ExternalLink>
    </>
  );
}
