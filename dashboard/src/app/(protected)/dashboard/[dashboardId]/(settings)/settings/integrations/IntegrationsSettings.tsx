'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { Search, Globe } from 'lucide-react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import SettingsPageHeader from '../SettingsPageHeader';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import {
  getIntegrationsAction,
  saveIntegrationAction,
  deleteIntegrationAction,
  toggleIntegrationAction,
} from '@/app/actions/dashboard/integrations.action';
import { Integration, IntegrationType } from '@/entities/dashboard/integration.entities';
import { useTranslations } from 'next-intl';
import { IntegrationCard } from './IntegrationCard';
import { PushoverConfigDialog } from './PushoverConfigDialog';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import type { ReactNode } from 'react';

type IntegrationDefinition = {
  type: IntegrationType;
  icon: ReactNode;
  comingSoon?: boolean;
};

const ICON_CLASS = 'h-5 w-5';

const AVAILABLE_INTEGRATIONS: IntegrationDefinition[] = [
  {
    type: 'pushover',
    icon: <Icon icon='simple-icons:pushover' className={ICON_CLASS} />,
  },
  {
    type: 'discord',
    icon: <Icon icon='simple-icons:discord' className={ICON_CLASS} />,
    comingSoon: true,
  },
  {
    type: 'slack',
    icon: <Icon icon='simple-icons:slack' className={ICON_CLASS} />,
    comingSoon: true,
  },
  {
    type: 'telegram',
    icon: <Icon icon='simple-icons:telegram' className={ICON_CLASS} />,
    comingSoon: true,
  },
  {
    type: 'msteams',
    icon: <Icon icon='simple-icons:microsoftteams' className={ICON_CLASS} />,
    comingSoon: true,
  },
  {
    type: 'webhook',
    icon: <Globe className={ICON_CLASS} />,
    comingSoon: true,
  },
];

export default function IntegrationsSettings() {
  const t = useTranslations('integrationsSettings');
  const dashboardId = useDashboardId();
  const [isPending, startTransition] = useTransition();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [configDialogType, setConfigDialogType] = useState<IntegrationType | null>(null);
  const [disconnectType, setDisconnectType] = useState<IntegrationType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    startTransition(async () => {
      try {
        const result = await getIntegrationsAction(dashboardId);
        setIntegrations(result);
      } catch {}
    });
  }, [dashboardId]);

  const filteredIntegrations = useMemo(() => {
    if (!searchQuery.trim()) return AVAILABLE_INTEGRATIONS;
    const query = searchQuery.toLowerCase();
    return AVAILABLE_INTEGRATIONS.filter((def) => {
      const name = t(`integrations.${def.type}.name`).toLowerCase();
      const description = t(`integrations.${def.type}.description`).toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [searchQuery, t]);

  const getIntegrationForType = (type: IntegrationType): Integration | undefined => {
    return integrations.find((i) => i.type === type);
  };

  const handleSave = (type: IntegrationType, config: Record<string, unknown>) => {
    startTransition(async () => {
      try {
        const result = await saveIntegrationAction(dashboardId, type, config);
        setIntegrations((prev) => {
          const existing = prev.findIndex((i) => i.type === type);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = result;
            return updated;
          }
          return [...prev, result];
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

      <div className='relative mb-4'>
        <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
        <Input
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='pl-9'
        />
      </div>

      <div className='space-y-3'>
        {filteredIntegrations.map((def) => (
          <IntegrationCard
            key={def.type}
            icon={def.icon}
            name={t(`integrations.${def.type}.name`)}
            description={t(`integrations.${def.type}.description`)}
            integration={getIntegrationForType(def.type)}
            comingSoon={def.comingSoon}
            isPending={isPending}
            onConfigure={() => setConfigDialogType(def.type)}
            onDisconnect={() => setDisconnectType(def.type)}
            onToggle={(enabled) => handleToggle(def.type, enabled)}
          />
        ))}

        {filteredIntegrations.length === 0 && (
          <div className='text-muted-foreground py-8 text-center text-sm'>{t('search.noResults')}</div>
        )}
      </div>

      <PushoverConfigDialog
        open={configDialogType === 'pushover'}
        onOpenChange={(open) => !open && setConfigDialogType(null)}
        integration={getIntegrationForType('pushover')}
        isPending={isPending}
        onSave={(config) => handleSave('pushover', config)}
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
