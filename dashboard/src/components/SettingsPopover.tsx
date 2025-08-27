'use client';

import { Moon, Sun, Settings as SettingsIcon, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface SettingsPopoverProps {
  onAdvancedSettingsClicked?: () => void;
  onClose: () => void;
}

export default function SettingsPopover({ onAdvancedSettingsClicked, onClose }: SettingsPopoverProps) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkTheme = mounted ? resolvedTheme === 'dark' : false;

  return (
    <div className='bg-popover border-border text-popover-foreground w-72 rounded-md border shadow-lg'>
      <div className='border-border flex items-center justify-between border-b p-3'>
        <h3 className='text-sm font-semibold'>Quick Settings</h3>
        <Button variant='ghost' size='icon' onClick={onClose} className='rounded-full'>
          <X size={18} />
        </Button>
      </div>

      <div className='space-y-4 p-3'>
        <div className='flex items-center justify-between'>
          <Label htmlFor='theme-toggle' className='flex cursor-pointer items-center gap-2'>
            <span className='text-foreground text-sm font-medium'>Theme</span>
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
          className='text-foreground hover:text-accent-foreground flex w-full items-center justify-start gap-2 rounded-md p-2! text-sm font-medium transition-colors hover:bg-[var(--hover)]'
        >
          <SettingsIcon size={16} />
          <span>Advanced Settings</span>
        </Button>
      </div>
    </div>
  );
}
