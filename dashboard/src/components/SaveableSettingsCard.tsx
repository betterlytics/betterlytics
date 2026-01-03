'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SaveableSettingsCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  isChanged: boolean;
  onSave: () => Promise<void>;
  isPending?: boolean;
}

export default function SaveableSettingsCard({
  icon: Icon,
  title,
  description,
  children,
  isChanged,
  onSave,
  isPending = false,
}: SaveableSettingsCardProps) {
  const t = useTranslations('misc');

  return (
    <Card className='bg-card'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icon size={20} />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>{children}</CardContent>
      <CardFooter className='border-t'>
        <Button onClick={onSave} disabled={isPending || !isChanged} className='ml-auto cursor-pointer' size='sm'>
          {isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Save className='mr-2 h-4 w-4' />}
          {t('save')}
        </Button>
      </CardFooter>
    </Card>
  );
}
