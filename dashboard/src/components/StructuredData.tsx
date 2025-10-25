import { generateStructuredData } from '@/lib/seo';
import type { SEOConfig } from '@/lib/seo';

export async function StructuredData({ config }: { config: SEOConfig }) {
  const structuredData = await generateStructuredData(config);

  if (!structuredData) {
    return null;
  }

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
      }}
    />
  );
}
