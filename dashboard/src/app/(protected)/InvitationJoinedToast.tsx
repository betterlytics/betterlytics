'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function InvitationJoinedToast() {
  const searchParams = useSearchParams();
  const t = useTranslations('invitations.toast');
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (searchParams.get('invited') === '1' && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.success(t('joinedSuccess'));

      const url = new URL(window.location.href);
      url.searchParams.delete('invited');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [searchParams, t]);

  return null;
}
