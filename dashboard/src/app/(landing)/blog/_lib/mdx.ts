import type { EvaluateOptions } from 'next-mdx-remote-client/rsc';
import remarkGfm from 'remark-gfm';

/** Shared with the posts test, so CI compiles posts exactly as the build does. */
export const BLOG_MDX_OPTIONS = {
  mdxOptions: { remarkPlugins: [remarkGfm] },
} satisfies EvaluateOptions;
