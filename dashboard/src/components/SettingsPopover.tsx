'use client';

import { Moon, Sun, Settings as SettingsIcon, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

interface SettingsPopoverProps {
  onAdvancedSettingsClicked?: () => void;
  onClose: () => void;
}

export default function SettingsPopover({ onAdvancedSettingsClicked, onClose }: SettingsPopoverProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('components.settingsPopover');

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkTheme = mounted ? resolvedTheme === 'dark' : false;

  return (
    <div className='bg-popover border-border text-popover-foreground w-72 rounded-md border shadow-lg'>
      <div className='border-border flex items-center justify-between border-b p-3'>
        <h3 className='text-sm font-semibold'>{t('title')}</h3>
        <Button variant='ghost' size='icon' onClick={onClose} className='rounded-full'>
          <X size={18} />
        </Button>
      </div>

      <div className='space-y-4 p-3'>
        <div className='flex items-center justify-between'>
          <Label htmlFor='theme-toggle' className='flex cursor-pointer items-center gap-2'>
            <span className='text-foreground text-sm font-medium'>{t('theme')}</span>
          </Label>
          <div className='flex items-center gap-2'>
            {mounted &&
              (isDarkTheme ? (
                <Sun size={16} className='text-muted-foreground' />
              ) : (
                <Moon size={16} className='text-muted-foreground' />
              ))}
            <Switch
              id='theme-toggle'
              checked={isDarkTheme}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              disabled={!mounted}
            />
          </div>
        </div>
      </div>

      <div className='border-border border-t p-3'>
        <Button
          variant='ghost'
          onClick={onAdvancedSettingsClicked}
          className='text-foreground flex w-full items-center justify-start gap-2 rounded-md p-2! text-sm font-medium transition-colors'
        >
          <SettingsIcon size={16} />
          <span>{t('advanced')}</span>
        </Button>
      </div>
    </div>
  );
}
