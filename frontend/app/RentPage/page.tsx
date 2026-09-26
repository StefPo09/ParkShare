'use client';

import { useRouter } from "next/navigation";
import { ROUTES } from '../../constants/routes';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { GoogleMap, useJsApiLoader, MarkerF, Circle } from '@react-google-maps/api';
import {
    Menu,
    MapPin,
    Clock,
    Key,
    Home,
    Car,
    Flag,
} from 'lucide-react';
import NavMenu from "../components/NavMenu";
import ProfileMenu from "../components/ProfileMenu";
import { useLanguage } from '../components/LanguageProvider';

// Custom dark map style to match the dark UI theme
const darkMapStyle: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#091d19' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#091d19' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#74928d' }] },
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#a0ece0' }],
    },
    {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#53827a' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#0e2b25' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#163a33' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#091d19' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#204f46' }],
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#040d0b' }],
    },
];

const containerStyle = {
    width: '100%',
    height: '100%',
};

// Center position (e.g., San Francisco)
const mapCenter = {
    lat: 37.7749,
    lng: -122.4194,
};

interface ParkingSpot {
    id: string;
  owner_id?: number;
  owner_name?: string;
  title?: string;
  description?: string;
    price: number;
  price_currency?: string;
    address: string;
    availability: string;
    distance: string;
    image: string;
    lat: number;
    lng: number;
    is_on_sale?: boolean;
}

const mockSpots: ParkingSpot[] = [
    {
        id: '1',
        price: 4,
        address: 'Parking spot address',
        availability: '14:00-18:00',
        distance: '100 meters',
        image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
        lat: 37.7749,
        lng: -122.4194,
    },
    {
        id: '2',
        price: 3,
        address: 'Eastside Spot',
        availability: '10:00-20:00',
        distance: '350 meters',
        image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        lat: 37.7770,
        lng: -122.4120,
    },
    {
        id: '3',
        price: 5,
        address: 'Downtown Garage',
        availability: '08:00-18:00',
        distance: '500 meters',
        image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
        lat: 37.7710,
        lng: -122.4250,
    },
];

export default function ParkingRentPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('key');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Load Google Maps SDK
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  // Detect system color preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationPermissionDenied(true);
      return;
    }

    const storageKey = 'parkshare-location-permission';
    const storedPermission = window.localStorage.getItem(storageKey);

    const requestLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(nextLocation);
          setLocationPermissionDenied(false);
          window.localStorage.setItem(storageKey, 'granted');
        },
        () => {
          setLocationPermissionDenied(true);
          window.localStorage.setItem(storageKey, 'denied');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000,
        }
      );
    };

    if (storedPermission === 'granted') {
      requestLocation();
      return;
    }

    if (storedPermission === 'denied') {
      setLocationPermissionDenied(true);
      return;
    }

    requestLocation();
  }, []);

  useEffect(() => {
    if (!map || !userLocation) return;
    map.panTo(userLocation);
    map.setZoom(13);
  }, [map, userLocation]);

  // Fetch available parking spots
  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: 'include' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setCurrentUserId(data?.user?.id ?? null))
      .catch(() => setCurrentUserId(null));

    const fetchSpots = async () => {
      try {
        const response = await fetch(`${API}/api/spots?available_only=true`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const rawSpots = Array.isArray(data?.spots) ? data.spots : [];

        const fetchedSpots: ParkingSpot[] = rawSpots.map((s: any) => ({
          id: s.id ?? s._id ?? String(s.id ?? ''),
          owner_id: Number(s.owner?.id ?? s.user_id) || undefined,
          owner_name: s.owner?.name || '',
          title: s.title || s.address || '',
          description: s.description || '',
          price: s.price_per_day ?? s.price ?? 0,
          price_currency: s.price_currency || 'RON',
          address: s.address ?? s.location ?? '',
          availability: s.availability ?? s.available_hours ?? `${s.start_hour || '14:00'} - ${s.end_hour || '18:00'}`,
          distance: s.distance ?? '',
          image: s.image_url
            ? (s.image_url.startsWith('http') ? s.image_url : `${API}${s.image_url}`)
            : s.image ?? s.photo ?? '',
          lat: s.latitude ?? s.lat ?? (s.location && s.location.lat) ?? 0,
          lng: s.longitude ?? s.lng ?? (s.location && s.location.lng) ?? 0,
          is_on_sale: Boolean(s.is_on_sale),
        }));

        const spotsToUse = fetchedSpots.length > 0 ? fetchedSpots : mockSpots;
        const normalizedSpots = userLocation
          ? [...spotsToUse].sort((a, b) => {
              const distanceA = Math.hypot(a.lat - userLocation.lat, a.lng - userLocation.lng);
              const distanceB = Math.hypot(b.lat - userLocation.lat, b.lng - userLocation.lng);
              return distanceA - distanceB;
            })
          : spotsToUse;

        setSpots(normalizedSpots);
        setSelectedSpot(normalizedSpots[0] ?? null);
      } catch (error) {
        console.warn('Falling back to mock parking spots:', error);
        const fallbackSpots = userLocation
          ? [...mockSpots].sort((a, b) => {
              const distanceA = Math.hypot(a.lat - userLocation.lat, a.lng - userLocation.lng);
              const distanceB = Math.hypot(b.lat - userLocation.lat, b.lng - userLocation.lng);
              return distanceA - distanceB;
            })
          : mockSpots;

        setSpots(fallbackSpots);
        setSelectedSpot(fallbackSpots[0] ?? null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpots();
  }, [API, userLocation]);

  const submitReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSpot?.owner_id || !reportReason) return;

    setReportSubmitting(true);
    setReportMessage('');
    try {
      const response = await fetch(`${API}/api/users/${selectedSpot.owner_id}/reports`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason, details: reportDetails }),
      });
      const data = await response.json();
      if (!response.ok) {
        const errorKeys: Record<string, string> = {
          authentication_required: 'reportErrorAuthentication',
          cannot_report_self: 'reportErrorSelf',
          user_not_found: 'reportErrorUserNotFound',
          account_banned: 'reportErrorBanned',
          invalid_report_reason: 'reportErrorInvalidReason',
          report_details_too_long: 'reportErrorDetailsTooLong',
          already_reported: 'reportErrorDuplicate',
        };
        throw new Error(t(errorKeys[data.error] || 'reportFailed'));
      }
      setReportMessage(t('reportSubmitted'));
      setReportFormOpen(false);
      setReportDetails('');
    } catch (error) {
      setReportMessage(error instanceof Error ? error.message : t('reportFailed'));
    } finally {
      setReportSubmitting(false);
    }
  };

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    if (userLocation) {
      mapInstance.panTo(userLocation);
    }
  }, [userLocation]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleBookSpot = async () => {
    if (!selectedSpot || !startDate || !endDate) {
      setBookingError('Please select dates');
      return;
    }

    setIsBooking(true);
    setBookingError(null);

    try {
      const response = await fetch(`${API}/api/bookings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spot_id: selectedSpot.id,
          start_date: startDate,
          end_date: endDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setBookingError(error.error || 'Booking failed');
        return;
      }

      setStartDate('');
      setEndDate('');
      router.push(ROUTES.HOME);
    } catch {
      setBookingError('An error occurred. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const mapCenterTarget = userLocation ?? (selectedSpot ? { lat: selectedSpot.lat, lng: selectedSpot.lng } : mapCenter);

  return (
    <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative">
      <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">

        {/* --- Top Header Navigation --- */}
        <header className="flex items-center justify-between px-5 pt-5 pb-3 z-10">
          <button
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          >
            <Menu className="w-6 h-6" strokeWidth={2.2} />
          </button>

          <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
            {t('parkShare')}
          </h1>

          <ProfileMenu />
        </header>

        <NavMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />

        {/* --- Google Maps Container --- */}
        <main className="relative flex-1 bg-[#e8e8e8] dark:bg-[#121c1a] overflow-hidden">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenterTarget}
              zoom={14}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                disableDefaultUI: true,
                zoomControl: false,
                styles: isDarkMode ? darkMapStyle : [],
              }}
            >
              {userLocation && (
                <Circle
                  center={userLocation}
                  radius={22}
                  options={{
                    strokeColor: '#1e90ff',
                    strokeOpacity: 0.9,
                    strokeWeight: 2,
                    fillColor: '#1e90ff',
                    fillOpacity: 0.18,
                    clickable: false,
                    zIndex: 20,
                  }}
                />
              )}

              {spots.map((spot) => {
                const isSelected = selectedSpot?.id === spot.id;

                const redPinSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#ef4444" stroke="#dc2626" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>'
                )}`;
                const greyPinSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                  '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#42565d" stroke="#64748b" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>'
                )}`;

                return (
                  <MarkerF
                    key={spot.id}
                    position={{ lat: spot.lat, lng: spot.lng }}
                    onClick={() => {
                      setSelectedSpot(spot);
                      setReportFormOpen(false);
                      setReportMessage('');
                    }}
                    label={{
                      text: `${spot.price} ${spot.price_currency || 'RON'}/d`,
                      color: isSelected ? '#ffffff' : '#121212',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                    icon={{
                      url: isSelected ? redPinSvg : greyPinSvg,
                      anchor: isLoaded ? new window.google.maps.Point(18, 36) : undefined,
                    }}
                  />
                );
              })}
            </GoogleMap>
          ) : (
            <div className="flex items-center justify-center h-full text-[#6f797d] dark:text-[#9db0b6]">
              {t('loadingMap')}
            </div>
          )}
        </main>

        {selectedSpot && (
          <section className="absolute bottom-[76px] left-3 right-3 z-20 max-h-[45vh] overflow-y-auto rounded-xl border border-black/10 bg-[#cde8e8] p-4 shadow-xl dark:border-white/10 dark:bg-[#0c2e2b]">
            {selectedSpot.image && (
              <div className="relative mb-3 h-28 w-full overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">
                <Image src={selectedSpot.image} alt={selectedSpot.title || selectedSpot.address} fill unoptimized className="object-cover" />
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-[#1a4a58] dark:text-[#a0ece0]">{selectedSpot.address}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-[#52737c] dark:text-[#74928d]">
                  <Clock className="h-4 w-4" /> {selectedSpot.availability || 'Available hours not listed'}
                  <span className="ml-2 font-semibold">{selectedSpot.price} {selectedSpot.price_currency || 'RON'} / day</span>
                </p>
                {selectedSpot.title && selectedSpot.title !== selectedSpot.address && (
                  <p className="mt-1 truncate text-sm font-semibold text-[#1a4a58] dark:text-[#a0ece0]">{selectedSpot.title}</p>
                )}
              </div>
              <button type="button" onClick={() => setSelectedSpot(null)} aria-label={t('close')} className="rounded p-1 text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10">×</button>
            </div>

            {selectedSpot.description && <p className="mt-2 line-clamp-2 text-xs text-[#52737c] dark:text-[#74928d]">{selectedSpot.description}</p>}
            <div className="mt-3 flex justify-end border-t border-black/10 pt-3 dark:border-white/10">
              <button
                type="button"
                disabled={!selectedSpot.is_on_sale}
                onClick={() => {
                  if (selectedSpot.is_on_sale) router.push(`${ROUTES.PAYMENT}?spot=${selectedSpot.id}`);
                }}
                className={`rounded-md px-5 py-2 text-sm font-bold text-white transition ${selectedSpot.is_on_sale ? 'cursor-pointer bg-[#0c4a75] hover:bg-[#0a3c5f] dark:bg-[#155b8a]' : 'cursor-not-allowed bg-slate-400 opacity-60 dark:bg-slate-600'}`}
              >
                PAY
              </button>
            </div>

            {selectedSpot.owner_id && selectedSpot.owner_id !== currentUserId && (
              <div className="mt-3 border-t border-black/10 pt-2 dark:border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-[#52737c] dark:text-[#74928d]">{t('listedBy')} {selectedSpot.owner_name || t('spotOwner')}</span>
                  {!reportFormOpen && !reportMessage.startsWith(t('reportSubmitted')) && (
                    <button type="button" onClick={() => { setReportFormOpen(true); setReportMessage(''); }} className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30">
                      <Flag className="h-3.5 w-3.5" /> {t('reportUser')}
                    </button>
                  )}
                </div>
                {reportFormOpen && (
                  <form onSubmit={submitReport} className="mt-2 space-y-2">
                    <label className="block text-xs font-semibold">
                      {t('reportReason')}
                      <select required value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="mt-1 w-full rounded-md border border-black/15 bg-white px-2 py-2 text-sm text-[#121212] dark:border-white/15 dark:bg-[#102b28] dark:text-white">
                        <option value="">{t('selectReason')}</option>
                        <option value="fraud">{t('reportFraud')}</option>
                        <option value="harassment">{t('reportHarassment')}</option>
                        <option value="unsafe_behavior">{t('reportUnsafe')}</option>
                        <option value="misleading_listing">{t('reportMisleading')}</option>
                        <option value="other">{t('reportOther')}</option>
                      </select>
                    </label>
                    <textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} maxLength={2000} rows={2} placeholder={t('reportDetailsPlaceholder')} className="w-full resize-y rounded-md border border-black/15 bg-white px-2 py-2 text-sm text-[#121212] placeholder:text-slate-500 dark:border-white/15 dark:bg-[#102b28] dark:text-white" />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setReportFormOpen(false)} className="rounded px-3 py-1.5 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10">{t('cancel')}</button>
                      <button type="submit" disabled={reportSubmitting || !reportReason} className="rounded bg-red-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{reportSubmitting ? t('submittingReport') : t('submitReport')}</button>
                    </div>
                  </form>
                )}
                {reportMessage && <p role="status" className="mt-1 text-xs">{reportMessage}</p>}
              </div>
            )}
          </section>
        )}

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