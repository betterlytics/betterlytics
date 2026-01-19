'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CodeBlock } from './CodeBlock';
import type { CodeTab } from './frameworkCodes';

interface CodeTabsProps {
  tabs: CodeTab[];
  defaultTab?: string;
}

export function CodeTabs({ tabs, defaultTab }: CodeTabsProps) {
  if (!tabs.length) return null;

  return (
    <Tabs defaultValue={defaultTab || tabs[0]?.id || 'npm'} className='w-full'>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className='mt-0'>
          <CodeBlock code={tab.code} language={tab.language} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
