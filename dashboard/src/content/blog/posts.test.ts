import { evaluate } from 'next-mdx-remote-client/rsc';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BlogFrontmatterSchema } from '@/entities/blog/blogPost.entities';
import { getBlogPosts, parseBlogPost } from './index';
import { BLOG_MDX_COMPONENTS, BLOG_MDX_OPTIONS } from './mdx';

/** Just the header bytes image-size reads: the PNG signature and the IHDR chunk's width and height. */
function pngHeader(width: number, height: number) {
  const bytes = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes);
  bytes.writeUInt32BE(13, 8);
  bytes.write('IHDR', 12, 'ascii');
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

const source = (coverSrc: string, body = 'Body.') =>
  [
    '---',
    "title: 'A title long enough'",
    "description: 'A description that is long enough to pass the fifty character minimum.'",
    "publishedAt: '2026-11-01'",
    'author: team',
    'cover:',
    `  src: ${coverSrc}`,
    "  alt: 'A cover image alt text'",
    '---',
    '',
    body,
  ].join('\n');

const VALID = {
  title: 'A title long enough',
  description: 'A description that is long enough to pass the fifty character minimum.',
  publishedAt: '2026-11-01',
  author: 'team',
  cover: { src: '/blog/a-post/cover.png', alt: 'A cover image alt text' },
};

describe('BlogFrontmatterSchema', () => {
  it('accepts a minimal post and parses its date, with an optional UTC time', () => {
    expect(BlogFrontmatterSchema.parse(VALID).publishedAt.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(
      BlogFrontmatterSchema.parse({ ...VALID, publishedAt: '2026-11-01 09:30' }).publishedAt.toISOString(),
    ).toBe('2026-11-01T09:30:00.000Z');
  });

  it('rejects unknown keys, unknown authors, bad dates and covers outside public/blog', () => {
    for (const post of [
      { ...VALID, draft: true },
      { ...VALID, tags: ['Company'] },
      { ...VALID, author: 'nobody' },
      { ...VALID, publishedAt: '1 November 2026' },
      { ...VALID, publishedAt: '2026-02-30' },
      { ...VALID, publishedAt: '2026-11-01 25:00' },
      { ...VALID, publishedAt: '2026-11-01T09:30' },
      { ...VALID, cover: { ...VALID.cover, src: '/images/cover.png' } },
      { ...VALID, cover: { ...VALID.cover, src: '/blog/a-post/cover.webp' } },
    ]) {
      expect(BlogFrontmatterSchema.safeParse(post).success).toBe(false);
    }
  });
});

describe('parseBlogPost', () => {
  const cover = '/blog/a-post/cover.png';
  const validCover = () => pngHeader(1200, 630);

  it('accepts a valid post and takes the slug from the file name', () => {
    expect(parseBlogPost('a-post.mdx', source(cover), validCover).slug).toBe('a-post');
  });

  it('rejects file names that are not a lowercase slug ending in .mdx', () => {
    for (const file of ['A-Post.mdx', 'a_post.mdx', 'a-post.md', 'a post.mdx']) {
      expect(() => parseBlogPost(file, source(cover), validCover)).toThrow(/name it <slug>\.mdx/);
    }
  });

  it('rejects a cover that is missing or in another post folder', () => {
    expect(() => parseBlogPost('a-post.mdx', source(cover), () => undefined)).toThrow(/public\/blog\/a-post\//);
    expect(() => parseBlogPost('a-post.mdx', source('/blog/other-post/cover.png'), validCover)).toThrow(
      /public\/blog\/a-post\//,
    );
  });

  it('rejects a cover that is not a 1200x630 PNG or JPEG', () => {
    for (const bytes of [
      pngHeader(1600, 1000),
      Buffer.from('GIF89a\xb0\x04\x76\x02', 'latin1'),
      Buffer.from('nope'),
    ]) {
      expect(() => parseBlogPost('a-post.mdx', source(cover), () => bytes)).toThrow(/1200x630 PNG or JPEG/);
    }
  });

  it('checks every image in the post exists in its folder, and that a Figure states its real size', () => {
    const figure = (src: string) =>
      `<Figure src='${src}' alt="A > in the alt" width={800} height={400}>Caption</Figure>`;
    const assets = (figureBytes: Buffer | undefined) => (src: string) =>
      src === cover ? validCover() : figureBytes;
    const parse = (body: string, figureBytes: Buffer | undefined) =>
      parseBlogPost('a-post.mdx', source(cover, body), assets(figureBytes));

    expect(parse(figure('/blog/a-post/chart.png'), pngHeader(800, 400)).slug).toBe('a-post');
    expect(() => parse(figure('/blog/a-post/chart.png'), undefined)).toThrow(
      /must be a file in public\/blog\/a-post\//,
    );
    expect(() => parse(figure('/blog/other-post/chart.png'), pngHeader(800, 400))).toThrow(
      /public\/blog\/a-post\//,
    );
    expect(() => parse(figure('/blog/a-post/chart.png'), pngHeader(800, 401))).toThrow(
      /says 800x400, but the image is 800x401/,
    );
    expect(() => parse('![A chart](/blog/a-post/chart.png)', undefined)).toThrow(
      /must be a file in public\/blog\/a-post\//,
    );
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
