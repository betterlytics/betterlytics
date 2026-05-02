import { z } from "zod";

const RESERVED_SLUGS = ["feed.xml", "index", "tag", "tags", "archive", "page"];

export const blogFrontmatterSchema = z.object({
  title: z.string().min(10).max(80),
  description: z.string().min(50).max(160),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .refine((s) => !RESERVED_SLUGS.includes(s), "reserved slug"),
  publishedAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  author: z.string(),
  tags: z.array(z.string()).max(6).default([]),
  coverImage: z.object({
    src: z.string(),
    alt: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  ogImage: z.string().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  keywords: z.array(z.string()).min(3).max(15),
  faqs: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  citations: z
    .array(z.object({ label: z.string(), url: z.string().url() }))
    .default([]),
});

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;
