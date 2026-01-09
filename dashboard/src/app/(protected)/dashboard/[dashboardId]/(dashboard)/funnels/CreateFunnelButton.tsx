'use client';

import { useTranslations } from 'next-intl';
import { CreateFunnelDialog } from './CreateFunnelDialog';
import { PermissionGate } from '@/components/tooltip/PermissionGate';

export default function CreateFunnelButton() {
  const t = useTranslations('components.funnels.create');
  return (
    <PermissionGate hideWhenDisabled>
      {(disabled) => (
        <CreateFunnelDialog triggerText={t('createFunnelLower')} triggerVariant='outline' disabled={disabled} />
      )}
    </PermissionGate>
  );
}
