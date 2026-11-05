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
  wide?: boolean;
  full?: boolean;
  framed?: boolean;
  children?: ReactNode;
};

/**
 * Children are the caption. `wide` runs past the text column where there is room, `full` matches the cover's width,
 * and `framed` adds the 1px border screenshots need (diagrams sit unframed on the page canvas).
 */
function Figure({ src, alt, width, height, wide = false, full = false, framed = false, children }: FigureProps) {
  return (
    <figure data-wide={wide || undefined} data-full={full || undefined} data-framed={framed || undefined}>
      <ZoomableImage src={src} alt={alt} width={width} height={height} />
      {children && <figcaption>{children}</figcaption>}
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
