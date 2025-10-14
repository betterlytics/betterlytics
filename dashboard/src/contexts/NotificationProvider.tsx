'use client';

import { cn } from '@/lib/utils';
import React, { useCallback, useState, type Dispatch } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
function NotificationBanner({ notification, notifications }: NotificationBannerProps) {
  const { removeNotification } = useNotificationsContext();
  const { id, level, title, description, action, custom, dismissible } = notification;

  if (custom) return <>{custom}</>;

  return (
    <div
      className={cn('box-border flex w-full items-center gap-2 px-3 py-1.5 text-xs sm:px-6', {
        'bg-primary text-white': level === 'info',
        'bg-amber-500 text-black': level === 'warning',
        'bg-red-500 text-black': level === 'error',
        'bg-green-500 text-black': level === 'success',
        'border-b': notifications.length > 0,
      })}
    >
      <div className='min-w-0 flex-1 truncate'>
        {title && <span className='font-semibold'>{title}</span>}
        {description && <span> {description}</span>}
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
          onClick={() => removeNotification(id)}
          className='hover:bg-accent/20 dark:hover:bg-accent/20 h-7 w-7 cursor-pointer rounded-md text-current hover:text-current'
          aria-label='Dismiss notification'
        >
          ✕
        </Button>
      )}
    </div>
  );
}
