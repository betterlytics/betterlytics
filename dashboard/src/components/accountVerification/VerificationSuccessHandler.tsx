'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { VerificationCelebrationModal } from '@/components/accountVerification/VerificationCelebrationModal';

export function VerificationSuccessHandler() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (searchParams?.get('verified') === '1') {
      setShowModal(true);

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('verified');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams]);

  const handleClose = () => {
    setShowModal(false);
  };

  return (
    <VerificationCelebrationModal
      isOpen={showModal}
      onClose={handleClose}
      userName={session?.user?.name || undefined}
    />
  );
}
