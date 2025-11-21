declare module '*.mdx' {
  import type { ComponentType } from 'react';

  export type WhatsNewMetadata = {
    version: string;
    releasedAt: string;
    title: string;
    summary: string;
  };

  export const metadata: WhatsNewMetadata;

  export type MDXContentProps = {
    components?: Record<string, ComponentType | undefined>;
  };

  const MDXComponent: (props: MDXContentProps) => JSX.Element;

  export default MDXComponent;
}
