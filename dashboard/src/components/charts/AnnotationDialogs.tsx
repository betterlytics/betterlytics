import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { useLocale } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { DateTimePicker24h } from '@/app/(protected)/dashboards/DateTimePicker';
import {
  ANNOTATION_COLOR_MAP,
  DEFAULT_ANNOTATION_COLOR,
  DEFAULT_ANNOTATION_COLOR_TOKEN,
  resolveAnnotationColor,
  type AnnotationColorToken,
} from '@/utils/chartAnnotations';

export interface ChartAnnotation {
  id: string;
  date: number;
  label: string;
  description?: string;
  colorToken?: string;
}

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
}

const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({ palette, value, onChange, label }) => (
  <div className='grid gap-2'>
    {label ? <label className='text-sm font-medium'>{label}</label> : null}
    <div className='flex flex-wrap gap-2'>
      {palette.map((colorToken) => {
        const hex = resolveAnnotationColor(colorToken);
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
            aria-label={`Select color ${colorToken}`}
          />
        );
      })}
    </div>
  </div>
);

const AnnotationDialogs = forwardRef<AnnotationDialogsRef, AnnotationDialogsProps>(
  ({ onAddAnnotation, onUpdateAnnotation, onDeleteAnnotation }, ref) => {
    const locale = useLocale();
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
              <DialogTitle>Add Annotation</DialogTitle>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <Input
                placeholder='Annotation name (e.g., "Product Launch")'
                value={createAnnotationName}
                onChange={(e) => setCreateAnnotationName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && createAnnotationName.trim()) {
                    handleCreateAnnotation();
                  }
                }}
                autoFocus
                maxLength={20}
              />
              <div>
                <label className='text-sm font-medium'>Description (optional)</label>
                <Input
                  placeholder='Add a description...'
                  value={createAnnotationDescription}
                  onChange={(e) => setCreateAnnotationDescription(e.target.value)}
                  maxLength={200}
                  className='mt-1.5'
                />
              </div>
              <div className='grid gap-2'>
                <label className='text-sm font-medium'>Date &amp; time</label>
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
                label='Color'
              />
            </div>
            <DialogFooter>
              <Button variant='outline' className='cursor-pointer' onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                className='cursor-pointer'
                onClick={handleCreateAnnotation}
                disabled={!createAnnotationName.trim()}
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Edit Annotation</DialogTitle>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div>
                <label className='text-sm font-medium'>Name</label>
                <Input
                  placeholder='Annotation name'
                  value={editAnnotationName}
                  onChange={(e) => setEditAnnotationName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editAnnotationName.trim()) {
                      handleUpdateAnnotation();
                    }
                  }}
                  autoFocus
                  maxLength={20}
                  className='mt-1.5'
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Description (optional)</label>
                <Input
                  placeholder='Add a description...'
                  value={editAnnotationDescription}
                  onChange={(e) => setEditAnnotationDescription(e.target.value)}
                  maxLength={200}
                  className='mt-1.5'
                />
              </div>
              <div className='grid gap-2'>
                <label className='text-sm font-medium'>Date &amp; time</label>
                <DateTimePicker24h
                  value={editAnnotationDate ?? new Date(selectedAnnotation?.date ?? Date.now())}
                  onChange={(d) => setEditAnnotationDate(d ?? null)}
                />
              </div>
              <ColorSwatchPicker
                palette={colorPalette}
                value={editAnnotationColor}
                onChange={setEditAnnotationColor}
                label='Color'
              />
            </div>
            <DialogFooter className='flex-col gap-2 sm:flex-row sm:justify-between'>
              <Button
                variant='destructive'
                onClick={handleDeleteAnnotation}
                className='w-full cursor-pointer sm:w-auto'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Delete
              </Button>
              <div className='flex gap-2'>
                <Button variant='outline' className='cursor-pointer' onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button
                  className='cursor-pointer'
                  onClick={handleUpdateAnnotation}
                  disabled={!editAnnotationName.trim()}
                >
                  Save
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
