'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { getApiBaseUrl } from '../../constants/api';
import { Menu, Search, ChevronRight, Car, Home, Key, Calendar as CalendarIcon, Clock, MapPin, Sparkles } from 'lucide-react';
import ProfileMenu from '../components/ProfileMenu';
import NavMenu from '../components/NavMenu';
import { useLanguage } from '../components/LanguageProvider';
import InteractiveTimer from '../components/InteractiveTimer';

const parkingListings = [
  {
    id: 1,
    title: 'Seller name 1',
    name: 'NAME 1',
    address: 'Address 1',
    price: '$1099',
    image:
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    title: 'Seller name 2',
    name: 'NAME 2',
    address: 'Address 2',
    price: '$501',
    image:
        'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    title: 'Seller name 3',
    name: 'NAME 3',
    address: 'Address 3',
    price: '$99',
    image:
        'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80',
  },
];

type SpotInfo = {
  id: number;
  title: string;
  address: string;
  description?: string;
  start_hour?: string;
  end_hour?: string;
  price_per_day: number;
  price_currency: string;
  image_url?: string | null;
};

type BookingItem = {
  id: number;
  spot_id: number;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  spot?: SpotInfo | null;
};

type DashboardTimer = {
  id?: number;
  title: string;
  address?: string;
  targetTime: number;
  startTime?: number;
  status: string;
  is_overtime?: boolean;
  overtime_seconds?: number;
  hourly_rate?: number;
  extra_cost?: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
  spot?: SpotInfo | null;
};

function formatUpcomingDate(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isSameDay =
    start.getFullYear() === today.getFullYear() &&
    start.getMonth() === today.getMonth() &&
    start.getDate() === today.getDate();

  const isTomorrow =
    start.getFullYear() === tomorrow.getFullYear() &&
    start.getMonth() === tomorrow.getMonth() &&
    start.getDate() === tomorrow.getDate();

  const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  if (isSameDay) {
    return `Today • ${timeStr}`;
  } else if (isTomorrow) {
    return `Tomorrow • ${timeStr}`;
  } else {
    const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${dateStr} • ${timeStr}`;
  }
}

function formatTimeUntil(startIso: string, nowMs: number) {
  const diffMs = new Date(startIso).getTime() - nowMs;
  if (diffMs <= 0) return 'Starting now';
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `Starts in ${minutes}m`;
  } else if (hours < 24) {
    return `Starts in ${hours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  } else {
    const days = Math.floor(hours / 24);
    return `Starts in ${days}d ${hours % 24}h`;
  }
}

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [dashboardTimers, setDashboardTimers] = useState<{
    reservation: DashboardTimer | null;
    rental: DashboardTimer | null;
  }>({
    reservation: null,
    rental: null,
  });
  const [timerError, setTimerError] = useState<string | null>(null);
  const [isAnimatingSearch, setIsAnimatingSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Live timer tick every 1 second
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const API = getApiBaseUrl();
      const response = await fetch(`${API}/api/dashboard/timers`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setTimerError('Log in to view your booking timers.');
          return;
        }

        throw new Error('Failed to load timers');
      }

      const data = await response.json();
      setDashboardTimers({
        reservation: data?.reservation ?? null,
        rental: data?.rental ?? null,
      });
      if (Array.isArray(data?.bookings)) {
        setBookings(data.bookings);
      }
      setTimerError(null);
    } catch (error) {
      console.warn('Unable to load booking timers:', error);
      setTimerError('No booking timer data available right now.');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Split bookings by active/overtime vs upcoming based on live `now`
  const { activeOrOvertimeList, upcomingList } = useMemo(() => {
    const activeList: BookingItem[] = [];
    const upcoming: BookingItem[] = [];

    bookings.forEach((b) => {
      if (b.status === 'cancelled') return;
      const startMs = new Date(b.start_date).getTime();
      if (startMs <= now) {
        activeList.push(b);
      } else {
        upcoming.push(b);
      }
    });

    // If no explicit bookings list but dashboardTimers provided
    if (activeList.length === 0 && dashboardTimers.rental && dashboardTimers.rental.start_date && dashboardTimers.rental.end_date) {
      activeList.push({
        id: dashboardTimers.rental.id || 1,
        spot_id: dashboardTimers.rental.spot?.id || 1,
        start_date: dashboardTimers.rental.start_date,
        end_date: dashboardTimers.rental.end_date,
        total_price: 0,
        status: dashboardTimers.rental.status,
        spot: dashboardTimers.rental.spot,
      });
    }

    if (upcoming.length === 0 && dashboardTimers.reservation && dashboardTimers.reservation.start_date && dashboardTimers.reservation.end_date) {
      upcoming.push({
        id: dashboardTimers.reservation.id || 2,
        spot_id: dashboardTimers.reservation.spot?.id || 2,
        start_date: dashboardTimers.reservation.start_date,
        end_date: dashboardTimers.reservation.end_date,
        total_price: 0,
        status: 'upcoming',
        spot: dashboardTimers.reservation.spot,
      });
    }

    // Sort active: most recent first
    activeList.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    // Sort upcoming: soonest first
    upcoming.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    return { activeOrOvertimeList: activeList, upcomingList: upcoming };
  }, [bookings, dashboardTimers, now]);

  const triggerSearchTransition = (queryValue: string) => {
    if (isAnimatingSearch) return;
    setIsAnimatingSearch(true);
    setActiveTab('key');

    setTimeout(() => {
      router.push(`${ROUTES.RENT}?search=${encodeURIComponent(queryValue)}`);
    }, 280);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    triggerSearchTransition(searchValue);
  };

  return (
      <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative overflow-hidden">
        <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[#011b1b] dark:text-white">

          {/* Header Navigation */}
          <header className="flex items-center justify-between px-5 pt-5 pb-3 z-10 bg-[#dfeef0] dark:bg-[#011b1b]">
            <button
                aria-label="Open menu"
                onClick={() => setIsMenuOpen(true)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
            >
              <Menu className="h-6 w-6" strokeWidth={2.2} />
            </button>
            <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
              {t('parkShare')}
            </h1>

            <ProfileMenu />
          </header>

          <NavMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

          <main className="relative flex-1 overflow-y-auto px-4 pb-24 pt-2">
            <div className="space-y-4">
              <div className="space-y-4">
                {timerError ? (
                    <div className="rounded-[28px] border border-dashed border-black/10 bg-white/20 p-4 text-sm font-medium text-[#42565d] dark:border-white/10 dark:text-[#dfeef0]">
                      {timerError}
                    </div>
                ) : null}

                {/* Active or Overtime Parking Sessions */}
                {activeOrOvertimeList.length > 0 ? (
                    activeOrOvertimeList.map((booking) => {
                      const startMs = new Date(booking.start_date).getTime();
                      const endMs = new Date(booking.end_date).getTime();
                      const isOvertime = now > endMs;

                      let hourlyRate = booking.spot?.price_per_day ?? 4.0;
                      if (booking.spot?.start_hour && booking.spot?.end_hour) {
                        try {
                          const sh = parseInt(booking.spot.start_hour.split(':')[0], 10);
                          const eh = parseInt(booking.spot.end_hour.split(':')[0], 10);
                          const opHours = Math.max(1, eh - sh);
                          hourlyRate = Math.round((booking.spot.price_per_day / opHours) * 100) / 100;
                        } catch {
                          hourlyRate = Math.round((booking.spot.price_per_day / 24) * 100) / 100;
                        }
                      }

                      const leaveByTime = new Date(booking.end_date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                          <InteractiveTimer
                              key={booking.id}
                              title={isOvertime ? 'Overtime Warning' : (booking.spot?.title || 'Active Parking Session')}
                              variant={isOvertime ? 'overtime' : 'rental'}
                              targetTime={endMs}
                              startTime={startMs}
                              spotAddress={booking.spot?.address}
                              hourlyRate={hourlyRate}
                              currency={booking.spot?.price_currency || 'RON'}
                              leaveByTime={leaveByTime}
                          />
                      );
                    })
                ) : null}

                {/* Upcoming Events / Reservations */}
                {upcomingList.length > 0 ? (
                    upcomingList.map((booking) => (
                        <div
                            key={booking.id}
                            className="rounded-[28px] border border-black/5 bg-white/30 p-4 shadow-[0_18px_30px_rgba(15,32,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf]">
                                <CalendarIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="text-[17px] font-bold tracking-tight sm:text-[20px] text-[#121212] dark:text-white block leading-tight">
                                  Upcoming Event
                                </span>
                                <span className="text-[11px] font-medium text-[#42565d] dark:text-[#dfeef0]">
                                  Reservation Confirmed
                                </span>
                              </div>
                            </div>

                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0f4c81] dark:bg-blue-500/20 dark:text-blue-200">
                              {formatTimeUntil(booking.start_date, now)}
                            </span>
                          </div>

                          <div className="rounded-2xl bg-[#dfeef0]/70 dark:bg-[#0b1c2c]/70 p-3.5 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-[#121212] dark:text-white">
                                  {booking.spot?.title || 'Reserved Parking Spot'}
                                </h4>
                                {booking.spot?.address && (
                                    <p className="text-xs text-[#42565d] dark:text-[#dfeef0] flex items-center gap-1 mt-0.5">
                                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                                      <span className="truncate max-w-[280px]">{booking.spot.address}</span>
                                    </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 border-t border-black/5 dark:border-white/10 pt-2 text-xs font-semibold text-[#121212] dark:text-white">
                              <Clock className="h-3.5 w-3.5 text-[#0f4c81] dark:text-[#2dd4bf]" />
                              <span>{formatUpcomingDate(booking.start_date, booking.end_date)}</span>
                            </div>
                          </div>
                        </div>
                    ))
                ) : null}

                {/* Empty State when no active and no upcoming bookings */}
                {!timerError && activeOrOvertimeList.length === 0 && upcomingList.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-black/10 bg-white/20 p-5 text-center dark:border-white/10 dark:bg-white/5">
                      <p className="text-sm font-semibold text-[#121212] dark:text-white">
                        No active parking session or upcoming reservations.
                      </p>
                      <p className="mt-1 text-xs text-[#42565d] dark:text-[#dfeef0]">
                        Find and reserve a parking spot nearby anytime.
                      </p>
                    </div>
                ) : null}
              </div>

              <form
                  onSubmit={handleSearchSubmit}
                  onClick={() => triggerSearchTransition(searchValue)}
                  className={`flex items-center gap-3 rounded-[28px] border border-black/5 bg-white/40 p-2 pl-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,box-shadow] ${
                    isAnimatingSearch
                      ? '-translate-y-[228px] z-50 shadow-md bg-white/60 dark:bg-white/20'
                      : 'translate-y-0 shadow-sm'
                  }`}
              >
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchValue}
                    onFocus={() => triggerSearchTransition(searchValue)}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={t('searchSpotOffers')}
                    className="flex-1 border-0 bg-transparent text-[18px] font-medium tracking-[-0.04em] text-[#121212] outline-none placeholder:text-[#42565d]/80 dark:text-white dark:placeholder:text-[#dfeef0]/80 cursor-pointer"
                />
                <button
                    type="submit"
                    aria-label={t('searchSpotOffers')}
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[20px] bg-[#0f4c81] shadow-md shadow-[#0f4c81]/15 transition hover:brightness-105 active:scale-95 dark:bg-[#9ad7db] dark:text-[#011b1b]"
                >
                  <Search className="h-5 w-5 text-white dark:text-[#011b1b]" strokeWidth={2.2} />
                </button>
              </form>

              {/* Featured Listings */}
              <div
                className={`rounded-[28px] border border-black/5 bg-white/20 p-3 shadow-[0_18px_30px_rgba(15,32,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity] ${
                  isAnimatingSearch
                    ? 'opacity-0 translate-y-6 scale-[0.97] pointer-events-none'
                    : 'opacity-100 translate-y-0 scale-100'
                }`}
              >
                <button
                    type="button"
                    onClick={() => router.push(ROUTES.RENT)}
                    className="mb-3 flex w-full cursor-pointer items-center justify-between text-left text-[#121212] dark:text-white"
                >
                  <span className="text-[22px] font-bold tracking-tight sm:text-[26px]">{t('spotsInYourCity')}</span>
                  <ChevronRight className="h-7 w-7 text-[#42565d] dark:text-[#dfeef0]" strokeWidth={2.5} />
                </button>

                <div className="grid grid-cols-3 gap-3">
                  {parkingListings.map((spot) => (
                      <button
                          key={spot.id}
                          type="button"
                          onClick={() => router.push(ROUTES.RENT)}
                          className="min-w-0 cursor-pointer overflow-hidden rounded-[22px] border border-black/5 bg-white/40 p-2 text-left shadow-sm transition hover:bg-white/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      >
                        <div className="relative h-28 overflow-hidden rounded-[18px] bg-[#d9d9d9]">
                          <Image
                              src={spot.image}
                              alt={spot.title}
                              fill
                              sizes="(max-width: 430px) 33vw, 130px"
                              className="object-cover"
                          />
                        </div>

                        <div className="mt-2 space-y-1">
                          <p className="text-[11px] font-medium text-[#42565d] dark:text-[#dfeef0]">{spot.title}</p>
                          <p className="text-[13px] font-bold text-[#121212] dark:text-white">{spot.name}</p>
                          <p className="text-[11px] font-medium text-[#42565d] dark:text-[#dfeef0]">{spot.address}</p>
                          <p className="text-[18px] font-bold text-[#121212] dark:text-white">{spot.price}</p>
                        </div>
                      </button>
                  ))}
                </div>
              </div>
            </div>
          </main>

          {/* Bottom Navigation */}
          <nav className="absolute bottom-0 left-0 right-0 flex justify-around items-center py-4 bg-[#dfeef0] dark:bg-[#011b1b] border-t border-black/5 dark:border-white/10 z-30">
            <button
                onClick={() => { setActiveTab('key'); router.push(ROUTES.RENT); }}
                className={`p-1.5 transition-all cursor-pointer rounded-full ${
  activeTab === 'key' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
}`}
            >
              <Key className="w-6 h-6 transform -rotate-45" strokeWidth={activeTab === 'key' ? 2.5 : 2} />
            </button>

            <button
                onClick={() => { setActiveTab('home'); router.push(ROUTES.HOME); }}
                className={`p-1.5 transition-all cursor-pointer rounded-full ${
  activeTab === 'home' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
}`}
            >
              <Home className="w-6 h-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            </button>

            <button
                onClick={() => { setActiveTab('car'); router.push(ROUTES.MANAGE_CAR); }}
                className={`p-1.5 transition-all cursor-pointer rounded-full ${
  activeTab === 'car' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
}`}
            >
              <Car className="w-6 h-6" strokeWidth={activeTab === 'car' ? 2.5 : 2} />
            </button>
          </nav>
        </div>
      </div>
  );
}
