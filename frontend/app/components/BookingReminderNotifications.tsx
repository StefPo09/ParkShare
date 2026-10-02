'use client';

import { useEffect } from 'react';
import { getApiBaseUrl } from '../../constants/api';
import { useLanguage } from './LanguageProvider';
import {
  addNotification,
  getActiveNotificationUser,
  hasNotification,
  setActiveNotificationUser,
  type NotificationBooking,
} from './notificationState';

const REMINDER_LEAD_MS = 15 * 60 * 1000;
const REFRESH_INTERVAL_MS = 60 * 1000;
const MAX_TIMEOUT_MS = 2_147_000_000;
const NOTIFICATIONS_ENABLED_KEY = 'parkshare-push-notifications';

type ScheduledTimer = {
  timeout: ReturnType<typeof setTimeout>;
  reminderTime: number;
  eventTime: number;
};

export default function BookingReminderNotifications() {
  const { t } = useLanguage();

  useEffect(() => {
    let isActive = true;
    let scheduledUserId: number | null = null;
    const timers = new Map<string, ScheduledTimer>();

    const scheduleReminder = (
      userId: number,
      booking: NotificationBooking,
      event: 'start' | 'end',
      eventTime: number,
      now: number,
    ) => {
      const reminderTime = event === 'end'
        ? Math.max(eventTime - REMINDER_LEAD_MS, new Date(booking.start_date).getTime())
        : eventTime - REMINDER_LEAD_MS;
      if (!Number.isFinite(reminderTime) || reminderTime >= eventTime) return;

      const notificationId = `reservation-${booking.id}-reminder-${event}`;
      const existingTimer = timers.get(notificationId);
      if (hasNotification(userId, notificationId)) {
        if (existingTimer) clearTimeout(existingTimer.timeout);
        timers.delete(notificationId);
        return;
      }
      if (
        existingTimer
        && existingTimer.reminderTime === reminderTime
        && existingTimer.eventTime === eventTime
      ) return;
      if (existingTimer) clearTimeout(existingTimer.timeout);

      const timeout = setTimeout(async () => {
        timers.delete(notificationId);
        const currentTime = Date.now();
        if (currentTime < reminderTime) {
          scheduleReminder(userId, booking, event, eventTime, currentTime);
          return;
        }
        if (
          !isActive
          || currentTime >= eventTime
          || getActiveNotificationUser() !== userId
        ) return;

        const notification = {
          id: notificationId,
          bookingId: booking.id,
          audience: 'reservation' as const,
          kind: event === 'start' ? 'start-reminder' as const : 'end-reminder' as const,
          status: booking.status.toLowerCase(),
          spotTitle: booking.spot?.title || '',
          spotAddress: booking.spot?.address || '',
          startDate: booking.start_date,
          createdAt: currentTime,
          read: false,
        };
        addNotification(userId, notification);

        if (
          window.localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== 'true'
          || !('Notification' in window)
          || Notification.permission !== 'granted'
        ) return;

        const title = t(event === 'start' ? 'bookingStartsSoon' : 'bookingEndsSoon');
        try {
          const options = {
            body: booking.spot?.title || t('notifications'),
            icon: '/icons/icon-192.png',
            tag: `booking-reminder-${notificationId}`,
            data: { url: '/NotificationsPage' },
          };
          const registration = 'serviceWorker' in navigator
            ? await navigator.serviceWorker.getRegistration()
            : undefined;
          if (registration?.showNotification) {
            await registration.showNotification(title, options);
          } else {
            new Notification(title, options);
          }
        } catch (error) {
          console.error('Unable to show booking reminder notification:', error);
        }
      }, Math.min(Math.max(0, reminderTime - now), MAX_TIMEOUT_MS));

      timers.set(notificationId, { timeout, reminderTime, eventTime });
    };

    const loadBookings = async () => {
      try {
        const api = getApiBaseUrl();
        const userResponse = await fetch(`${api}/api/auth/me`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!isActive) return;
        if (!userResponse.ok) {
          timers.forEach((timer) => clearTimeout(timer.timeout));
          timers.clear();
          scheduledUserId = null;
          setActiveNotificationUser(null);
          return;
        }
        const userData = await userResponse.json();
        const userId = Number(userData?.user?.id);
        if (!Number.isInteger(userId) || userId <= 0) return;
        if (scheduledUserId !== null && scheduledUserId !== userId) {
          timers.forEach((timer) => clearTimeout(timer.timeout));
          timers.clear();
        }
        scheduledUserId = userId;
        setActiveNotificationUser(userId);

        const response = await fetch(`${api}/api/bookings`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!isActive || !response.ok) return;
        const data = await response.json();
        const bookings: NotificationBooking[] = Array.isArray(data?.bookings) ? data.bookings : [];
        const now = Date.now();
        const scheduledIds = new Set<string>();

        for (const booking of bookings) {
          if (booking.status.toLowerCase() !== 'confirmed') continue;
          const startTime = new Date(booking.start_date).getTime();
          const endTime = new Date(booking.end_date).getTime();
          if (Number.isFinite(startTime) && startTime > now) {
            scheduledIds.add(`reservation-${booking.id}-reminder-start`);
            scheduleReminder(userId, booking, 'start', startTime, now);
          }
          if (Number.isFinite(endTime) && endTime > now) {
            scheduledIds.add(`reservation-${booking.id}-reminder-end`);
            scheduleReminder(userId, booking, 'end', endTime, now);
          }
        }

        for (const [notificationId, timer] of timers) {
          if (!scheduledIds.has(notificationId)) {
            clearTimeout(timer.timeout);
            timers.delete(notificationId);
          }
        }
      } catch (error) {
        console.error('Unable to load bookings for reminders:', error);
      }
    };

    void loadBookings();
    const refreshTimer = window.setInterval(() => void loadBookings(), REFRESH_INTERVAL_MS);
    const handleFocus = () => void loadBookings();
    window.addEventListener('focus', handleFocus);

    return () => {
      isActive = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', handleFocus);
      timers.forEach((timer) => clearTimeout(timer.timeout));
    };
  }, [t]);

  return null;
}
