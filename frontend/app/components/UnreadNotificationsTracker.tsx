'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getApiBaseUrl } from '../../constants/api';
import { ROUTES } from '../../constants/routes';
import {
  getKnownNotifications,
  getUnreadNotificationIds,
  markNotificationsRead,
  saveNotificationState,
} from './notificationState';

type Booking = {
  id: number;
  status: string;
};

type NotificationBatch = {
  reservations: Booking[];
  received: Booking[];
};

const REFRESH_INTERVAL_MS = 60_000;
const ACTIVE_USER_STORAGE_KEY = 'parkshare-notification-user-id';

function toNotificationStatuses(batch: NotificationBatch): Record<string, string> {
  return Object.fromEntries([
    ...batch.reservations.map((booking) => [`reservation-${booking.id}`, booking.status.toLowerCase()]),
    ...batch.received.map((booking) => [`received-${booking.id}`, booking.status.toLowerCase()]),
  ]);
}

export default function UnreadNotificationsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let isActive = true;
    let requestInFlight = false;

    const loadNotifications = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const api = getApiBaseUrl();
        const userResponse = await fetch(`${api}/api/auth/me`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!isActive) return;
        if (!userResponse.ok) {
          window.localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
          window.dispatchEvent(new Event('parkshare-unread-notifications-changed'));
          return;
        }

        const userData = await userResponse.json();
        const userId = Number(userData?.user?.id);
        if (!Number.isInteger(userId) || userId <= 0) return;
        window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, String(userId));

        const [reservationsResponse, receivedResponse] = await Promise.all([
          fetch(`${api}/api/bookings`, { credentials: 'include', cache: 'no-store' }),
          fetch(`${api}/api/owner-bookings`, { credentials: 'include', cache: 'no-store' }),
        ]);
        if (!isActive || !reservationsResponse.ok || !receivedResponse.ok) return;

        const [reservationsData, receivedData] = await Promise.all([
          reservationsResponse.json(),
          receivedResponse.json(),
        ]);
        const current = toNotificationStatuses({
          reservations: Array.isArray(reservationsData?.bookings) ? reservationsData.bookings : [],
          received: Array.isArray(receivedData?.bookings) ? receivedData.bookings : [],
        });
        const known = getKnownNotifications(userId);

        if (!known) {
          saveNotificationState(userId, current, []);
          return;
        }

        const unread = new Set(getUnreadNotificationIds(userId).filter((id) => id in current));
        for (const [id, status] of Object.entries(current)) {
          if (known[id] === undefined || known[id] !== status) {
            if (pathname === ROUTES.NOTIFICATIONS) unread.delete(id);
            else unread.add(id);
          }
        }

        saveNotificationState(
          userId,
          current,
          pathname === ROUTES.NOTIFICATIONS ? [] : [...unread],
        );
      } catch (error) {
        console.error('Unable to check for unread notifications:', error);
      } finally {
        requestInFlight = false;
      }
    };

    void loadNotifications();
    const refreshTimer = window.setInterval(() => void loadNotifications(), REFRESH_INTERVAL_MS);
    const handleFocus = () => void loadNotifications();
    window.addEventListener('focus', handleFocus);

    return () => {
      isActive = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname !== ROUTES.NOTIFICATIONS) return;
    const userId = Number(window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY));
    if (Number.isInteger(userId) && userId > 0) markNotificationsRead(userId);
  }, [pathname]);

  return null;
}
