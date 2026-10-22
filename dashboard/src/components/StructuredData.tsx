import { JsonLd } from '@/components/JsonLd';
import { generateStructuredData } from '@/lib/seo';
import type { SEOConfig } from '@/lib/seo';

export async function StructuredData({ config }: { config: SEOConfig }) {
  const structuredData = await generateStructuredData(config);

  if (!structuredData) {
    return null;
  }

  return <JsonLd data={structuredData} />;
}
