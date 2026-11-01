import type { ComponentPropsWithoutRef } from 'react';
import type { EvaluateOptions, MDXComponents } from 'next-mdx-remote-client/rsc';
import remarkGfm from 'remark-gfm';

/** Shared with the posts test, so CI compiles and renders posts exactly as the build does. */
export const BLOG_MDX_OPTIONS = {
  mdxOptions: { remarkPlugins: [remarkGfm] },
} satisfies EvaluateOptions;

export const BLOG_MDX_COMPONENTS: MDXComponents = {
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div style={{ overflowX: 'auto' }}>
      <table {...props} />
    </div>
  ),
  img: ({ alt = '', ...props }: ComponentPropsWithoutRef<'img'>) => (
    // eslint-disable-next-line @next/next/no-img-element -- markdown images carry no dimensions for next/image
    <img alt={alt} loading='lazy' decoding='async' {...props} />
  ),
};
