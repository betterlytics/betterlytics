import type { ReactNode } from 'react';
import { Corners } from '@/landing/components/ui/frame';
import { Reveal } from '@/landing/components/ui/reveal';
import ruled from '@/landing/components/ui/ruledGrid.module.css';
import { cn } from '@/landing/lib/cn';
import styles from './featureGrid.module.css';
import { Stage } from './stage';

export type FeatureGridItem = { key: string; title: string; body: string; scene: ReactNode };

export function FeatureGrid({
  items,
  stageClassName,
  lit,
}: {
  items: FeatureGridItem[];
  stageClassName?: string;
  lit?: { key: string; className: string };
}) {
  return (
    <ul className={cn(ruled.grid, ruled.cols3)}>
      {items.map(({ key, title, body, scene }, i) => (
        <li key={key} className={styles.cell}>
          <Corners />
          <Stage className={cn(styles.stage, stageClassName, key === lit?.key && [styles.lit, lit.className])}>
            {scene}
          </Stage>
          <Reveal index={i % 3} className={styles.copy}>
            <h3 className='text-title leading-6 font-medium tracking-ui'>{title}</h3>
            <p className='mt-2 text-label leading-[22px] text-muted'>{body}</p>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
