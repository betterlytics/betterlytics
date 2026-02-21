'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import SettingsPageHeader from '../SettingsPageHeader';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import {
  getAvailableIntegrationTypesAction,
  getIntegrationsAction,
  saveIntegrationAction,
  deleteIntegrationAction,
  toggleIntegrationAction,
} from '@/app/actions/dashboard/integrations.action';
import { Integration, IntegrationType } from '@/entities/dashboard/integration.entities';
import { useTranslations } from 'next-intl';
import { IntegrationCard } from './IntegrationCard';
import { PushoverConfigDialog } from './PushoverConfigDialog';
import { DiscordConfigDialog } from './DiscordConfigDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';

type IntegrationDefinition = {
  type: IntegrationType;
  iconSrc: string;
  name: string;
  description: string;
};

export default function IntegrationsSettings() {
  const t = useTranslations('integrationsSettings');
  const dashboardId = useDashboardId();
  const [isPending, startTransition] = useTransition();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [availableTypes, setAvailableTypes] = useState<IntegrationType[]>([]);
  const [configDialogType, setConfigDialogType] = useState<IntegrationType | null>(null);
  const [disconnectType, setDisconnectType] = useState<IntegrationType | null>(null);

  const allIntegrations: IntegrationDefinition[] = useMemo(
    () => [
      {
        type: 'pushover',
        iconSrc: '/images/integrations/pushover.svg',
        name: t('integrations.pushover.name'),
        description: t('integrations.pushover.description'),
      },
      {
        type: 'discord',
        iconSrc: '/images/integrations/discord.svg',
        name: t('integrations.discord.name'),
        description: t('integrations.discord.description'),
      },
    ],
    [t]
  );

  const availableIntegrations = useMemo(
    () => allIntegrations.filter((def) => availableTypes.includes(def.type)),
    [allIntegrations, availableTypes]
  );

  useEffect(() => {
    startTransition(async () => {
      try {
        const [types, existing] = await Promise.all([
          getAvailableIntegrationTypesAction(dashboardId),
          getIntegrationsAction(dashboardId),
        ]);
        setAvailableTypes(types);
        setIntegrations(existing);
      } catch {}
    });
  }, [dashboardId]);

  const getIntegrationForType = (type: IntegrationType): Integration | undefined => {
    return integrations.find((i) => i.type === type);
  };

  const handleSave = (type: IntegrationType, config: Record<string, unknown>) => {
    startTransition(async () => {
      try {
        const result = await saveIntegrationAction(dashboardId, type, config);
        if (!result.success) {
          const errorMessages: Record<string, string> = {
            invalid_pushover_key: t('toast.invalidPushoverKey'),
            invalid_discord_webhook: t('toast.invalidDiscordWebhook'),
          };
          toast.error(errorMessages[result.error] ?? t('toast.error'));
          return;
        }
        setIntegrations((prev) => {
          const existing = prev.findIndex((i) => i.type === type);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = result.integration;
            return updated;
          }
          return [...prev, result.integration];
        });
        setConfigDialogType(null);
        toast.success(t('toast.saved'));
      } catch {
        toast.error(t('toast.error'));
      }
    });
  };

  const handleDisconnect = () => {
    if (!disconnectType) return;
    const type = disconnectType;
    startTransition(async () => {
      try {
        await deleteIntegrationAction(dashboardId, type);
        setIntegrations((prev) => prev.filter((i) => i.type !== type));
        setDisconnectType(null);
        toast.success(t('toast.deleted'));
      } catch {
        toast.error(t('toast.error'));
      }
    });
  };

  const handleToggle = (type: IntegrationType, enabled: boolean) => {
    startTransition(async () => {
      try {
        const result = await toggleIntegrationAction(dashboardId, type, enabled);
        setIntegrations((prev) => prev.map((i) => (i.type === type ? result : i)));
        toast.success(t('toast.saved'));
      } catch {
        toast.error(t('toast.error'));
      }
    });
  };

  return (
    <div>
      <SettingsPageHeader title={t('title')} />

      <p className='text-muted-foreground -mt-4 mb-6 text-sm'>{t('section.description')}</p>

      <div className='space-y-3'>
        {availableIntegrations.map((def) => (
          <IntegrationCard
            key={def.type}
            iconSrc={def.iconSrc}
            name={def.name}
            description={def.description}
            integration={getIntegrationForType(def.type)}
            isPending={isPending}
            onConfigure={() => setConfigDialogType(def.type)}
            onDisconnect={() => setDisconnectType(def.type)}
            onToggle={(enabled) => handleToggle(def.type, enabled)}
          />
        ))}
      </div>

      <p className='text-muted-foreground mt-6 text-center text-xs'>{t('moreIntegrations')}</p>

      <PushoverConfigDialog
        open={configDialogType === 'pushover'}
        onOpenChange={(open) => !open && setConfigDialogType(null)}
        integration={getIntegrationForType('pushover')}
        isPending={isPending}
        onSave={(config) => handleSave('pushover', config)}
      />

      <DiscordConfigDialog
        open={configDialogType === 'discord'}
        onOpenChange={(open) => !open && setConfigDialogType(null)}
        integration={getIntegrationForType('discord')}
        isPending={isPending}
        onSave={(config) => handleSave('discord', config)}
      />

      <ConfirmDialog
        open={disconnectType !== null}
        onOpenChange={(open) => !open && setDisconnectType(null)}
        title={t('disconnect.title')}
        description={t('disconnect.description')}
        confirmLabel={t('disconnect.confirm')}
        onConfirm={handleDisconnect}
      />
    </div>
  );
}
