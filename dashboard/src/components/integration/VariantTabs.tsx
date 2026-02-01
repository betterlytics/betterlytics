'use client';

import { useState, useEffect } from 'react';
import { UnderlineTabs, UnderlineTabsList, UnderlineTabsTrigger } from '../ui/UnderlineTabs';
import type { FrameworkVariant } from './frameworkCodes';

export function useVariantTabs(variants: FrameworkVariant[], defaultVariant?: string) {
  const [activeVariantId, setActiveVariantId] = useState(defaultVariant || variants[0]?.id);

  useEffect(() => {
    if (variants.length > 0) {
      const activeVariantExists = variants.some((v) => v.id === activeVariantId);
      if (!activeVariantExists) {
        setActiveVariantId(defaultVariant || variants[0]?.id);
      }
    }
  }, [variants, activeVariantId, defaultVariant]);

  const activeVariant = variants.find((v) => v.id === activeVariantId) || variants[0];

  const renderTabs = () => {
    if (!variants.length) return null;

    return (
      <UnderlineTabs value={activeVariantId} onValueChange={setActiveVariantId} className='mb-4 w-full'>
        <UnderlineTabsList>
          {variants.map((variant) => (
            <UnderlineTabsTrigger key={variant.id} value={variant.id}>
              {variant.label}
            </UnderlineTabsTrigger>
          ))}
        </UnderlineTabsList>
      </UnderlineTabs>
    );
  };

  return {
    activeVariant,
    activeVariantId,
    setActiveVariantId,
    renderTabs,
  };
}
