'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

export const ZOOM_TYPES = ['in', 'out'] as const;
export type ZoomType = (typeof ZOOM_TYPES)[number];

const getComponent = (zoomType: ZoomType) => {
  switch (zoomType) {
    case 'in':
      return Plus;
    case 'out':
      return Minus;
    default:
      return null;
  }
};

export const isZoomType = (value: any): value is ZoomType => ZOOM_TYPES.includes(value);

export type ZoomButtonProps = {
  zoomType: ZoomType;
  onClick: () => void;
} & React.ComponentProps<'button'>;

export function ZoomButton({ zoomType, onClick, className, style }: ZoomButtonProps) {
  const Icon = useMemo(() => getComponent(zoomType), [zoomType]);
  const t = useTranslations('components.geography.zoom');

  return (
    <motion.div
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className='w-full'
    >
      <Button
        size='sm'
        style={style}
        className={cn(className, 'cursor-pointer rounded-none')}
        onClick={onClick}
        title={t(zoomType)}
      >
        {Icon && isZoomType(zoomType) && <Icon fill='var(--secondary)' />}
      </Button>
    </motion.div>
  );
}
