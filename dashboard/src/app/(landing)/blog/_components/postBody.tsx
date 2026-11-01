import { evaluate } from 'next-mdx-remote-client/rsc';
import { BLOG_MDX_COMPONENTS, BLOG_MDX_OPTIONS } from '@/content/blog/mdx';
import styles from './prose.module.css';

export async function PostBody({ source }: { source: string }) {
  const { content, error } = await evaluate({
    source,
    options: BLOG_MDX_OPTIONS,
    components: BLOG_MDX_COMPONENTS,
  });
  if (error) throw error;
  return <div className={styles.prose}>{content}</div>;
}
