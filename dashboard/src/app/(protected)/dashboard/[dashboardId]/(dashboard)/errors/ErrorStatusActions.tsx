'use client';

import { CheckCircle, ChevronDown, EyeOff, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ErrorStatusActionsProps = {
  canResolve: boolean;
  canIgnore: boolean;
  canUnresolve: boolean;
  onResolve: () => void;
  onIgnore: () => void;
  onUnresolve: () => void;
  isPending?: boolean;
};

export function ErrorStatusActions({
  canResolve,
  canIgnore,
  canUnresolve,
  onResolve,
  onIgnore,
  onUnresolve,
  isPending = false,
}: ErrorStatusActionsProps) {
  const t = useTranslations('errors.statusActions');
  const dropdownDisabled = isPending || (!canIgnore && !canUnresolve);

  return (
    <div className='flex'>
      <Button
        variant='outline'
        size='sm'
        className='cursor-pointer rounded-r-none border-r-0'
        disabled={!canResolve || isPending}
        onClick={onResolve}
      >
        <CheckCircle className='mr-1.5 h-3.5 w-3.5 text-emerald-600' />
        {t('resolve')}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className='cursor-pointer rounded-l-none px-1.5'
            disabled={dropdownDisabled}
          >
            <ChevronDown className='h-3.5 w-3.5' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem className='cursor-pointer' disabled={!canIgnore} onClick={onIgnore}>
            <EyeOff className='mr-2 h-4 w-4' />
            {t('ignore')}
          </DropdownMenuItem>
          <DropdownMenuItem className='cursor-pointer' disabled={!canUnresolve} onClick={onUnresolve}>
            <RotateCcw className='mr-2 h-4 w-4' />
            {t('unresolve')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
