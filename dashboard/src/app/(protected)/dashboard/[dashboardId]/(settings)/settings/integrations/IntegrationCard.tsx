'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical } from 'lucide-react';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { Integration } from '@/entities/dashboard/integration.entities';
import { useTranslations } from 'next-intl';

type IntegrationCardProps = {
  iconSrc: string;
  name: string;
  description: string;
  integration?: Integration;
  isPending: boolean;
  onConfigure: () => void;
  onDisconnect: () => void;
  onToggle: (enabled: boolean) => void;
};

export function IntegrationCard({
  iconSrc,
  name,
  description,
  integration,
  isPending,
  onConfigure,
  onDisconnect,
  onToggle,
}: IntegrationCardProps) {
  const t = useTranslations('integrationsSettings');
  const isConnected = !!integration;

  return (
    <div className='bg-card hover:bg-accent/30 flex items-center gap-4 rounded-lg border px-4 py-4 transition-colors'>
      <Image src={iconSrc} alt={name} width={32} height={32} className='flex-shrink-0' />

      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-semibold'>{name}</span>
          {isConnected && (
            <Badge
              variant='outline'
              className='rounded-full border-green-200 bg-green-50 px-2 py-0 text-[10px] text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
            >
              {t('status.connected')}
            </Badge>
          )}
        </div>
        <p className='text-muted-foreground mt-0.5 text-xs'>{description}</p>
      </div>

      <div className='flex flex-shrink-0 items-center gap-2'>
        <PermissionGate permission='canManageSettings'>
          {(disabled) =>
            isConnected ? (
              <>
                <Switch
                  checked={integration.enabled}
                  onCheckedChange={onToggle}
                  disabled={isPending || disabled}
                  className='cursor-pointer'
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 cursor-pointer'
                      disabled={isPending || disabled}
                    >
                      <MoreVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem className='cursor-pointer' onClick={onConfigure}>
                      {t('actions.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='text-destructive focus:text-destructive cursor-pointer'
                      onClick={onDisconnect}
                    >
                      {t('actions.disconnect')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                variant='default'
                size='sm'
                className='cursor-pointer'
                disabled={isPending || disabled}
                onClick={onConfigure}
              >
                <Plus className='h-3.5 w-3.5' />
                {t('actions.add')}
              </Button>
            )
          }
        </PermissionGate>
      </div>
    </div>
  );
}
