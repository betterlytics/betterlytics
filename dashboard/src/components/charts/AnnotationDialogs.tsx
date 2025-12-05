import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { useLocale } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';

export interface ChartAnnotation {
  id: string;
  date: number;
  label: string;
  description?: string;
  color?: string;
}

interface AnnotationDialogsProps {
  onAddAnnotation?: (annotation: Omit<ChartAnnotation, 'id'>) => void;
  onUpdateAnnotation?: (id: string, updates: Pick<ChartAnnotation, 'label' | 'description' | 'color'>) => void;
  onDeleteAnnotation?: (id: string) => void;
}

export interface AnnotationDialogsRef {
  openCreateDialog: (date: number) => void;
  openEditDialog: (annotation: ChartAnnotation) => void;
}

const AnnotationDialogs = forwardRef<AnnotationDialogsRef, AnnotationDialogsProps>(
  ({ onAddAnnotation, onUpdateAnnotation, onDeleteAnnotation }, ref) => {
    const locale = useLocale();

    // Create annotation state
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [pendingAnnotationDate, setPendingAnnotationDate] = useState<number | null>(null);
    const [createAnnotationName, setCreateAnnotationName] = useState('');

    // Edit annotation state
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedAnnotation, setSelectedAnnotation] = useState<ChartAnnotation | null>(null);
    const [editAnnotationName, setEditAnnotationName] = useState('');
    const [editAnnotationDescription, setEditAnnotationDescription] = useState('');

    useImperativeHandle(ref, () => ({
      openCreateDialog: (date: number) => {
        setPendingAnnotationDate(date);
        setCreateAnnotationName('');
        setShowCreateDialog(true);
      },
      openEditDialog: (annotation: ChartAnnotation) => {
        setSelectedAnnotation(annotation);
        setEditAnnotationName(annotation.label);
        setEditAnnotationDescription(annotation.description ?? '');
        setShowEditDialog(true);
      },
    }));

    const handleCreateAnnotation = () => {
      if (!pendingAnnotationDate || !createAnnotationName.trim() || !onAddAnnotation) return;

      onAddAnnotation({
        date: pendingAnnotationDate,
        label: createAnnotationName.trim(),
      });

      setShowCreateDialog(false);
      setPendingAnnotationDate(null);
      setCreateAnnotationName('');
    };

    const handleUpdateAnnotation = () => {
      if (!selectedAnnotation || !editAnnotationName.trim() || !onUpdateAnnotation) return;

      onUpdateAnnotation(selectedAnnotation.id, {
        label: editAnnotationName.trim(),
        description: editAnnotationDescription.trim() || undefined,
        color: selectedAnnotation.color,
      });

      setShowEditDialog(false);
      setSelectedAnnotation(null);
      setEditAnnotationName('');
      setEditAnnotationDescription('');
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
            <div className='py-4'>
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
              />
              {pendingAnnotationDate && (
                <p className='text-muted-foreground mt-2 text-sm'>
                  Date: {new Date(pendingAnnotationDate).toLocaleDateString(locale)}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAnnotation} disabled={!createAnnotationName.trim()}>
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
                  className='mt-1.5'
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Description (optional)</label>
                <Input
                  placeholder='Add a description...'
                  value={editAnnotationDescription}
                  onChange={(e) => setEditAnnotationDescription(e.target.value)}
                  className='mt-1.5'
                />
              </div>
              {selectedAnnotation && (
                <p className='text-muted-foreground text-sm'>
                  Date: {new Date(selectedAnnotation.date).toLocaleDateString(locale)}
                </p>
              )}
            </div>
            <DialogFooter className='flex-col gap-2 sm:flex-row sm:justify-between'>
              <Button variant='destructive' onClick={handleDeleteAnnotation} className='w-full sm:w-auto'>
                <Trash2 className='mr-2 h-4 w-4' />
                Delete
              </Button>
              <div className='flex gap-2'>
                <Button variant='outline' onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateAnnotation} disabled={!editAnnotationName.trim()}>
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
