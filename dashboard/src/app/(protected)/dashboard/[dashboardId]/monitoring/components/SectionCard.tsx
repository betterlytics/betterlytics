'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

export function SectionCard({ children, className }: SectionCardProps) {
  return (
    <Card className={cn('border-border/70 bg-card/80 p-5 shadow-lg shadow-black/10', className)}>{children}</Card>
  );
}
