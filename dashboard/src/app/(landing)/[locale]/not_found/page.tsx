import { notFound } from 'next/navigation';

/** Target of the fallback rewrite in next.config.ts. */
export default function LandingNotFoundTarget() {
  return notFound();
}
