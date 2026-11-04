import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { EvaluateOptions, MDXComponents } from 'next-mdx-remote-client/rsc';
import remarkGfm from 'remark-gfm';
import { ZoomableImage } from './zoomableImage';

/** Shared with the posts test, so CI compiles and renders posts exactly as the build does. */
export const BLOG_MDX_OPTIONS = {
  mdxOptions: { remarkPlugins: [remarkGfm] },
} satisfies EvaluateOptions;

type FigureProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: ReactNode;
  wide?: boolean;
  full?: boolean;
  framed?: boolean;
  children?: ReactNode;
};

/** Unframed figure for diagrams drawn on the page canvas; `wide` lets it run past the text column where there is room. */
// `full` matches the cover's width and `framed` keeps the 1px border screenshots need; children work as the caption.
function Figure({ src, alt, width, height, caption, wide = false, full = false, framed = false, children }: FigureProps) {
  const text = caption ?? children;
  return (
    <figure data-wide={wide || undefined} data-full={full || undefined} data-framed={framed || undefined}>
      <ZoomableImage src={src} alt={alt} width={width} height={height} />
      {text && <figcaption>{text}</figcaption>}
    </figure>
  );
}

export const BLOG_MDX_COMPONENTS: MDXComponents = {
  Figure,
  FullWidth: ({ children }: { children: ReactNode }) => <div data-full=''>{children}</div>,
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
