'use client';
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

export const isZoomType = (value: any): value is ZoomType => {
  return ZOOM_TYPES.includes(value);
};

export type ZoomButtonProps = {
  zoomType: ZoomType;
  onClick: () => void;
  className?: string;
};

export function ZoomButton({ zoomType, onClick, className }: ZoomButtonProps) {
  const Icon = useMemo(() => getComponent(zoomType), [zoomType]);
  const t = useTranslations(`components.geography.zoom`);

  return (
    <Button size='sm' className={cn(className, 'rounded-none')} onClick={onClick} title={t(zoomType)}>
      {Icon && isZoomType(zoomType) && <Icon fill={'var(--secondary)'} />}
    </Button>
  );
}
