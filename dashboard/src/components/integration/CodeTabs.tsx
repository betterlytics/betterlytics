'use client';

import { UnderlineTabs, UnderlineTabsList, UnderlineTabsTrigger, UnderlineTabsContent } from '../ui/UnderlineTabs';
import { CodeBlock } from './CodeBlock';
import type { CodeTab } from './frameworkCodes';

interface CodeTabsProps {
  tabs: CodeTab[];
  defaultTab?: string;
}

export function CodeTabs({ tabs, defaultTab }: CodeTabsProps) {
  if (!tabs.length) return null;

  return (
    <UnderlineTabs defaultValue={defaultTab || tabs[0]?.id} className='w-full'>
      <UnderlineTabsList>
        {tabs.map((tab) => (
          <UnderlineTabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </UnderlineTabsTrigger>
        ))}
      </UnderlineTabsList>
      {tabs.map((tab) => (
        <UnderlineTabsContent key={tab.id} value={tab.id}>
          <CodeBlock code={tab.code} language={tab.language} />
        </UnderlineTabsContent>
      ))}
    </UnderlineTabs>
  );
}
