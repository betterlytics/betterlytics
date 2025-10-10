'use client';

import { cn } from '@/lib/utils';
import React, { useCallback, useState, type Dispatch } from 'react';

type Level = 'info' | 'warning' | 'error';

type Notification = {
  id: string;
  level: Level;
  text: string;
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
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => {
      const removedDuplicate = prev.filter((noti) => noti.id !== notification.id);
      return [...removedDuplicate, notification];
    });
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const removedDuplicate = prev.filter((noti) => noti.id !== id);
      return removedDuplicate;
    });
  }, []);

  return (
    <NotificationsContext.Provider value={{ addNotification, removeNotification }}>
      <div className='h-full w-full'>
        <div className={cn('w-full space-y-0 overflow-hidden p-0', notifications.length && 'border-b')}>
          {notifications.map((notification) => (
            <NotificationBanner key={notification.id} notification={notification} />
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
};
function NotificationBanner({ notification }: NotificationBannerProps) {
  return (
    <div
      className={cn('flex w-full items-center px-2 py-1.5 text-xs font-medium sm:px-6', {
        'bg-primary': notification.level === 'info',
        'bg-amber-500 text-black': notification.level === 'warning',
        'bg-red-500 text-black': notification.level === 'error',
      })}
    >
      <span>{notification.text}</span>
    </div>
  );
}
