import type { Metadata } from 'next';
import type { BlogPost } from '@/content/blog';
import { env } from '@/lib/env';
import { BLOG_COPY, blogUrl, isoDate, postAuthor } from './blog';

const FEED = { 'application/rss+xml': `${blogUrl()}/rss.xml` };

/** No hreflang alternates, unlike generateSEO: the blog has one English URL per page. */
export function blogIndexMetadata(): Metadata {
  return {
    title: `${BLOG_COPY.title} | Betterlytics`,
    description: BLOG_COPY.description,
    alternates: { canonical: blogUrl(), types: FEED },
    openGraph: {
      type: 'website',
      url: blogUrl(),
      siteName: 'Betterlytics',
      locale: 'en_US',
      title: 'The Betterlytics blog',
      description: BLOG_COPY.description,
      images: [{ url: '/og_image.jpg', width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', site: '@betterlytics', images: ['/og_image.jpg'] },
  };
}

export function blogPostMetadata(post: BlogPost): Metadata {
  const image = { url: post.cover.src, width: 1200, height: 630, alt: post.cover.alt };
  return {
    title: `${post.title} | Betterlytics`,
    description: post.description,
    authors: [{ name: postAuthor(post).name }],
    alternates: { canonical: blogUrl(post.slug), types: FEED },
    robots: post.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article',
      url: blogUrl(post.slug),
      siteName: 'Betterlytics',
      locale: 'en_US',
      title: post.title,
      description: post.description,
      publishedTime: isoDate(post.publishedAt),
      modifiedTime: isoDate(post.updatedAt ?? post.publishedAt),
      authors: [postAuthor(post).name],
      tags: post.tags,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@betterlytics',
      title: post.title,
      description: post.description,
      images: [image],
    },
  };
}

export function blogPostJsonLd(post: BlogPost) {
  const author = postAuthor(post);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      image: `${env.PUBLIC_BASE_URL}${post.cover.src}`,
      datePublished: isoDate(post.publishedAt),
      dateModified: isoDate(post.updatedAt ?? post.publishedAt),
      inLanguage: 'en',
      url: blogUrl(post.slug),
      mainEntityOfPage: blogUrl(post.slug),
      keywords: post.tags.length > 0 ? post.tags.join(', ') : undefined,
      author: { '@type': author.kind, name: author.name, ...(author.url && { url: author.url }) },
      publisher: {
        '@type': 'Organization',
        name: 'Betterlytics',
        url: env.PUBLIC_BASE_URL,
        logo: { '@type': 'ImageObject', url: `${env.PUBLIC_BASE_URL}/betterlytics-logo-full-dark.png` },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: BLOG_COPY.title, item: blogUrl() },
        { '@type': 'ListItem', position: 2, name: post.title, item: blogUrl(post.slug) },
      ],
    },
  ];
}
