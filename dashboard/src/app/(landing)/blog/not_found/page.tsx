import { notFound } from 'next/navigation';

/** The target of the blog rewrite in next.config.ts. */
export default function BlogNotFoundTarget() {
  return notFound();
}
