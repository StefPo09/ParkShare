'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { Menu, Search, ChevronRight, Car, Home, Key } from 'lucide-react';
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

type DashboardTimer = {
  title: string;
  targetTime: number;
  status: string;
};

export default function HomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

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

  useEffect(() => {
    const fetchDashboardTimers = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || '';
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
        setTimerError(null);
      } catch (error) {
        console.warn('Unable to load booking timers:', error);
        setTimerError('No booking timer data available right now.');
      }
    };

    fetchDashboardTimers();
  }, []);

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

                {dashboardTimers.reservation ? (
                    <InteractiveTimer
                        title={dashboardTimers.reservation.title}
                        variant="reservation"
                        targetTime={dashboardTimers.reservation.targetTime}
                        defaultMinutes={15}
                    />
                ) : (
                    <div className="rounded-[28px] border border-dashed border-black/10 bg-white/20 p-4 text-sm font-medium text-[#42565d] dark:border-white/10 dark:text-[#dfeef0]">
                      No upcoming reservation.
                    </div>
                )}

                {dashboardTimers.rental ? (
                    <InteractiveTimer
                        title={dashboardTimers.rental.title}
                        variant="rental"
                        targetTime={dashboardTimers.rental.targetTime}
                        defaultMinutes={45}
                    />
                ) : (
                    <div className="rounded-[28px] border border-dashed border-black/10 bg-white/20 p-4 text-sm font-medium text-[#42565d] dark:border-white/10 dark:text-[#dfeef0]">
                      No active rental session.
                    </div>
                )}
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
