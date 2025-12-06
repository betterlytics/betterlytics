'use client';

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { DateTimePicker24h } from '@/app/(protected)/dashboards/DateTimePicker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ANNOTATION_COLOR_MAP,
  DEFAULT_ANNOTATION_COLOR_TOKEN,
  resolveAnnotationColor,
} from '@/utils/chartAnnotations';
import { AnnotationColorToken, type ChartAnnotation } from '@/entities/annotation';

interface AnnotationDialogsProps {
  onAddAnnotation?: (annotation: Omit<ChartAnnotation, 'id'>) => void;
  onUpdateAnnotation?: (
    id: string,
    updates: Pick<ChartAnnotation, 'label' | 'description' | 'colorToken' | 'date'>,
  ) => void;
  onDeleteAnnotation?: (id: string) => void;
}

export interface AnnotationDialogsRef {
  openCreateDialog: (date: number) => void;
  openEditDialog: (annotation: ChartAnnotation) => void;
}

interface ColorSwatchPickerProps {
  palette: readonly AnnotationColorToken[];
  value: AnnotationColorToken;
  onChange: (color: AnnotationColorToken) => void;
  label?: string;
  ariaLabelForColor?: (color: AnnotationColorToken) => string;
}

const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({
  palette,
  value,
  onChange,
  label,
  ariaLabelForColor,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className='grid gap-2'>
      {label ? <label className='text-sm font-medium'>{label}</label> : null}
      <div className='flex flex-wrap gap-2'>
        {palette.map((colorToken) => {
          const hex = resolveAnnotationColor(colorToken, isDark ? 'dark' : 'light');
          const isSelected = value === colorToken;
          return (
            <button
              key={colorToken}
              type='button'
              onClick={() => onChange(colorToken)}
              className={`h-8 w-8 rounded-full border transition ${
                isSelected ? 'ring-offset-background ring-primary ring-2 ring-offset-2' : 'border-border'
              }`}
              style={{ backgroundColor: hex }}
              aria-label={ariaLabelForColor ? ariaLabelForColor(colorToken) : `Select color ${colorToken}`}
            />
          );
        })}
      </div>
    </div>
  );
};

const AnnotationDialogs = forwardRef<AnnotationDialogsRef, AnnotationDialogsProps>(
  ({ onAddAnnotation, onUpdateAnnotation, onDeleteAnnotation }, ref) => {
    const t = useTranslations('components.annotations.dialogs');
    const colorPalette = Object.keys(ANNOTATION_COLOR_MAP) as AnnotationColorToken[];
    const defaultColorToken = DEFAULT_ANNOTATION_COLOR_TOKEN;

    // Create annotation state
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [pendingAnnotationDate, setPendingAnnotationDate] = useState<number | null>(null);
    const [createAnnotationDate, setCreateAnnotationDate] = useState<Date | null>(null);
    const [createAnnotationName, setCreateAnnotationName] = useState('');
    const [createAnnotationDescription, setCreateAnnotationDescription] = useState('');
    const [createAnnotationColor, setCreateAnnotationColor] = useState<AnnotationColorToken>(defaultColorToken);

    // Edit annotation state
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedAnnotation, setSelectedAnnotation] = useState<ChartAnnotation | null>(null);
    const [editAnnotationName, setEditAnnotationName] = useState('');
    const [editAnnotationDescription, setEditAnnotationDescription] = useState('');
    const [editAnnotationDate, setEditAnnotationDate] = useState<Date | null>(null);
    const [editAnnotationColor, setEditAnnotationColor] = useState<AnnotationColorToken>(defaultColorToken);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useImperativeHandle(ref, () => ({
      openCreateDialog: (date: number) => {
        setPendingAnnotationDate(date);
        setCreateAnnotationDate(new Date(date));
        setCreateAnnotationName('');
        setCreateAnnotationDescription('');
        setCreateAnnotationColor(defaultColorToken);
        setShowCreateDialog(true);
      },
      openEditDialog: (annotation: ChartAnnotation) => {
        setSelectedAnnotation(annotation);
        setEditAnnotationName(annotation.label);
        setEditAnnotationDescription(annotation.description ?? '');
        const date = new Date(annotation.date);
        setEditAnnotationDate(date);
        const token = (annotation.colorToken as AnnotationColorToken | undefined) ?? defaultColorToken;
        setEditAnnotationColor(token);
        setShowEditDialog(true);
      },
    }));

    const handleCreateAnnotation = () => {
      if ((!pendingAnnotationDate && !createAnnotationDate) || !createAnnotationName.trim() || !onAddAnnotation)
        return;

      const targetDate = createAnnotationDate ?? (pendingAnnotationDate ? new Date(pendingAnnotationDate) : null);
      if (!targetDate) return;

      onAddAnnotation({
        date: targetDate.getTime(),
        label: createAnnotationName.trim(),
        description: createAnnotationDescription.trim() || undefined,
        colorToken: createAnnotationColor,
      });

      setShowCreateDialog(false);
      setPendingAnnotationDate(null);
      setCreateAnnotationDate(null);
      setCreateAnnotationName('');
      setCreateAnnotationDescription('');
      setCreateAnnotationColor(defaultColorToken);
    };

    const handleUpdateAnnotation = () => {
      if (!selectedAnnotation || !editAnnotationName.trim() || !onUpdateAnnotation) return;

      const nextDate = editAnnotationDate ?? new Date(selectedAnnotation.date);

      onUpdateAnnotation(selectedAnnotation.id, {
        label: editAnnotationName.trim(),
        description: editAnnotationDescription.trim() || undefined,
        colorToken: editAnnotationColor,
        date: nextDate.getTime(),
      });

      setShowEditDialog(false);
      setSelectedAnnotation(null);
      setEditAnnotationName('');
      setEditAnnotationDescription('');
      setEditAnnotationColor(defaultColorToken);
    };

    const handleDeleteAnnotation = () => {
      if (!selectedAnnotation || !onDeleteAnnotation) return;

      onDeleteAnnotation(selectedAnnotation.id);

      setShowDeleteConfirm(false);
      setShowEditDialog(false);
      setSelectedAnnotation(null);
      setEditAnnotationName('');
      setEditAnnotationDescription('');
    };

    return (
      <>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>{t('addTitle')}</DialogTitle>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <Input
                placeholder={t('createNamePlaceholder')}
                value={createAnnotationName}
                onChange={(e) => setCreateAnnotationName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && createAnnotationName.trim()) {
                    handleCreateAnnotation();
                  }
                }}
                autoFocus
                maxLength={20}
                className='text-sm placeholder:text-xs sm:text-base sm:placeholder:text-sm'
              />
              <div>
                <label className='text-sm font-medium'>{t('descriptionLabel')}</label>
                <Input
                  placeholder={t('descriptionPlaceholder')}
                  value={createAnnotationDescription}
                  onChange={(e) => setCreateAnnotationDescription(e.target.value)}
                  maxLength={200}
                  className='mt-1.5 text-sm placeholder:text-xs sm:text-base sm:placeholder:text-sm'
                />
              </div>
              <div className='grid gap-2'>
                <label className='text-sm font-medium'>{t('dateTimeLabel')}</label>
                <DateTimePicker24h
                  value={
                    createAnnotationDate ?? (pendingAnnotationDate ? new Date(pendingAnnotationDate) : new Date())
                  }
                  onChange={(d) => setCreateAnnotationDate(d ?? null)}
                />
              </div>
              <ColorSwatchPicker
                palette={colorPalette}
                value={createAnnotationColor}
                onChange={setCreateAnnotationColor}
                label={t('colorLabel')}
                ariaLabelForColor={(token) => t('selectColorAria', { token })}
              />
            </div>
            <DialogFooter>
              <Button variant='outline' className='cursor-pointer' onClick={() => setShowCreateDialog(false)}>
                {t('cancel')}
              </Button>
              <Button
                className='cursor-pointer'
                onClick={handleCreateAnnotation}
                disabled={!createAnnotationName.trim()}
              >
                {t('add')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) {
              setShowDeleteConfirm(false);
            }
          }}
        >
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>{t('editTitle')}</DialogTitle>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div>
                <label className='text-sm font-medium'>{t('nameLabel')}</label>
                <Input
                  placeholder={t('editNamePlaceholder')}
                  value={editAnnotationName}
                  onChange={(e) => setEditAnnotationName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editAnnotationName.trim()) {
                      handleUpdateAnnotation();
                    }
                  }}
                  autoFocus
                  maxLength={20}
                  className='mt-1.5 text-sm placeholder:text-xs sm:text-base sm:placeholder:text-sm'
                />
              </div>
              <div>
                <label className='text-sm font-medium'>{t('descriptionLabel')}</label>
                <Input
                  placeholder={t('descriptionPlaceholder')}
                  value={editAnnotationDescription}
                  onChange={(e) => setEditAnnotationDescription(e.target.value)}
                  maxLength={200}
                  className='mt-1.5 text-sm placeholder:text-xs sm:text-base sm:placeholder:text-sm'
                />
              </div>
              <div className='grid gap-2'>
                <label className='text-sm font-medium'>{t('dateTimeLabel')}</label>
                <DateTimePicker24h
                  value={editAnnotationDate ?? new Date(selectedAnnotation?.date ?? Date.now())}
                  onChange={(d) => setEditAnnotationDate(d ?? null)}
                />
              </div>
              <ColorSwatchPicker
                palette={colorPalette}
                value={editAnnotationColor}
                onChange={setEditAnnotationColor}
                label={t('colorLabel')}
                ariaLabelForColor={(token) => t('selectColorAria', { token })}
              />
            </div>
            <DialogFooter className='flex w-full flex-row items-center gap-2'>
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant='destructive'
                    className='cursor-pointer px-3'
                    aria-label={t('deleteAnnotationAria')}
                  >
                    <Trash2 className='h-4 w-4' />
                    <span className='ml-2 hidden sm:inline'>{t('delete')}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('deleteConfirmDescription')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className='cursor-pointer'>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button variant='destructive' className='cursor-pointer' onClick={handleDeleteAnnotation}>
                        {t('delete')}
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className='ml-auto flex gap-2'>
                <Button
                  variant='outline'
                  className='min-w-[104px] cursor-pointer'
                  onClick={() => setShowEditDialog(false)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  className='min-w-[104px] cursor-pointer'
                  onClick={handleUpdateAnnotation}
                  disabled={!editAnnotationName.trim()}
                >
                  {t('save')}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

AnnotationDialogs.displayName = 'AnnotationDialogs';

export default AnnotationDialogs;
