'use client';

import { CheckIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { BAScrollContainer } from '@/components/ba-scroll-container';
import { cn } from '@/lib/utils';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type Dispatch,
  type ReactNode,
} from 'react';

export const BADropdownMenu = DropdownMenu;
export const BADropdownMenuTrigger = DropdownMenuTrigger;
export const BADropdownMenuPortal = DropdownMenuPortal;
export const BADropdownMenuGroup = DropdownMenuGroup;
export const BADropdownMenuLabel = DropdownMenuLabel;
export const BADropdownMenuSeparator = DropdownMenuSeparator;
export const BADropdownMenuCheckboxItem = DropdownMenuCheckboxItem;
export const BADropdownMenuRadioGroup = DropdownMenuRadioGroup;
export const BADropdownMenuRadioItem = DropdownMenuRadioItem;
export const BADropdownMenuShortcut = DropdownMenuShortcut;

export type BADropdownMenuActiveIndicatorProps = ComponentProps<'span'> & {
  icon?: ReactNode;
};

export function BADropdownMenuActiveIndicator({
  icon = <CheckIcon />,
  className,
  ...props
}: BADropdownMenuActiveIndicatorProps) {
  return (
    <span
      aria-hidden
      data-slot="ba-dropdown-menu-active-indicator"
      className={cn(
        'ml-auto hidden shrink-0 group-data-[active=true]/ba-active:inline-flex',
        className,
      )}
      {...props}
    >
      {icon}
    </span>
  );
}

export type BADropdownMenuItemProps = ComponentProps<typeof DropdownMenuItem> & {
  active?: boolean;
};

export function BADropdownMenuItem({
  active,
  className,
  ...props
}: BADropdownMenuItemProps) {
  return (
    <DropdownMenuItem
      data-active={active || undefined}
      className={cn('group/ba-active cursor-pointer [&_svg]:text-muted-foreground', className)}
      {...props}
    />
  );
}

export type BADropdownMenuContentProps = ComponentProps<typeof DropdownMenuContent> & {
  scrollClassName?: string;
};

export function BADropdownMenuContent({
  children,
  className,
  scrollClassName,
  collisionPadding = 16,
  ...props
}: BADropdownMenuContentProps) {
  return (
    <DropdownMenuContent
      collisionPadding={collisionPadding}
      className={cn('min-w-56 overflow-clip!', className)}
      {...props}
    >
      <BAScrollContainer
        scrollToSelector='[data-active="true"]'
        focusOnScroll
        className={cn(
          'max-h-(--radix-dropdown-menu-content-available-height)',
          scrollClassName,
        )}
      >
        {children}
      </BAScrollContainer>
    </DropdownMenuContent>
  );
}

type BASubContextValue = {
  open: boolean;
  setOpen: Dispatch<boolean>;
  scheduleClose: () => void;
  cancelClose: () => void;
};

const BASubContext = createContext<BASubContextValue | null>(null);

function useBASubContext(): BASubContextValue {
  const ctx = useContext(BASubContext);
  if (!ctx) {
    throw new Error(
      'BADropdownMenuSubTrigger / BADropdownMenuSubContent must be rendered inside a BADropdownMenuSub.',
    );
  }
  return ctx;
}

const DEFAULT_HOVER_CLOSE_DELAY_MS = 300;

export type BADropdownMenuSubProps = ComponentProps<typeof DropdownMenuSub> & {
  hoverCloseDelay?: number;
};

export function BADropdownMenuSub({
  hoverCloseDelay = DEFAULT_HOVER_CLOSE_DELAY_MS,
  open: controlledOpen,
  onOpenChange,
  defaultOpen,
  children,
  ...props
}: BADropdownMenuSubProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    if (hoverCloseDelay === 0) return;
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return;
    cancelClose();
    timerRef.current = setTimeout(() => setOpen(false), hoverCloseDelay);
  }, [cancelClose, hoverCloseDelay, setOpen]);

  useEffect(() => () => cancelClose(), [cancelClose]);

  const value = useMemo<BASubContextValue>(
    () => ({ open, setOpen, scheduleClose, cancelClose }),
    [open, setOpen, scheduleClose, cancelClose],
  );

  return (
    <BASubContext.Provider value={value}>
      <DropdownMenuSub open={open} onOpenChange={setOpen} {...props}>
        {children}
      </DropdownMenuSub>
    </BASubContext.Provider>
  );
}

export type BADropdownMenuSubTriggerProps = ComponentProps<typeof DropdownMenuSubTrigger> & {
  active?: boolean;
};

export function BADropdownMenuSubTrigger({
  active,
  className,
  onPointerEnter,
  onPointerLeave,
  ...props
}: BADropdownMenuSubTriggerProps) {
  const { scheduleClose, cancelClose } = useBASubContext();

  return (
    <DropdownMenuSubTrigger
      data-active={active || undefined}
      className={cn('group/ba-active gap-2 [&_svg]:text-muted-foreground', className)}
      onPointerEnter={(e) => {
        cancelClose();
        onPointerEnter?.(e);
      }}
      onPointerLeave={(e) => {
        scheduleClose();
        onPointerLeave?.(e);
      }}
      {...props}
    />
  );
}

export type BADropdownMenuSubContentProps = ComponentProps<typeof DropdownMenuSubContent> & {
  scrollClassName?: string;
};

export function BADropdownMenuSubContent({
  children,
  className,
  scrollClassName,
  collisionPadding = 16,
  onPointerEnter,
  onPointerLeave,
  ...props
}: BADropdownMenuSubContentProps) {
  const { scheduleClose, cancelClose } = useBASubContext();

  return (
    <DropdownMenuSubContent
      collisionPadding={collisionPadding}
      className={cn(
        'max-w-(--radix-dropdown-menu-content-available-width) min-w-0 overflow-clip!',
        className,
      )}
      onPointerEnter={(e) => {
        cancelClose();
        onPointerEnter?.(e);
      }}
      onPointerLeave={(e) => {
        scheduleClose();
        onPointerLeave?.(e);
      }}
      {...props}
    >
      <BAScrollContainer
        scrollToSelector='[data-active="true"]'
        focusOnScroll
        className={cn(
          'max-h-(--radix-dropdown-menu-content-available-height)',
          scrollClassName,
        )}
      >
        {children}
      </BAScrollContainer>
    </DropdownMenuSubContent>
  );
}

export type BADropdownMenuSkeletonItemProps = ComponentProps<typeof Skeleton>;

export function BADropdownMenuSkeletonItem({
  className,
  ...props
}: BADropdownMenuSkeletonItemProps) {
  return (
    <div className="min-w-32 px-1 py-0.5">
      <Skeleton className={cn('h-7 w-full rounded-sm', className)} {...props} />
    </div>
  );
}

export type BADropdownMenuEmptyProps = ComponentProps<typeof DropdownMenuItem>;

export function BADropdownMenuEmpty({
  disabled = true,
  className,
  ...props
}: BADropdownMenuEmptyProps) {
  return (
    <DropdownMenuItem
      disabled={disabled}
      className={cn('text-muted-foreground', className)}
      {...props}
    />
  );
}
