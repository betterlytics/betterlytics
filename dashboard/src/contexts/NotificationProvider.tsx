'use client';

import { cn } from '@/lib/utils';
import React, { useCallback, useState, type Dispatch } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

type Level = 'info' | 'warning' | 'error' | 'success';

type Notification = {
  id: string;
  level: Level;
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  dismissible?: boolean;
  custom?: React.ReactNode;
  scope?: 'route' | 'global';
  sticky?: boolean;
};

type NotificationsContextProps = {
  addNotification: Dispatch<Notification>;
  removeNotification: Dispatch<string>;
};

const NotificationsContext = React.createContext<NotificationsContextProps>({
  addNotification: () => {},
  removeNotification: () => {},
});

type NotificationsContextProviderProps = {
  children: React.ReactNode;
};

export function NotificationProvider({ children }: NotificationsContextProviderProps) {
  const pathname = usePathname();
  const routeKey = pathname ?? '';
  type NotificationWithMeta = Notification & { __route?: string };
  const [notifications, setNotifications] = useState<NotificationWithMeta[]>([]);

  const addNotification = useCallback(
    (notification: Notification) => {
      setNotifications((prev) => {
        const existingIndex = prev.findIndex((noti) => noti.id === notification.id);
        const withMeta: NotificationWithMeta =
          notification.scope === 'global' ? { ...notification } : { ...notification, __route: routeKey };

        if (existingIndex !== -1) {
          const next = [...prev];
          next[existingIndex] = withMeta;
          return next;
        }
        return [...prev, withMeta];
      });
    },
    [routeKey],
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const removedDuplicate = prev.filter((noti) => noti.id !== id);
      return removedDuplicate;
    });
  }, []);

  const nowVisible = notifications
    .filter((n) => n.scope === 'global' || n.__route === routeKey)
    .sort((a, b) => Number(Boolean(b.sticky)) - Number(Boolean(a.sticky)));

  return (
    <NotificationsContext.Provider value={{ addNotification, removeNotification }}>
      <div className='h-full w-full'>
        <div className={cn('w-full space-y-0 overflow-hidden p-0', nowVisible.length && 'border-b')}>
          {nowVisible.map((notification) => (
            <NotificationBanner key={notification.id} notification={notification} notifications={nowVisible} />
          ))}
        </div>
        {children}
      </div>
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  return React.useContext(NotificationsContext);
}

type NotificationBannerProps = {
  notification: Notification;
  notifications: Notification[];
};

export function NotificationBanner({ notification, notifications }: NotificationBannerProps) {
  const { removeNotification } = useNotificationsContext();
  const { id, level, title, description, action, custom, dismissible } = notification;

  if (custom) return <>{custom}</>;

  const bgClasses = cn('box-border w-full px-3 py-1.5 text-xs sm:px-6 border-b', {
    'bg-primary text-white': level === 'info',
    'bg-amber-500 text-black': level === 'warning',
    'bg-red-500 text-black': level === 'error',
    'bg-green-500 text-black': level === 'success',
    'border-b': notifications.length > 0,
  });

  return (
    <div className={bgClasses}>
      <div className='sm:hidden'>
        <MobileBannerContent
          id={id}
          title={title}
          description={description}
          action={action}
          dismissible={dismissible}
          onDismiss={() => removeNotification(id)}
        />
      </div>

      <div className='hidden sm:block'>
        <DesktopBannerContent
          title={title}
          description={description}
          action={action}
          dismissible={dismissible}
          onDismiss={() => removeNotification(id)}
        />
      </div>
    </div>
  );
}

type BannerContentBaseProps = {
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  dismissible?: boolean;
  onDismiss: () => void;
};

type MobileBannerContentProps = BannerContentBaseProps & { id: string };

function MobileBannerContent({
  id,
  title,
  description,
  action,
  dismissible,
  onDismiss,
}: MobileBannerContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className='flex w-full items-center gap-2'>
        <div className='min-w-0 flex-1'>
          {title && (
            <button
              onClick={() => setIsExpanded((v) => !v)}
              className='flex h-auto w-full items-center gap-1 p-0 text-left text-xs leading-snug font-semibold text-current'
              aria-expanded={isExpanded}
              aria-controls={`noti-desc-${id}`}
              aria-label={isExpanded ? 'Hide details' : 'Show details'}
            >
              <span className='truncate'>{title}</span>
              {description && (
                <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', isExpanded && 'rotate-180')} />
              )}
            </button>
          )}
        </div>

        {action && (
          <div className='h-7 shrink-0 [&>*]:h-7 [&>*]:min-h-0 [&>*]:px-2 [&>*]:py-0 [&>*]:text-xs [&>*]:leading-none'>
            {action}
          </div>
        )}

        {dismissible && (
          <Button
            variant='ghost'
            size='icon'
            onClick={onDismiss}
            className='hover:bg-accent/20 dark:hover:bg-accent/20 h-7 w-7 cursor-pointer rounded-md text-current hover:text-current'
            aria-label='Dismiss notification'
          >
            ✕
          </Button>
        )}
      </div>

      {description && (
        <div
          id={`noti-desc-${id}`}
          className={cn(
            'mt-1 text-left text-xs leading-snug transition-all duration-200',
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 overflow-hidden opacity-0',
          )}
          onClick={() => setIsExpanded((v) => !v)}
        >
          <span>{description}</span>
        </div>
      )}
    </>
  );
}

function DesktopBannerContent({ title, description, action, dismissible, onDismiss }: BannerContentBaseProps) {
  return (
    <div className='flex w-full items-center gap-2'>
      <div className='min-w-0 flex-1'>
        <div className='flex min-w-0 items-center'>
          {title && <span className='text-xs leading-snug font-semibold'>{title}</span>}
          {description && <span className='text-xs leading-snug'> {description}</span>}
        </div>
      </div>
      {action && (
        <div className='h-7 shrink-0 [&>*]:h-7 [&>*]:min-h-0 [&>*]:px-2 [&>*]:py-0 [&>*]:text-xs [&>*]:leading-none'>
          {action}
        </div>
      )}
      {dismissible && (
        <Button
          variant='ghost'
          size='icon'
          onClick={onDismiss}
          className='hover:bg-accent/20 dark:hover:bg-accent/20 h-7 w-7 cursor-pointer rounded-md text-current hover:text-current'
          aria-label='Dismiss notification'
        >
          ✕
        </Button>
      )}
    </div>
  );
}
