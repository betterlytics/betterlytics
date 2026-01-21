'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FrameworkVariant } from './frameworkCodes';

export function useVariantTabs(variants: FrameworkVariant[], defaultVariant?: string) {
  const [activeVariantId, setActiveVariantId] = useState(defaultVariant || variants[0]?.id);

  const activeVariant = variants.find((v) => v.id === activeVariantId) || variants[0];

  const renderTabs = () => {
    if (!variants.length) return null;

    return (
      <Tabs value={activeVariantId} onValueChange={setActiveVariantId} className='mb-4 w-full'>
        <TabsList>
          {variants.map((variant) => (
            <TabsTrigger key={variant.id} value={variant.id} className='cursor-pointer'>
              {variant.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    );
  };

  return {
    activeVariant,
    activeVariantId,
    setActiveVariantId,
    renderTabs,
  };
}
