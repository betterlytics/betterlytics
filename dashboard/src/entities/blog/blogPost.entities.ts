import { z } from 'zod';
import { BLOG_AUTHORS, type BlogAuthorKey } from '@/content/blog/authors';

const AUTHOR_KEYS = Object.keys(BLOG_AUTHORS) as [BlogAuthorKey, ...BlogAuthorKey[]];

const IsoDateSchema = z
  .string()
  .date('Use a YYYY-MM-DD date')
  .transform((value) => new Date(`${value}T00:00:00Z`));

export const BlogFrontmatterSchema = z
  .object({
    title: z.string().min(10).max(80),
    description: z.string().min(50).max(160),
    publishedAt: IsoDateSchema,
    updatedAt: IsoDateSchema.optional(),
    author: z.enum(AUTHOR_KEYS),
    tags: z.array(z.string().min(1)).max(4).default([]),
    // also the og:image, so a 1200x630 PNG or JPEG: some link previews still skip WebP
    cover: z
      .object({
        src: z.string().regex(/^\/blog\/[a-z0-9-]+\/[\w.-]+\.(png|jpe?g)$/, 'Put covers in public/blog/<slug>/'),
        alt: z.string().min(10),
      })
      .strict(),
    draft: z.boolean().default(false),
  })
  .strict();

export type BlogFrontmatter = z.infer<typeof BlogFrontmatterSchema>;
