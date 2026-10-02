'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarDays, Car, Check, CheckCircle2, Clock3, Home, Key, RefreshCw, XCircle } from 'lucide-react';
import { getApiBaseUrl } from '../../constants/api';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../components/LanguageProvider';
import NavMenu from '../components/NavMenu';
import ProfileMenu from '../components/ProfileMenu';
import MenuButton from '../components/MenuButton';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  setActiveNotificationUser,
  syncBookingNotifications,
  unreadNotificationsChangedEvent,
  type NotificationRecord,
} from '../components/notificationState';

export default function NotificationsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const API = getApiBaseUrl();
      const userResponse = await fetch(`${API}/api/auth/me`, { credentials: 'include', cache: 'no-store' });
      if (!userResponse.ok) throw new Error(t('notificationsLoadError'));
      const userData = await userResponse.json();
      const currentUserId = Number(userData?.user?.id);
      if (!Number.isInteger(currentUserId) || currentUserId <= 0) throw new Error(t('notificationsLoadError'));

      const [reservationsResponse, receivedResponse] = await Promise.all([
        fetch(`${API}/api/bookings`, { credentials: 'include', cache: 'no-store' }),
        fetch(`${API}/api/owner-bookings`, { credentials: 'include', cache: 'no-store' }),
      ]);
      if (!reservationsResponse.ok || !receivedResponse.ok) {
        throw new Error(t('notificationsLoadError'));
      }

      const [reservationsData, receivedData] = await Promise.all([
        reservationsResponse.json(),
        receivedResponse.json(),
      ]);
      const reservations = Array.isArray(reservationsData?.bookings)
        ? reservationsData.bookings
        : [];
      const receivedBookings = Array.isArray(receivedData?.bookings)
        ? receivedData.bookings
        : [];
      const records = syncBookingNotifications(currentUserId, {
        reservations,
        received: receivedBookings,
      });
      setActiveNotificationUser(currentUserId);
      setUserId(currentUserId);
      setNotifications(records);
    } catch (loadError) {
      console.error('Unable to load notifications:', loadError);
      setError(loadError instanceof Error ? loadError.message : t('notificationsLoadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (userId === null) return;
    const refreshNotifications = () => setNotifications(getNotifications(userId));
    window.addEventListener(unreadNotificationsChangedEvent(), refreshNotifications);
    window.addEventListener('storage', refreshNotifications);
    return () => {
      window.removeEventListener(unreadNotificationsChangedEvent(), refreshNotifications);
      window.removeEventListener('storage', refreshNotifications);
    };
  }, [userId]);

  const markAsRead = (notificationId: string) => {
    if (userId === null) return;
    markNotificationRead(userId, notificationId);
    setNotifications(getNotifications(userId));
  };

  const markAllAsRead = () => {
    if (userId === null) return;
    markAllNotificationsRead(userId);
    setNotifications(getNotifications(userId));
  };

  const statusLabel = (notification: NotificationRecord) => {
    if (notification.kind === 'start-reminder') return t('bookingStartsSoon');
    if (notification.kind === 'end-reminder') return t('bookingEndsSoon');
    if (notification.status === 'confirmed') {
      return notification.audience === 'received' ? t('notificationBookingConfirmed') : t('notificationReservationConfirmed');
    }
    if (notification.status === 'cancelled') return t('notificationBookingCancelled');
    if (notification.status === 'pending') {
      return notification.audience === 'received' ? t('notificationBookingRequest') : t('notificationReservationPending');
    }
    return notification.audience === 'received' ? t('notificationBookingUpdate') : t('notificationReservationUpdate');
  };

  const statusStyle = (status: string) => {
    if (status === 'confirmed') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
    if (status === 'cancelled') return 'bg-red-500/10 text-red-700 dark:text-red-300';
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
  };

  return (
    <div className="relative min-h-screen bg-[#dfeef0] px-0 py-0 text-[#121212] dark:bg-[#011b1b] dark:text-white">
      <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[#dfeef0] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[#011b1b]">
        <header className="z-10 flex items-center justify-between bg-[#dfeef0] px-5 pb-3 pt-5 dark:bg-[#011b1b]">
          <MenuButton
            onClick={() => setIsMenuOpen(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          />
          <h1 className="text-[24px] font-bold tracking-tight">{t('notifications')}</h1>
          <ProfileMenu />
        </header>

        <NavMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6">
          <div className="mx-auto max-w-md">
            <section className="rounded-[28px] border border-black/5 bg-white/60 p-5 shadow-lg dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf]">
                  <Bell className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-bold">{t('notifications')}</h2>
                  <p className="mt-1 text-sm leading-6 text-[#42565d] dark:text-[#9db0b6]">
                    {t('notificationsIntro')}
                  </p>
                </div>
              </div>
            </section>

            {isLoading ? (
              <p role="status" className="py-12 text-center text-sm text-[#42565d] dark:text-[#9db0b6]">
                {t('notificationsLoading')}
              </p>
            ) : error ? (
              <div className="mt-5 rounded-3xl border border-red-500/20 bg-red-500/5 p-5 text-center">
                <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadNotifications()}
                  className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0f4c81] px-4 py-2.5 text-sm font-bold text-white dark:bg-[#2dd4bf] dark:text-[#011b1b]"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t('notificationsTryAgain')}
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <p role="status" className="mt-5 rounded-3xl border border-dashed border-black/10 bg-white/30 px-5 py-10 text-center text-sm font-semibold text-[#42565d] dark:border-white/10 dark:bg-white/5 dark:text-[#9db0b6]">
                {t('notificationsEmpty')}
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {notifications.some((notification) => !notification.read) && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#0f4c81] transition hover:bg-[#0f4c81]/5 dark:text-[#2dd4bf] dark:hover:bg-white/5"
                    >
                      <Check className="h-4 w-4" />
                      {t('notificationsMarkAllRead')}
                    </button>
                  </div>
                )}
                {notifications.map((notification) => {
                  const isReminder = notification.kind !== 'status';
                  const Icon = isReminder
                    ? Clock3
                    : notification.status === 'confirmed'
                      ? CheckCircle2
                      : notification.status === 'cancelled'
                        ? XCircle
                        : notification.audience === 'received'
                          ? Bell
                          : Clock3;
                  const destination = notification.audience === 'received' ? ROUTES.MANAGE_SPOT : ROUTES.RENT;
                  const startsAt = new Date(notification.startDate);
                  const createdAt = new Date(notification.createdAt);

                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 rounded-3xl border p-4 shadow-sm transition ${
                        notification.read
                          ? 'border-black/5 bg-white/60 dark:border-white/10 dark:bg-white/5'
                          : 'border-red-500/25 bg-white/80 ring-1 ring-red-500/10 dark:border-red-400/20 dark:bg-white/10'
                      }`}
                    >
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${statusStyle(notification.status)}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          markAsRead(notification.id);
                          router.push(destination);
                        }}
                        className="min-w-0 flex-1 cursor-pointer text-left"
                      >
                        <span className="flex items-center gap-2 font-bold">
                          {!notification.read && <span aria-label={t('notificationUnread')} className="h-2 w-2 shrink-0 rounded-full bg-red-600" />}
                          {statusLabel(notification)}
                        </span>
                        {notification.spotTitle && (
                          <span className="mt-1 block truncate text-sm font-medium text-[#121212] dark:text-white">
                            {notification.spotTitle}
                          </span>
                        )}
                        {notification.spotAddress && (
                          <span className="mt-0.5 block truncate text-xs text-[#42565d] dark:text-[#9db0b6]">
                            {notification.spotAddress}
                          </span>
                        )}
                        {Number.isFinite(startsAt.getTime()) && (
                          <span className="mt-2 flex items-center gap-1.5 text-xs text-[#42565d] dark:text-[#9db0b6]">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {startsAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        )}
                        {Number.isFinite(createdAt.getTime()) && (
                          <span className="mt-1 block text-[11px] text-[#6b7c82] dark:text-[#84989f]">
                            {t('notificationReceivedAt')}: {createdAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        )}
                      </button>
                      {!notification.read && (
                        <button
                          type="button"
                          aria-label={t('notificationMarkRead')}
                          title={t('notificationMarkRead')}
                          onClick={() => markAsRead(notification.id)}
                          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#0f4c81] transition hover:bg-[#0f4c81]/10 dark:text-[#2dd4bf] dark:hover:bg-white/10"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex w-screen items-center justify-around border-t border-black/5 bg-[#dfeef0] pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#011b1b]"
      >
        <button type="button" aria-label={t('searchSpotOffers')} onClick={() => router.push(ROUTES.RENT)} className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400">
          <Key className="h-6 w-6 -rotate-45" strokeWidth={2} />
        </button>
        <button type="button" aria-label={t('parkShare')} onClick={() => router.push(ROUTES.HOME)} className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400">
          <Home className="h-6 w-6" strokeWidth={2} />
        </button>
        <button type="button" aria-label={t('manageYourCars')} onClick={() => router.push(ROUTES.MANAGE_CAR)} className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400">
          <Car className="h-6 w-6" strokeWidth={2} />
        </button>
      </nav>
    </div>
  );
}
