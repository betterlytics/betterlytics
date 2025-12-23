'use client';

import { useState, useEffect, useRef, type ReactNode, type KeyboardEvent } from 'react';
import { Check, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EditableLabelProps {
  value: string;
  onSubmit?: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  textClassName?: string;
  inputClassName?: string;
  showPencil?: boolean;
  trigger?: ReactNode;
}

export function EditableLabel({
  value,
  onSubmit,
  disabled = false,
  placeholder,
  maxLength,
  className,
  textClassName,
  inputClassName,
  showPencil = true,
  trigger,
}: EditableLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedValue, setEditedValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEditable = !!onSubmit && !disabled;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditedValue(value);
    if (isSaving) {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [value]);

  const handleSave = () => {
    if (!onSubmit) return;
    const trimmed = editedValue.trim();
    const newValue = trimmed || null;
    if (newValue !== value) {
      setIsSaving(true);
      onSubmit(newValue);
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const startEditing = () => {
    if (isEditable) {
      setIsEditing(true);
    }
  };

  if (isEditing) {
    return (
      <div
        className={cn('inline-flex items-center gap-1', isSaving && 'pointer-events-none opacity-50', className)}
      >
        <Input
          ref={inputRef}
          type='text'
          value={editedValue}
          onChange={(e) => setEditedValue(e.target.value)}
          onBlur={handleCancel}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            'border-primary h-auto rounded-none border-0 border-b-2 bg-transparent px-0.5 py-0 shadow-none transition-colors focus-visible:ring-0',
            textClassName,
            inputClassName,
          )}
          style={{ width: `${Math.max(editedValue.length + 2, 10)}ch` }}
        />
        <Button
          variant='ghost'
          size='icon'
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className='hover:bg-primary/10 h-5 w-5 cursor-pointer'
        >
          <Check className='h-3.5 w-3.5' />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('group inline-flex items-center gap-1.5', className)}>
      <span
        onClick={startEditing}
        className={cn(
          'rounded-sm px-0.5 transition-colors',
          isEditable && 'hover:bg-muted/50 cursor-pointer',
          textClassName,
        )}
      >
        {value || <span className='text-muted-foreground'>{placeholder}</span>}
      </span>
      {isEditable && showPencil && !trigger && (
        <Button
          variant='ghost'
          size='icon'
          onClick={startEditing}
          className='text-muted-foreground hover:text-foreground h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100'
        >
          <Pencil className='h-3 w-3' />
        </Button>
      )}
      {isEditable && trigger && (
        <span onClick={startEditing} className='opacity-0 transition-opacity group-hover:opacity-100'>
          {trigger}
        </span>
      )}
    </div>
  );
}
