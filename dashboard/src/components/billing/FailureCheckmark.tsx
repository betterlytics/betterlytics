'use client';

import { StatusCheckmark } from '@/components/billing/StatusCheckmark';

interface FailureCheckmarkProps {
  label?: string;
  description?: string;
  className?: string;
}

export function FailureCheckmark(props: FailureCheckmarkProps) {
  return <StatusCheckmark variant='failure' {...props} />;
}
