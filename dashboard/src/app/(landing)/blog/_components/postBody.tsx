import type { ComponentPropsWithoutRef } from 'react';
import { evaluate, type MDXComponents } from 'next-mdx-remote-client/rsc';
import { BLOG_MDX_OPTIONS } from '@/app/(landing)/blog/_lib/mdx';
import styles from './prose.module.css';

const COMPONENTS: MDXComponents = {
  table: (props: ComponentPropsWithoutRef<'table'>) => (
    <div className={styles.tableScroll}>
      <table {...props} />
    </div>
  ),
  img: ({ alt = '', ...props }: ComponentPropsWithoutRef<'img'>) => (
    // eslint-disable-next-line @next/next/no-img-element -- markdown images carry no dimensions for next/image
    <img alt={alt} loading='lazy' decoding='async' {...props} />
  ),
};

export async function PostBody({ source }: { source: string }) {
  const { content, error } = await evaluate({ source, options: BLOG_MDX_OPTIONS, components: COMPONENTS });
  if (error) throw error;
  return <div className={styles.prose}>{content}</div>;
}
