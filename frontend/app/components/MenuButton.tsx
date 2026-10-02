'use client';

import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import {
  getActiveNotificationUser,
  getUnreadNotificationIds,
  unreadNotificationsChangedEvent,
} from './notificationState';

type MenuButtonProps = {
  onClick: () => void;
  className?: string;
};

export default function MenuButton({ onClick, className = '' }: MenuButtonProps) {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    const updateUnreadState = () => {
      const userId = getActiveNotificationUser();
      setHasUnreadNotifications(
        userId !== null && getUnreadNotificationIds(userId).length > 0,
      );
    };

    updateUnreadState();
    window.addEventListener(unreadNotificationsChangedEvent(), updateUnreadState);
    window.addEventListener('storage', updateUnreadState);
    return () => {
      window.removeEventListener(unreadNotificationsChangedEvent(), updateUnreadState);
      window.removeEventListener('storage', updateUnreadState);
    };
  }, []);

  return (
    <button
      type="button"
      aria-label={hasUnreadNotifications ? 'Open menu, unread notifications' : 'Open menu'}
      aria-haspopup="menu"
      onClick={onClick}
      className={`relative ${className}`}
    >
      <Menu className="h-6 w-6" strokeWidth={2.2} />
      {hasUnreadNotifications && (
        <span
          aria-label="Unread notifications"
          className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#dfeef0] dark:ring-[#011b1b]"
        />
      )}
    </button>
  );
}
