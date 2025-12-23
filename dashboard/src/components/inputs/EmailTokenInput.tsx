'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Mail, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmailTokenInputProps = {
  emails: string[];
  onAddEmail: (email: string) => boolean;
  onRemoveEmail: (email: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestedEmail?: string;
  maxEmails?: number;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailTokenInput({
  emails,
  onAddEmail,
  onRemoveEmail,
  disabled,
  placeholder = 'Enter email address...',
  suggestedEmail,
  maxEmails,
}: EmailTokenInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const tryAddEmail = (rawValue: string): boolean => {
    const email = rawValue.trim().toLowerCase();
    if (!email) return false;

    if (!EMAIL_REGEX.test(email)) {
      setHasError(true);
      return false;
    }

    const added = onAddEmail(email);
    if (added) {
      setInputValue('');
      setHasError(false);
      return true;
    }
    return false;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (inputValue.includes('@')) {
        e.preventDefault();
        tryAddEmail(inputValue);
      }
    } else if (e.key === 'Backspace' && inputValue === '' && emails.length > 0) {
      e.preventDefault();
      onRemoveEmail(emails[emails.length - 1]);
    }
  };

  const handleChange = (value: string) => {
    // Check for space or comma - treat as delimiter if email looks valid
    if (value.includes(' ') || value.includes(',')) {
      const email = value.replace(/[\s,]+$/, ''); // Remove trailing delimiters
      if (email.includes('@')) {
        // Only try to add if it looks like an email (has @)
        tryAddEmail(email);
        return;
      }
    }

    setInputValue(value);
    if (hasError) {
      setHasError(false);
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    tryAddEmail(inputValue);
  };

  const handleAddSuggested = () => {
    if (suggestedEmail && !emails.includes(suggestedEmail.toLowerCase())) {
      onAddEmail(suggestedEmail.toLowerCase());
    }
  };

  const isAtLimit = maxEmails !== undefined && emails.length >= maxEmails;
  const showSuggestion = suggestedEmail && emails.length === 0 && !disabled && !isAtLimit;

  const showAddButton = inputValue.trim().length > 0 && !disabled;

  return (
    <div className='space-y-2'>
      <div
        onClick={focusInput}
        className={cn(
          'border-input bg-background flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-md border px-3 py-2 transition-colors',
          'focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-1',
          hasError && 'border-destructive ring-destructive/30 animate-shake ring-2',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        {emails.map((email) => (
          <Badge
            key={email}
            variant='secondary'
            className='group inline-flex items-center gap-1 py-0.5 pr-1 pl-2 text-xs'
          >
            <Mail className='h-3 w-3 opacity-60' />
            <span className='max-w-[180px] truncate'>{email}</span>
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                onRemoveEmail(email);
              }}
              disabled={disabled}
              className='hover:bg-muted-foreground/20 ml-0.5 cursor-pointer rounded p-0.5 opacity-60 transition-all hover:opacity-100 disabled:cursor-not-allowed'
            >
              <X className='h-3 w-3' />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type='email'
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isAtLimit ? `Maximum ${maxEmails} emails` : emails.length === 0 ? placeholder : ''}
          disabled={disabled || isAtLimit}
          className='placeholder:text-muted-foreground min-w-[120px] flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed'
        />
        {showAddButton && (
          <button
            type='button'
            onClick={handleAddClick}
            className='text-muted-foreground hover:text-foreground hover:bg-muted flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors'
            title='Add email'
          >
            <Plus className='h-4 w-4' />
          </button>
        )}
      </div>
      {showSuggestion && (
        <button
          type='button'
          onClick={handleAddSuggested}
          className='inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-blue-500/10 px-2.5 py-1.5 text-xs text-blue-600 transition-colors hover:bg-blue-500/20 dark:text-blue-400'
        >
          <Plus className='h-3 w-3' />
          <span>Add your email ({suggestedEmail})</span>
        </button>
      )}
    </div>
  );
}
