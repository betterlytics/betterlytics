'use client';
import { ErrorPage } from '@/components/error-boundary';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPage error={error} resetError={reset} />;
}
