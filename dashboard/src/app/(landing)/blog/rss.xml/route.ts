import { getBlogPosts } from '@/content/blog';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { BLOG_COPY, blogUrl } from '@/app/(landing)/blog/_lib/blog';

export const dynamic = 'force-static';

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function GET() {
  if (!isClientFeatureEnabled('isCloud')) {
    return new Response(null, { status: 404 });
  }
  const posts = getBlogPosts();
  const items = posts.map((post) =>
    [
      '<item>',
      `<title>${escapeXml(post.title)}</title>`,
      `<link>${blogUrl(post.slug)}</link>`,
      `<guid isPermaLink="true">${blogUrl(post.slug)}</guid>`,
      `<pubDate>${post.publishedAt.toUTCString()}</pubDate>`,
      `<description>${escapeXml(post.description)}</description>`,
      ...post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`),
      '</item>',
    ].join(''),
  );
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    '<title>The Betterlytics blog</title>',
    `<link>${blogUrl()}</link>`,
    `<description>${escapeXml(BLOG_COPY.description)}</description>`,
    '<language>en</language>',
    `<atom:link href="${blogUrl()}/rss.xml" rel="self" type="application/rss+xml"/>`,
    ...(posts[0]
      ? [`<lastBuildDate>${(posts[0].updatedAt ?? posts[0].publishedAt).toUTCString()}</lastBuildDate>`]
      : []),
    ...items,
    '</channel>',
    '</rss>',
  ].join('\n');
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
