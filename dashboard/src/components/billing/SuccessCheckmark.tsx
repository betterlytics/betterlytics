'use client';

import { StatusCheckmark } from '@/components/billing/StatusCheckmark';

interface SuccessCheckmarkProps {
  label?: string;
  description?: string;
  className?: string;
}

export function SuccessCheckmark(props: SuccessCheckmarkProps) {
  return <StatusCheckmark variant='success' {...props} />;
}
