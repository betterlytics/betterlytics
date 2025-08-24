import { generateStructuredData } from '@/lib/seo';

interface StructuredDataProps {
  config: {
    title: string;
    description: string;
    keywords: string[];
    path: string;
    imageAlt?: string;
    structuredData?: 'organization' | 'website' | 'webpage' | 'contact';
  };
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
