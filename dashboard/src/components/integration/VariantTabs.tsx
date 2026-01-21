'use client';

import { useState } from 'react';
import { UnderlineTabs, UnderlineTabsList, UnderlineTabsTrigger } from '../ui/UnderlineTabs';
import type { FrameworkVariant } from './frameworkCodes';

export function useVariantTabs(variants: FrameworkVariant[], defaultVariant?: string) {
  const [activeVariantId, setActiveVariantId] = useState(defaultVariant || variants[0]?.id);

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
