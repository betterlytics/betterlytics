'use client';

import { useState, useEffect, useRef } from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import FunnelBarplot from '@/components/funnels/FunnelBarplot';
import { FunnelStepFilter } from './FunnelStepFilter';
import { Reorder } from 'motion/react';
import { cn } from '@/lib/utils';
import { useFunnelDialog } from '@/hooks/use-funnel-dialog';

type FunnelDialogContentProps = {
  metadata: ReturnType<typeof useFunnelDialog>['metadata'];
  setName: ReturnType<typeof useFunnelDialog>['setName'];
  setIsStrict: ReturnType<typeof useFunnelDialog>['setIsStrict'];
  funnelSteps: ReturnType<typeof useFunnelDialog>['funnelSteps'];
  addEmptyFunnelStep: ReturnType<typeof useFunnelDialog>['addEmptyFunnelStep'];
  setFunnelSteps: ReturnType<typeof useFunnelDialog>['setFunnelSteps'];
  updateFunnelStep: ReturnType<typeof useFunnelDialog>['updateFunnelStep'];
  removeFunnelStep: ReturnType<typeof useFunnelDialog>['removeFunnelStep'];
  searchableFunnelSteps: ReturnType<typeof useFunnelDialog>['searchableFunnelSteps'];
  funnelPreview: ReturnType<typeof useFunnelDialog>['funnelPreview'];
  emptySteps: ReturnType<typeof useFunnelDialog>['emptySteps'];
  isPreviewLoading: ReturnType<typeof useFunnelDialog>['isPreviewLoading'];
  hasAttemptedSubmit: boolean;
  labels: {
    name: string;
    namePlaceholder?: string;
    strictMode: string;
    addStep: string;
    livePreview: string;
    defineAtLeastTwoSteps: string;
  };
};

export function FunnelDialogContent({
  metadata,
  setName,
  setIsStrict,
  funnelSteps,
  addEmptyFunnelStep,
  setFunnelSteps,
  updateFunnelStep,
  removeFunnelStep,
  searchableFunnelSteps,
  funnelPreview,
  emptySteps,
  isPreviewLoading,
  hasAttemptedSubmit,
  labels,
}: FunnelDialogContentProps) {
  const isNameEmpty = metadata.name.trim() === '';
  const showNameError = hasAttemptedSubmit && isNameEmpty;

  // Local state for smooth drag reordering without triggering refetches
  const [localSteps, setLocalSteps] = useState(funnelSteps);
  const isDraggingRef = useRef(false);

  // Sync local state when funnelSteps changes externally (e.g., add/remove step)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalSteps(funnelSteps);
    }
  }, [funnelSteps]);

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    // Only commit the reorder to parent state on drop
    setFunnelSteps(localSteps);
  };

  return (
    <div className='scrollbar-thin bg-card flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg'>
      <div className='flex flex-1 flex-col'>
        <div className='flex flex-1 flex-col gap-4 rounded-lg p-4'>
          <div className='flex w-full justify-between'>
            <div className='flex gap-4'>
              <div className='max-w-md min-w-40'>
                <Label htmlFor='name' className='text-foreground mb-1 block'>
                  {labels.name} <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='name'
                  placeholder={labels.namePlaceholder}
                  value={metadata.name}
                  onChange={(evt) => setName(evt.target.value)}
                  className={cn(showNameError && 'border-destructive')}
                />
              </div>
              <div className='flex items-end'>
                <div className='flex h-9 items-center gap-2 rounded-lg px-2'>
                  <Label htmlFor='strict-mode' className='text-foreground cursor-pointer'>
                    {labels.strictMode}
                  </Label>
                  <Switch
                    id='strict-mode'
                    className='cursor-pointer'
                    checked={metadata.isStrict}
                    onCheckedChange={setIsStrict}
                  />
                </div>
              </div>
            </div>
            <div className='flex items-end'>
              <Button variant='outline' onClick={addEmptyFunnelStep} className='cursor-pointer whitespace-nowrap'>
                <PlusIcon className='h-4 w-4' /> {labels.addStep}
              </Button>
            </div>
          </div>
          <Reorder.Group axis='y' values={localSteps} onReorder={setLocalSteps} className='space-y-2'>
            {localSteps.map((step, index) => (
              <Reorder.Item
                key={step.id}
                value={step}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                className='dark:border-border border-foreground/30 bg-card relative flex cursor-move items-center rounded-md border pl-4'
              >
                <div className='dark:border-border border-foreground/30 bg-card absolute -left-3 flex size-4 items-center justify-center rounded-full border p-3 shadow'>
                  <p className='text-muted-foreground text-sm font-medium'>{index + 1}</p>
                </div>
                <FunnelStepFilter
                  onFilterUpdate={updateFunnelStep}
                  filter={step}
                  requestRemoval={() => removeFunnelStep(step.id)}
                  showEmptyError={hasAttemptedSubmit}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
        {searchableFunnelSteps.length < 2 && (
          <div className='text-muted-foreground flex flex-1 items-center justify-center p-4'>
            <p>{labels.defineAtLeastTwoSteps}</p>
          </div>
        )}
        {searchableFunnelSteps.length >= 2 &&
          (!isPreviewLoading && funnelPreview ? (
            <div className='space-y-4 rounded-lg p-4'>
              <Label htmlFor='name' className='text-foreground mb-2 block pl-1'>
                {labels.livePreview}
              </Label>
              <FunnelBarplot funnel={funnelPreview} emptySteps={emptySteps} />
            </div>
          ) : (
            <section className='space-y-3'>
              <div className='bg-muted h-6 w-48 animate-pulse rounded' />
              <div className='bg-muted h-40 w-full animate-pulse rounded' />
            </section>
          ))}
      </div>
    </div>
  );
}
