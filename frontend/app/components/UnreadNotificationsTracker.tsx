'use client';

import { useEffect } from 'react';
import { getApiBaseUrl } from '../../constants/api';
import { setActiveNotificationUser, syncBookingNotifications } from './notificationState';

const REFRESH_INTERVAL_MS = 60_000;

export default function UnreadNotificationsTracker() {
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
          setActiveNotificationUser(null);
          return;
        }

        const userData = await userResponse.json();
        const userId = Number(userData?.user?.id);
        if (!Number.isInteger(userId) || userId <= 0) return;
        setActiveNotificationUser(userId);

        const [reservationsResponse, receivedResponse] = await Promise.all([
          fetch(`${api}/api/bookings`, { credentials: 'include', cache: 'no-store' }),
          fetch(`${api}/api/owner-bookings`, { credentials: 'include', cache: 'no-store' }),
        ]);
        if (!isActive || !reservationsResponse.ok || !receivedResponse.ok) return;

        const [reservationsData, receivedData] = await Promise.all([
          reservationsResponse.json(),
          receivedResponse.json(),
        ]);
        syncBookingNotifications(userId, {
          reservations: Array.isArray(reservationsData?.bookings) ? reservationsData.bookings : [],
          received: Array.isArray(receivedData?.bookings) ? receivedData.bookings : [],
        });
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
  }, []);

  return null;
}
