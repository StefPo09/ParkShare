'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { getApiBaseUrl } from '../../constants/api';
import { Search, ChevronRight, Car, Home, Key, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import ProfileMenu from '../components/ProfileMenu';
import NavMenu from '../components/NavMenu';
import { useLanguage } from '../components/LanguageProvider';
import InteractiveTimer from '../components/InteractiveTimer';
import MenuButton from '../components/MenuButton';

const DEFAULT_SPOT_IMAGE =
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80';
const MAX_FEATURED_DISTANCE_KM = 30;

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

type CitySpot = {
  id: number;
  city_id: number;
  city_name?: string;
  title: string;
  address: string;
  price_per_day: number;
  price_currency: string;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance_km?: number;
};

function distanceInKm(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(destination.lat - origin.lat);
  const longitudeDelta = toRadians(destination.lng - origin.lng);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(origin.lat)) *
      Math.cos(toRadians(destination.lat)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

type BookingItem = {
  id: number;
  spot_id: number;
  start_date: string;
  end_date: string;
  actual_end_date?: string | null;
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
  const [isPremium, setIsPremium] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [nearbySpots, setNearbySpots] = useState<CitySpot[]>([]);
  const [spotsLoading, setSpotsLoading] = useState(true);
  const [spotsError, setSpotsError] = useState<string | null>(null);
  const [userCity, setUserCity] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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

  useEffect(() => {
    let isCancelled = false;
    const API = getApiBaseUrl();

    const fetchCitySpots = async () => {
      try {
        const [spotsResponse, userResponse, citiesResponse] = await Promise.all([
          fetch(`${API}/api/spots?available_only=true`),
          fetch(`${API}/api/auth/me`, { credentials: 'include' }).catch(() => null),
          fetch(`${API}/api/cities`).catch(() => null),
        ]);

        if (!spotsResponse.ok) throw new Error(`Unable to load spots (${spotsResponse.status})`);

        const spotsData = await spotsResponse.json();
        const rawSpots = Array.isArray(spotsData?.spots) ? spotsData.spots : [];
        let profileCity = '';
        if (userResponse?.ok) {
          const userData = await userResponse.json();
          profileCity = String(userData?.user?.city || '').trim();
        }

        const citiesData = citiesResponse?.ok ? await citiesResponse.json() : null;
        const cityNames = new Map<number, string>(
          (Array.isArray(citiesData?.cities) ? citiesData.cities : []).map(
            (city: { id: number; name: string }) => [Number(city.id), city.name],
          ),
        );
        const spots: CitySpot[] = rawSpots.map((spot: CitySpot) => ({
          ...spot,
          id: Number(spot.id),
          city_id: Number(spot.city_id),
          city_name: spot.city_name || cityNames.get(Number(spot.city_id)) || '',
          price_per_day: Number(spot.price_per_day) || 0,
          price_currency: spot.price_currency || 'RON',
          latitude: spot.latitude == null ? null : Number(spot.latitude),
          longitude: spot.longitude == null ? null : Number(spot.longitude),
        }));

        if (isCancelled) return;
        setUserCity(profileCity);

        let location: { lat: number; lng: number } | null = null;
        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 7000,
                maximumAge: 600000,
              });
            });
            location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
          } catch {
            // Fall back to the city saved in the user's profile.
          }
        }

        if (isCancelled) return;
        setUserLocation(location);

        if (location) {
          const nearby = spots
            .filter(
              (spot) =>
                Number.isFinite(spot.latitude) &&
                Number.isFinite(spot.longitude) &&
                spot.latitude !== null &&
                spot.longitude !== null,
            )
            .map((spot) => ({
              ...spot,
              distance_km: distanceInKm(location!, {
                lat: spot.latitude!,
                lng: spot.longitude!,
              }),
            }))
            .filter((spot) => spot.distance_km <= MAX_FEATURED_DISTANCE_KM)
            .sort((a, b) => a.distance_km - b.distance_km);
          setNearbySpots(nearby.slice(0, 3));
        } else if (profileCity) {
          setNearbySpots(
            spots
              .filter((spot) => spot.city_name?.toLocaleLowerCase() === profileCity.toLocaleLowerCase())
              .slice(0, 3),
          );
        } else {
          setNearbySpots([]);
        }
      } catch (error) {
        console.warn('Unable to load nearby parking spots:', error);
        if (!isCancelled) setSpotsError('Unable to load nearby spots right now.');
      } finally {
        if (!isCancelled) setSpotsLoading(false);
      }
    };

    void fetchCitySpots();
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchPlanStatus = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (response.status === 401) {
          if (!isCancelled) {
            setIsPremium(false);
            delete document.documentElement.dataset.premium;
          }
          return;
        }
        if (!response.ok) return;
        const data = await response.json();
        if (isCancelled) return;

        const premium = Boolean(data?.user?.is_premium);
        setIsPremium(premium);
        document.documentElement.dataset.premium = String(premium);
      } catch (error) {
        console.warn('Unable to load Premium theme status:', error);
      }
    };

    void fetchPlanStatus();
    window.addEventListener('parkshare-premium-updated', fetchPlanStatus);
    return () => {
      isCancelled = true;
      window.removeEventListener('parkshare-premium-updated', fetchPlanStatus);
    };
  }, []);

  // Split bookings by active vs upcoming based on live `now`
  const { activeList, upcomingList } = useMemo(() => {
    const active: BookingItem[] = [];
    const upcoming: BookingItem[] = [];

    bookings.forEach((b) => {
      if (b.status === 'cancelled' || b.status === 'completed' || b.actual_end_date) return;
      const startMs = new Date(b.start_date).getTime();
      const endMs = new Date(b.end_date).getTime();
      if (startMs <= now && now <= endMs) {
        active.push(b);
      } else if (startMs > now) {
        upcoming.push(b);
      }
    });

    // If no explicit bookings list but dashboardTimers provided
    if (active.length === 0 && dashboardTimers.rental && dashboardTimers.rental.start_date && dashboardTimers.rental.end_date) {
      const rentalStartMs = new Date(dashboardTimers.rental.start_date).getTime();
      const rentalEndMs = new Date(dashboardTimers.rental.end_date).getTime();
      if (rentalStartMs <= now && now <= rentalEndMs && !dashboardTimers.rental.is_overtime) {
        active.push({
          id: dashboardTimers.rental.id || 1,
          spot_id: dashboardTimers.rental.spot?.id || 1,
          start_date: dashboardTimers.rental.start_date,
          end_date: dashboardTimers.rental.end_date,
          total_price: 0,
          status: dashboardTimers.rental.status,
          spot: dashboardTimers.rental.spot,
        });
      }
    }

    if (upcoming.length === 0 && dashboardTimers.reservation && dashboardTimers.reservation.start_date && dashboardTimers.reservation.end_date) {
      const reservationStartMs = new Date(dashboardTimers.reservation.start_date).getTime();
      if (reservationStartMs > now) {
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
    }

    // Sort active: most recent first
    active.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    // Sort upcoming: soonest first
    upcoming.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

    return { activeList: active, upcomingList: upcoming };
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
      <div className={`home-page-shell min-h-screen px-0 py-0 relative overflow-hidden ${isPremium ? 'premium-home-shell' : 'bg-[#dfeef0] dark:bg-[#011b1b]'}`}>
        <div className={`home-page-frame mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:text-white ${isPremium ? 'premium-home-frame' : 'bg-[#dfeef0] dark:bg-[#011b1b]'}`}>

          {/* Header Navigation */}
          <header className={`home-page-header relative flex items-center justify-between px-5 pt-5 pb-3 z-10 bg-[#dfeef0] dark:bg-[#011b1b] ${isPremium ? 'premium-home-header' : ''}`}>
            <MenuButton
              onClick={() => setIsMenuOpen(true)}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5 ${isPremium ? 'premium-home-menu-button' : ''}`}
            />
            <h1 className={`home-page-title absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center whitespace-nowrap text-[clamp(1.1rem,5vw,1.75rem)] font-bold tracking-tight text-[#121212] dark:text-white ${isPremium ? 'premium-home-title' : ''}`}>
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

                {/* Active Parking Sessions */}
                {activeList.length > 0 ? (
                    activeList.map((booking) => {
                      const startMs = new Date(booking.start_date).getTime();
                      const endMs = new Date(booking.end_date).getTime();

                      let hourlyRate = booking.spot?.price_per_day ?? 4.0;
                      if (booking.spot?.start_hour && booking.spot?.end_hour) {
                        try {
                          const shParts = booking.spot.start_hour.split(':').map((p) => parseInt(p, 10));
                          const ehParts = booking.spot.end_hour.split(':').map((p) => parseInt(p, 10));
                          const shVal = shParts[0] + (shParts[1] ? shParts[1] / 60 : 0);
                          const ehVal = ehParts[0] + (ehParts[1] ? ehParts[1] / 60 : 0);
                          const opHours = ehVal > shVal ? ehVal - shVal : 24;
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
                              title={booking.spot?.title || 'Active Parking Session'}
                              variant="rental"
                              targetTime={endMs}
                              startTime={startMs}
                              spotAddress={booking.spot?.address}
                              hourlyRate={hourlyRate}
                              currency={booking.spot?.price_currency || 'RON'}
                              leaveByTime={leaveByTime}
                              onEndRental={async () => {
                                const response = await fetch(`${getApiBaseUrl()}/api/bookings/${booking.id}/end`, {
                                  method: 'POST',
                                  credentials: 'include',
                                });
                                if (!response.ok) {
                                  const data = await response.json().catch(() => ({}));
                                  throw new Error(data.error || 'Unable to end parking session.');
                                }
                                await fetchDashboardData();
                              }}
                          />
                      );
                    })
                ) : null}

                {/* Upcoming Events / Reservations */}
                {upcomingList.length > 0 ? (
                    upcomingList.map((booking) => (
                        <div
                            key={booking.id}
                            className={`home-booking-card rounded-[28px] border border-black/5 bg-white/30 p-4 shadow-[0_18px_30px_rgba(15,32,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 transition-all duration-300 ${isPremium ? 'premium-home-card' : ''}`}
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

                            <span className={`home-upcoming-time rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0f4c81] dark:bg-blue-500/20 dark:text-blue-200 ${isPremium ? 'premium-home-upcoming-time' : ''}`}>
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
                {!timerError && activeList.length === 0 && upcomingList.length === 0 ? (
                    <div className={`home-empty-card rounded-[28px] border border-dashed border-black/10 bg-white/20 p-5 text-center dark:border-white/10 dark:bg-white/5 ${isPremium ? 'premium-home-card' : ''}`}>
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
                  className={`home-search-form flex items-center gap-3 rounded-[28px] border border-black/5 bg-white/40 p-2 pl-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,box-shadow] ${isPremium ? 'premium-home-search' : ''} ${
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
                    className={`home-search-button flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[20px] bg-[#0f4c81] shadow-md shadow-[#0f4c81]/15 transition hover:brightness-105 active:scale-95 dark:bg-[#9ad7db] dark:text-[#011b1b] ${isPremium ? 'premium-home-search-button' : ''}`}
                >
                  <Search className="h-5 w-5 text-white dark:text-[#011b1b]" strokeWidth={2.2} />
                </button>
              </form>

              {/* Featured Listings */}
              <div
                className={`home-featured-listings rounded-[28px] border border-black/5 bg-white/20 p-3 shadow-[0_18px_30px_rgba(15,32,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity] ${isPremium ? 'premium-home-featured' : ''} ${
                  isAnimatingSearch
                    ? 'opacity-0 translate-y-6 scale-[0.97] pointer-events-none'
                    : 'opacity-100 translate-y-0 scale-100'
                }`}
              >
                <a
                    href={ROUTES.RENT}
                    onClick={(e) => { e.preventDefault(); router.push(ROUTES.RENT); }}
                    className="mb-3 flex w-full cursor-pointer items-center justify-between text-left text-[#121212] dark:text-white"
                >
                  <span className="text-[22px] font-bold tracking-tight sm:text-[26px]">{t('spotsInYourCity')}</span>
                  <ChevronRight className="h-7 w-7 text-[#42565d] dark:text-[#dfeef0]" strokeWidth={2.5} />
                </a>

                {userLocation && (
                  <p className="mb-2 px-1 text-xs font-medium text-[#42565d] dark:text-[#dfeef0]">
                    Within {MAX_FEATURED_DISTANCE_KM} km of your current location
                  </p>
                )}
                {!userLocation && userCity && (
                  <p className="mb-2 px-1 text-xs font-medium text-[#42565d] dark:text-[#dfeef0]">
                    Based on your profile location: {userCity}
                  </p>
                )}
                {spotsLoading ? (
                  <p className="px-2 py-5 text-center text-sm text-[#42565d] dark:text-[#dfeef0]">
                    Finding parking spots near you...
                  </p>
                ) : spotsError ? (
                  <p className="px-2 py-5 text-center text-sm text-[#42565d] dark:text-[#dfeef0]">
                    {spotsError}
                  </p>
                ) : nearbySpots.length === 0 ? (
                  <p className="px-2 py-5 text-center text-sm text-[#42565d] dark:text-[#dfeef0]">
                    No available spots found
                  </p>
                ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {nearbySpots.map((spot) => {
                    const imageUrl = spot.image_url
                      ? spot.image_url.startsWith('http')
                        ? spot.image_url
                        : `${getApiBaseUrl()}${spot.image_url}`
                      : DEFAULT_SPOT_IMAGE;
                    const searchQuery = spot.address || spot.title;

                    return (
                  <a
                      key={spot.id}
                      href={`${ROUTES.RENT}?search=${encodeURIComponent(searchQuery)}`}
                      onClick={(e) => { e.preventDefault(); router.push(`${ROUTES.RENT}?search=${encodeURIComponent(searchQuery)}`); }}
                          className={`home-listing-card min-w-0 cursor-pointer overflow-hidden rounded-[22px] border border-black/5 bg-white/40 p-2 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/50 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 ${isPremium ? 'premium-home-card' : ''}`}
                      >
                        <div className="relative h-32 overflow-hidden rounded-[18px] bg-[#d9d9d9] sm:h-36 xl:h-40">
                          <Image
                              src={imageUrl}
                              alt={spot.title}
                              fill
                              sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw"
                              className="object-cover"
                              unoptimized
                          />
                        </div>

                        <div className="mt-2 space-y-1">
                          <p className="truncate text-sm font-bold text-[#121212] dark:text-white">{spot.title}</p>
                          <p className="truncate text-xs font-medium text-[#42565d] dark:text-[#dfeef0]">{spot.address}</p>
                          <p className="text-xl font-bold text-[#121212] dark:text-white">
                            {spot.price_per_day.toFixed(2)} {spot.price_currency}
                          </p>
                          {spot.distance_km !== undefined && (
                            <p className="text-xs font-medium text-[#42565d] dark:text-[#dfeef0]">
                              {spot.distance_km < 1
                                ? `${Math.round(spot.distance_km * 1000)} m away`
                                : `${spot.distance_km.toFixed(1)} km away`}
                            </p>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
                )}
              </div>
            </div>
          </main>

          {/* Bottom Navigation */}
          <nav className="absolute bottom-0 left-0 right-0 flex justify-around items-center py-4 bg-[#dfeef0] dark:bg-[#011b1b] border-t border-black/5 dark:border-white/10 z-30">
           <a
               href={ROUTES.RENT}
               onClick={(e) => { e.preventDefault(); setActiveTab('key'); router.push(ROUTES.RENT); }}
               className={`p-1.5 transition-all cursor-pointer rounded-full ${
 activeTab === 'key' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
}`}
           >
             <Key className="w-6 h-6 transform -rotate-45" strokeWidth={activeTab === 'key' ? 2.5 : 2} />
           </a>

           <a
               href={ROUTES.HOME}
               onClick={(e) => { e.preventDefault(); setActiveTab('home'); router.push(ROUTES.HOME); }}
               className={`p-1.5 transition-all cursor-pointer rounded-full ${
 activeTab === 'home' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
}`}
           >
             <Home className="w-6 h-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
           </a>

           <a
               href={ROUTES.MANAGE_CAR}
               onClick={(e) => { e.preventDefault(); setActiveTab('car'); router.push(ROUTES.MANAGE_CAR); }}
               className={`p-1.5 transition-all cursor-pointer rounded-full ${
 activeTab === 'car' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
}`}
           >
             <Car className="w-6 h-6" strokeWidth={activeTab === 'car' ? 2.5 : 2} />
           </a>
          </nav>
        </div>
      </div>
  );
}
