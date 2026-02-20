'use client';

import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { Integration } from '@/entities/dashboard/integration.entities';
import { useTranslations } from 'next-intl';

type IntegrationCardProps = {
  icon: ReactNode;
  name: string;
  description: string;
  integration?: Integration;
  comingSoon?: boolean;
  isPending: boolean;
  onConfigure: () => void;
  onDisconnect: () => void;
  onToggle: (enabled: boolean) => void;
};

export function IntegrationCard({
  icon,
  name,
  description,
  integration,
  comingSoon,
  isPending,
  onConfigure,
  onDisconnect,
  onToggle,
}: IntegrationCardProps) {
  const t = useTranslations('integrationsSettings');
  const isConnected = !!integration;

  return (
    <div className='bg-card hover:bg-accent/30 flex items-center gap-4 rounded-lg border px-4 py-4 transition-colors'>
      <div className='bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg'>
        {icon}
      </div>

      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-semibold'>{name}</span>
          {!comingSoon && isConnected && (
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

      <div className='flex flex-shrink-0 items-center gap-3'>
        {!comingSoon && isConnected && (
          <PermissionGate permission='canManageSettings'>
            {(disabled) => (
              <Switch
                checked={integration.enabled}
                onCheckedChange={onToggle}
                disabled={isPending || disabled}
                className='cursor-pointer'
              />
            )}
          </PermissionGate>
        )}

        {!comingSoon && (
          <PermissionGate permission='canManageSettings'>
            {(disabled) =>
              isConnected ? (
                <div className='flex gap-1.5'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='cursor-pointer'
                    disabled={isPending || disabled}
                    onClick={onConfigure}
                  >
                    {t('actions.edit')}
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-destructive hover:text-destructive cursor-pointer'
                    disabled={isPending || disabled}
                    onClick={onDisconnect}
                  >
                    {t('actions.disconnect')}
                  </Button>
                </div>
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
        )}

        {comingSoon && (
          <Badge variant='secondary' className='text-muted-foreground rounded-full px-2.5 py-0.5 text-[10px]'>
            {t('status.comingSoon')}
          </Badge>
        )}
      </div>
    </div>
  );
}
