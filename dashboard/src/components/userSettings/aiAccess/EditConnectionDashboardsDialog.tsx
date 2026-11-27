'use client';

import { useId, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import DashboardGrantPickerList from '@/components/userSettings/aiAccess/DashboardGrantPickerList';
import { useDashboardGrantPicker } from '@/hooks/use-dashboard-grant-picker';
import type { McpGrantSelection } from '@/entities/dashboard/mcpOAuth.entities';
import type { McpConnectionsOverview } from '@/services/auth/mcpConnections.service';
import type { ServerActionResponse } from '@/middlewares/serverActionHandler';
import { cn } from '@/lib/utils';

interface EditConnectionDashboardsDialogProps {
  // the connection's or token's name
  name: string;
  selection: McpGrantSelection;
  dashboards: McpConnectionsOverview['dashboards'];
  // personal tokens take explicit picks only
  allowAllDashboards?: boolean;
  description?: string;
  save: (selection: McpGrantSelection) => Promise<ServerActionResponse<void>>;
  onSaved: () => Promise<unknown>;
  onClose: () => void;
  onCloseDialog: () => void;
}

/** Edits the dashboards an OAuth connection or a personal token can read. */
export default function EditConnectionDashboardsDialog({
  name,
  selection,
  dashboards,
  allowAllDashboards = true,
  description,
  save,
  onSaved,
  onClose,
  onCloseDialog,
}: EditConnectionDashboardsDialogProps) {
  const t = useTranslations('components.userSettings.aiAccess.editDialog');
  const tToast = useTranslations('components.userSettings.aiAccess.toast');
  const tDialog = useTranslations('components.userSettings.dialog');
  const id = useId();
  const [isPending, startTransition] = useTransition();

  const picker = useDashboardGrantPicker(dashboards, selection);

  const handleSave = () => {
    if (!picker.canSave) return;
    startTransition(async () => {
      const result = await save(picker.selection);
      if (result.success) {
        await onSaved();
        toast.success(tToast('dashboardsUpdated', { name }));
        onClose();
      } else {
        toast.error(result.error.message || tDialog('toast.error'));
      }
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('title', { name })}</DialogTitle>
          <DialogDescription>{description ?? t('description')}</DialogDescription>
        </DialogHeader>

        <fieldset className='min-w-0 space-y-3' disabled={isPending}>
          {allowAllDashboards && (
            <div role='radiogroup' aria-label={t('title', { name })} className='flex gap-2'>
              {[true, false].map((all) => (
                <label
                  key={String(all)}
                  className={cn(
                    'has-[:focus-visible]:ring-ring/50 flex-1 cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-medium transition-[color,background-color,box-shadow] has-[:focus-visible]:ring-[3px]',
                    picker.allDashboards === all
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50',
                  )}
                >
                  <input
                    type='radio'
                    className='sr-only'
                    name={`${id}-scope`}
                    checked={picker.allDashboards === all}
                    onChange={() => picker.setAllDashboards(all)}
                  />
                  {all ? t('modeAll') : t('modeSelected')}
                </label>
              ))}
            </div>
          )}

          <DashboardGrantPickerList picker={picker} onCloseDialog={onCloseDialog} />
        </fieldset>

        <DialogFooter>
          <Button variant='outline' className='cursor-pointer' onClick={onClose} disabled={isPending}>
            {t('cancel')}
          </Button>
          <Button className='cursor-pointer' onClick={handleSave} disabled={isPending || !picker.canSave}>
            {isPending ? t('saving') : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
