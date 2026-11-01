import type { Metadata } from 'next';
import type { BlogPost } from '@/content/blog';
import { env } from '@/lib/env';
import { generateSEO, type SEOConfig } from '@/lib/seo';
import { BLOG_COPY, BLOG_LOCALE, blogPath, blogUrl, isoDate, postAuthor } from './blog';

/** Unlocalized, so no hreflang alternates: the blog has one English URL per page. */
async function blogSEO(config: Omit<SEOConfig, 'structuredDataType'>): Promise<Metadata> {
  const metadata = await generateSEO(
    { ...config, structuredDataType: 'webpage' },
    { locale: BLOG_LOCALE, localized: false },
  );
  return {
    ...metadata,
    alternates: { ...metadata.alternates, types: { 'application/rss+xml': `${blogUrl()}/rss.xml` } },
  };
}

export function blogIndexMetadata(): Promise<Metadata> {
  return blogSEO({
    title: `${BLOG_COPY.title} | Betterlytics`,
    description: BLOG_COPY.description,
    path: blogPath(),
    socialTitle: 'The Betterlytics blog',
  });
}

export async function blogPostMetadata(post: BlogPost): Promise<Metadata> {
  const metadata = await blogSEO({
    title: `${post.title} | Betterlytics`,
    description: post.description,
    path: blogPath(post.slug),
    socialTitle: post.title,
  });
  const author = postAuthor(post).name;
  const image = { url: post.cover.src, width: 1200, height: 630, alt: post.cover.alt };
  return {
    ...metadata,
    authors: [{ name: author }],
    openGraph: {
      ...metadata.openGraph,
      type: 'article',
      publishedTime: isoDate(post.publishedAt),
      modifiedTime: isoDate(post.updatedAt ?? post.publishedAt),
      authors: [author],
      tags: post.tags,
      images: [image],
    },
    twitter: { ...metadata.twitter, images: [image] },
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
