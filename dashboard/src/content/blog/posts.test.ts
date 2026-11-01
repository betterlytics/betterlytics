import { evaluate } from 'next-mdx-remote-client/rsc';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BlogFrontmatterSchema } from '@/entities/blog/blogPost.entities';
import { getBlogPosts } from './index';
import { BLOG_MDX_COMPONENTS, BLOG_MDX_OPTIONS } from './mdx';

const VALID = {
  title: 'A title long enough',
  description: 'A description that is long enough to pass the fifty character minimum.',
  publishedAt: '2026-11-01',
  author: 'team',
  cover: { src: '/blog/a-post/cover.png', alt: 'A cover image alt text' },
};

describe('BlogFrontmatterSchema', () => {
  it('accepts a minimal post and parses its date', () => {
    expect(BlogFrontmatterSchema.parse(VALID).publishedAt.toISOString()).toBe('2026-11-01T00:00:00.000Z');
  });

  it('rejects unknown keys, unknown authors, bad dates and covers outside public/blog', () => {
    for (const post of [
      { ...VALID, draft: true },
      { ...VALID, tags: ['Company'] },
      { ...VALID, author: 'nobody' },
      { ...VALID, publishedAt: '1 November 2026' },
      { ...VALID, cover: { ...VALID.cover, src: '/images/cover.png' } },
      { ...VALID, cover: { ...VALID.cover, src: '/blog/a-post/cover.webp' } },
    ]) {
      expect(BlogFrontmatterSchema.safeParse(post).success).toBe(false);
    }
  });
});

// getBlogPosts throws on a bad file name, frontmatter or cover, which fails this file
describe.each(getBlogPosts().map((post) => [post.slug, post] as const))('blog post %s', (_, post) => {
  it('compiles and renders', async () => {
    const { content, error } = await evaluate({
      source: post.source,
      options: BLOG_MDX_OPTIONS,
      components: BLOG_MDX_COMPONENTS,
    });
    expect(error).toBeUndefined();
    expect(() => renderToStaticMarkup(content)).not.toThrow();
  });
});
