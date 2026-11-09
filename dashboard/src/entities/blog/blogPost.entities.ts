import { z } from 'zod';

export type BlogAuthor = {
  name: string;
  kind: 'Person' | 'Organization';
  role?: string;
};

export const BLOG_AUTHORS = {
  team: { name: 'The Betterlytics team', kind: 'Organization' },
  thomas: { name: 'Thomas Schauser', role: 'Co-founder & Engineer', kind: 'Person' },
} as const satisfies Record<string, BlogAuthor>;

type BlogAuthorKey = keyof typeof BLOG_AUTHORS;

const AUTHOR_KEYS = Object.keys(BLOG_AUTHORS) as [BlogAuthorKey, ...BlogAuthorKey[]];

// the optional UTC time only orders posts published on the same day; pages show the date
const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/, 'Use YYYY-MM-DD, or YYYY-MM-DD HH:MM in UTC')
  .transform((value, ctx) => {
    const date = new Date(`${value.slice(0, 10)}T${value.slice(11) || '00:00'}:00Z`);
    // Date rolls 2026-02-30 over into March instead of rejecting it
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value.slice(0, 10)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Not a real date or time' });
      return z.NEVER;
    }
    return date;
  });

export const BlogFrontmatterSchema = z
  .object({
    title: z.string().min(10).max(80),
    description: z.string().min(50).max(160),
    publishedAt: IsoDateSchema,
    updatedAt: IsoDateSchema.optional(),
    author: z.enum(AUTHOR_KEYS),
    // also the og:image, so a 1200x630 PNG or JPEG: some link previews still skip WebP
    cover: z
      .object({
        src: z.string().regex(/^\/blog\/[a-z0-9-]+\/[\w.-]+\.(png|jpe?g)$/, 'Put covers in public/blog/<slug>/'),
        alt: z.string().min(10),
      })
      .strict(),
  })
  .strict();

export type BlogFrontmatter = z.infer<typeof BlogFrontmatterSchema>;
