'use client';

import { useEffect } from 'react';
import { getApiBaseUrl } from '../../constants/api';
import { useLanguage } from './LanguageProvider';

type Booking = {
  id: number;
  start_date: string;
  end_date: string;
  status: string;
  spot?: { title?: string } | null;
};

const REMINDER_LEAD_MS = 15 * 60 * 1000;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const MAX_TIMEOUT_MS = 2_147_000_000;
const REMINDER_STORAGE_PREFIX = 'parkshare-booking-reminder';
const NOTIFICATIONS_ENABLED_KEY = 'parkshare-push-notifications';

export default function BookingReminderNotifications() {
  const { t } = useLanguage();

  useEffect(() => {
    if (!('Notification' in window)) return;

    let isActive = true;
    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const scheduleReminder = (
      booking: Booking,
      event: 'start' | 'end',
      eventTime: number,
      now: number,
    ) => {
      const reminderTime = event === 'end'
        ? Math.max(eventTime - REMINDER_LEAD_MS, new Date(booking.start_date).getTime())
        : eventTime - REMINDER_LEAD_MS;
      if (!Number.isFinite(reminderTime) || reminderTime >= eventTime) return;

      const reminderId = `${booking.id}:${event}`;
      const storageKey = `${REMINDER_STORAGE_PREFIX}:${reminderId}`;
      if (window.localStorage.getItem(storageKey) || timers.has(reminderId)) return;

      const remaining = Math.max(0, reminderTime - now);
      const timer = setTimeout(async () => {
        timers.delete(reminderId);
        if (Date.now() < reminderTime) {
          scheduleReminder(booking, event, eventTime, Date.now());
          return;
        }
        if (
          !isActive
          || Date.now() >= eventTime
          || window.localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== 'true'
          || Notification.permission !== 'granted'
        ) return;

        const title = t(event === 'start' ? 'bookingStartsSoon' : 'bookingEndsSoon');
        const body = booking.spot?.title || t('notifications');
        try {
          const options = {
            body,
            icon: '/icons/icon-192.png',
            tag: `booking-reminder-${reminderId}`,
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
          window.localStorage.setItem(storageKey, 'sent');
        } catch (error) {
          console.error('Unable to show booking reminder notification:', error);
        }
      }, Math.min(remaining, MAX_TIMEOUT_MS));
      timers.set(reminderId, timer);
    };

    const loadBookings = async () => {
      if (window.localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== 'true') return;

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/bookings`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!isActive || !response.ok) return;
        const data = await response.json();
        const bookings: Booking[] = Array.isArray(data?.bookings) ? data.bookings : [];
        const now = Date.now();

        for (const booking of bookings) {
          if (booking.status.toLowerCase() !== 'confirmed') continue;
          const startTime = new Date(booking.start_date).getTime();
          const endTime = new Date(booking.end_date).getTime();
          if (Number.isFinite(startTime) && startTime > now) {
            scheduleReminder(booking, 'start', startTime, now);
          }
          if (Number.isFinite(endTime) && endTime > now) {
            scheduleReminder(booking, 'end', endTime, now);
          }
        }
      } catch (error) {
        console.error('Unable to load bookings for reminders:', error);
      }
    };

    void loadBookings();
    const refreshTimer = window.setInterval(() => void loadBookings(), REFRESH_INTERVAL_MS);
    const handleFocus = () => void loadBookings();
    const handlePreferenceChange = () => void loadBookings();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('parkshare-notification-preferences-updated', handlePreferenceChange);

    return () => {
      isActive = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('parkshare-notification-preferences-updated', handlePreferenceChange);
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [t]);

  return null;
}
