'use client';

import { useState, useTransition, useMemo, use } from 'react';
import { toast } from 'sonner';
import SettingsPageHeader from '../SettingsPageHeader';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import {
  saveIntegrationAction,
  deleteIntegrationAction,
  toggleIntegrationAction,
} from '@/app/actions/dashboard/integrations.action';
import {
  Integration,
  IntegrationConfigInput,
  IntegrationType,
  INTEGRATION_TYPES,
} from '@/entities/dashboard/integration.entities';
import { useTranslations } from 'next-intl';
import { IntegrationCard } from './IntegrationCard';
import { PushoverConfigDialog } from './dialogs/PushoverConfigDialog';
import { DiscordConfigDialog } from './dialogs/DiscordConfigDialog';
import { DestructiveActionDialog } from '@/components/dialogs/DestructiveActionDialog';

interface IntegrationsSettingsProps {
  availableTypesPromise: Promise<IntegrationType[]>;
  integrationsPromise: Promise<Integration[]>;
}

export default function IntegrationsSettings({
  availableTypesPromise,
  integrationsPromise,
}: IntegrationsSettingsProps) {
  const t = useTranslations('integrationsSettings');
  const dashboardId = useDashboardId();
  const initialTypes = use(availableTypesPromise);
  const initialIntegrations = use(integrationsPromise);
  const [isPending, startTransition] = useTransition();
  const [integrations, setIntegrations] = useState<Partial<Record<IntegrationType, Integration>>>(() =>
    Object.fromEntries(initialIntegrations.map((i) => [i.type, i])),
  );
  const [configDialogType, setConfigDialogType] = useState<IntegrationType | null>(null);
  const [disconnectType, setDisconnectType] = useState<IntegrationType | null>(null);

  const allIntegrations = useMemo(
    () =>
      INTEGRATION_TYPES.map((type) => ({
        type,
        iconSrc: `/images/integrations/${type}.svg`,
        name: t(`integrations.${type}.name`),
        description: t(`integrations.${type}.description`),
      })),
    [t],
  );

  const availableIntegrations = useMemo(
    () => allIntegrations.filter((def) => initialTypes.includes(def.type)),
    [allIntegrations, initialTypes],
  );

  const handleSave = (type: IntegrationType, config: IntegrationConfigInput) => {
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
        setIntegrations((prev) => ({ ...prev, [type]: result.integration }));
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
        setIntegrations((prev) => {
          const next = { ...prev };
          delete next[type];
          return next;
        });
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
        setIntegrations((prev) => ({ ...prev, [type]: result }));
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
            integration={integrations[def.type]}
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
        integration={integrations.pushover}
        isPending={isPending}
        onSave={(config) => handleSave('pushover', config)}
      />

      <DiscordConfigDialog
        open={configDialogType === 'discord'}
        onOpenChange={(open) => !open && setConfigDialogType(null)}
        integration={integrations.discord}
        isPending={isPending}
        onSave={(config) => handleSave('discord', config)}
      />

      <DestructiveActionDialog
        open={disconnectType !== null}
        onOpenChange={(open) => !open && setDisconnectType(null)}
        title={t('disconnect.title', {
          name: allIntegrations.find((d) => d.type === disconnectType)?.name ?? '',
        })}
        description={t('disconnect.description')}
        confirmLabel={t('disconnect.confirm')}
        onConfirm={handleDisconnect}
      />
    </div>
  );
}
