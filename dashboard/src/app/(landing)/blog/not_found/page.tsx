import { notFound } from 'next/navigation';

/** Every unknown /blog URL is rewritten here (next.config.ts), so misses are served from this one prerendered 404. */
export default function BlogNotFoundTarget() {
  return notFound();
}
