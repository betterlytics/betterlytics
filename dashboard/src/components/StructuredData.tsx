import { generateStructuredData, SEO_CONFIGS } from '@/lib/seo';

interface StructuredDataProps {
  config: (typeof SEO_CONFIGS)[keyof typeof SEO_CONFIGS];
}

export function StructuredData({ config }: StructuredDataProps) {
  const structuredData = generateStructuredData(config.structuredData || 'webpage', config);

  if (!structuredData) {
    return null;
  }

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}
