'use client';

import { useTranslations } from 'next-intl';
import { MoveLeft, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type WizardActionsProps = {
  /** 'header' renders the inline desktop cluster (lg only); 'bar' renders the bottom mobile bar (lg:hidden). */
  layout: 'header' | 'bar';
  step: number;
  isLast: boolean;
  canContinue: boolean;
  canCommit: boolean;
  submittingDraft: boolean;
  submittingPublish: boolean;
  onBack: () => void;
  onNext: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
};

/**
 * Wizard navigation/commit actions
 */
export function WizardActions({
  layout,
  step,
  isLast,
  canContinue,
  canCommit,
  submittingDraft,
  submittingPublish,
  onBack,
  onNext,
  onPublish,
  onSaveDraft,
}: WizardActionsProps) {
  const t = useTranslations('statusPagesPage.editor');

  if (layout === 'bar') {
    return (
      <div className='border-border flex flex-none flex-col gap-2 border-t p-3 lg:hidden'>
        {isLast && (
          <Button
            variant='ghost'
            disabled={!canCommit}
            onClick={onSaveDraft}
            className='text-muted-foreground w-full cursor-pointer'
          >
            {submittingDraft && <Spinner size='sm' className='mr-1.5 border-current' />}
            {t('wizard.saveDraft')}
          </Button>
        )}
        <div className='flex items-center gap-2'>
          {step > 0 && (
            <Button variant='outline' onClick={onBack} className='flex-none cursor-pointer'>
              <MoveLeft className='mr-1.5 h-4 w-4' />
              {t('wizard.back')}
            </Button>
          )}
          {isLast ? (
            <Button disabled={!canCommit} onClick={onPublish} className='flex-1 cursor-pointer'>
              {submittingPublish && <Spinner size='sm' className='mr-1.5 border-current' />}
              {t('publish')}
            </Button>
          ) : (
            <Button disabled={!canContinue} onClick={onNext} className='flex-1 cursor-pointer'>
              {t('wizard.continue')}
              <MoveRight className='ml-1.5 h-4 w-4' />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className='hidden items-center gap-2 lg:flex'>
      {step > 0 && (
        <Button variant='outline' size='sm' onClick={onBack} className='cursor-pointer'>
          <MoveLeft className='mr-1.5 h-3.5 w-3.5' />
          {t('wizard.back')}
        </Button>
      )}
      {isLast ? (
        <>
          <Button
            variant='outline'
            size='sm'
            disabled={!canCommit}
            onClick={onSaveDraft}
            className='cursor-pointer'
          >
            {submittingDraft && <Spinner size='sm' className='mr-1.5 border-current' />}
            {t('wizard.saveDraft')}
          </Button>
          <Button size='sm' disabled={!canCommit} onClick={onPublish} className='cursor-pointer'>
            {submittingPublish && <Spinner size='sm' className='mr-1.5 border-current' />}
            {t('publish')}
          </Button>
        </>
      ) : (
        <Button size='sm' disabled={!canContinue} onClick={onNext} className='cursor-pointer'>
          {t('wizard.continue')}
          <MoveRight className='ml-1.5 h-3.5 w-3.5' />
        </Button>
      )}
    </div>
  );
}
