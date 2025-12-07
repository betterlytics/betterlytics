'use client';

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { DateTimePicker24h } from '@/app/(protected)/dashboards/DateTimePicker';
import { Label } from '@/components/ui/label';
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
import { AnnotationColorToken, type ChartAnnotation } from '@/entities/dashboard/annotation.entities';

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

interface AnnotationFormState {
  date: Date | null;
  name: string;
  description: string;
  color: AnnotationColorToken;
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
      {label ? <Label className='text-sm font-medium'>{label}</Label> : null}
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
    const emptyForm: AnnotationFormState = {
      date: null,
      name: '',
      description: '',
      color: defaultColorToken,
    };

    // Create annotation state
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [createForm, setCreateForm] = useState<AnnotationFormState>(emptyForm);

    // Edit annotation state
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedAnnotation, setSelectedAnnotation] = useState<ChartAnnotation | null>(null);
    const [editForm, setEditForm] = useState<AnnotationFormState>(emptyForm);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useImperativeHandle(ref, () => ({
      openCreateDialog: (date: number) => {
        setCreateForm({
          date: new Date(date),
          name: '',
          description: '',
          color: defaultColorToken,
        });
        setShowCreateDialog(true);
      },
      openEditDialog: (annotation: ChartAnnotation) => {
        setSelectedAnnotation(annotation);
        const token = (annotation.colorToken as AnnotationColorToken | undefined) ?? defaultColorToken;
        setEditForm({
          date: new Date(annotation.date),
          name: annotation.label,
          description: annotation.description ?? '',
          color: token,
        });
        setShowEditDialog(true);
      },
    }));

    const handleCreateAnnotation = () => {
      if (!createForm.name.trim() || !onAddAnnotation) return;

      const targetDate = createForm.date ?? new Date();
      if (!targetDate) return;

      onAddAnnotation({
        date: targetDate.getTime(),
        label: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        colorToken: createForm.color,
      });

      setShowCreateDialog(false);
      setCreateForm(emptyForm);
    };

    const handleUpdateAnnotation = () => {
      if (!selectedAnnotation || !editForm.name.trim() || !onUpdateAnnotation) return;

      onUpdateAnnotation(selectedAnnotation.id, {
        label: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        colorToken: editForm.color,
        date: (editForm.date ?? new Date(selectedAnnotation.date)).getTime(),
      });

      setShowEditDialog(false);
      setSelectedAnnotation(null);
      setEditForm(emptyForm);
    };

    const handleDeleteAnnotation = () => {
      if (!selectedAnnotation || !onDeleteAnnotation) return;

      onDeleteAnnotation(selectedAnnotation.id);

      setShowDeleteConfirm(false);
      setShowEditDialog(false);
      setSelectedAnnotation(null);
      setEditForm(emptyForm);
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
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && createForm.name.trim()) {
                    handleCreateAnnotation();
                  }
                }}
                autoFocus
                maxLength={20}
                className='text-sm placeholder:text-xs sm:text-base sm:placeholder:text-sm'
              />
              <div>
                <Label className='text-sm font-medium'>{t('descriptionLabel')}</Label>
                <Input
                  placeholder={t('descriptionPlaceholder')}
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  maxLength={200}
                  className='mt-1.5 text-sm placeholder:text-xs sm:text-base sm:placeholder:text-sm'
                />
              </div>
              <div className='grid gap-2'>
                <Label className='text-sm font-medium'>{t('dateTimeLabel')}</Label>
                <DateTimePicker24h
                  value={createForm.date ?? new Date()}
                  onChange={(d) => setCreateForm((prev) => ({ ...prev, date: d ?? null }))}
                />
              </div>
              <ColorSwatchPicker
                palette={colorPalette}
                value={createForm.color}
                onChange={(color) => setCreateForm((prev) => ({ ...prev, color }))}
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
                disabled={!createForm.name.trim()}
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
                <Label className='text-sm font-medium'>{t('nameLabel')}</Label>
                <Input
                  placeholder={t('editNamePlaceholder')}
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editForm.name.trim()) {
                      handleUpdateAnnotation();
                    }
                  }}
                  autoFocus
                  maxLength={20}
                  className='mt-1.5 text-sm placeholder:text-xs sm:text-base sm:placeholder:text-sm'
                />
              </div>
              <div>
                <Label className='text-sm font-medium'>{t('descriptionLabel')}</Label>
                <Input
                  placeholder={t('descriptionPlaceholder')}
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  maxLength={200}
                  className='mt-1.5 text-sm placeholder:text-xs sm:text-base sm:placeholder:text-sm'
                />
              </div>
              <div className='grid gap-2'>
                <Label className='text-sm font-medium'>{t('dateTimeLabel')}</Label>
                <DateTimePicker24h
                  value={editForm.date ?? new Date(selectedAnnotation?.date ?? Date.now())}
                  onChange={(d) => setEditForm((prev) => ({ ...prev, date: d ?? null }))}
                />
              </div>
              <ColorSwatchPicker
                palette={colorPalette}
                value={editForm.color}
                onChange={(color) => setEditForm((prev) => ({ ...prev, color }))}
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
                  disabled={!editForm.name.trim()}
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
