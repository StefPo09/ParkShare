'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import {
  Menu,
  MapPin,
  Key,
  Home,
  Car,
} from 'lucide-react';
import NavMenu from "../components/NavMenu";
import ProfileMenu from "../components/ProfileMenu";
import { useLanguage } from '../components/LanguageProvider';

// Custom dark map style to match dark UI theme
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

const mapCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

interface ParkingSpot {
  id: number;
  title: string;
  address: string;
  price_per_day: number;
  description?: string;
  is_available: boolean;
  latitude: number;
  longitude: number;
  user_id: number;
  city_id: number;
}

export default function ParkingRentPage() {
  const { t } = useLanguage();
  const router = useRouter();

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
  const [, setMap] = useState<google.maps.Map | null>(null);

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

  // Fetch available parking spots
  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/spots?available_only=true', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          const fetchedSpots: ParkingSpot[] = data.spots || [];
          setSpots(fetchedSpots);
          if (fetchedSpots.length > 0) {
            setSelectedSpot(fetchedSpots[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch spots:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSpots();
  }, []);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

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
      const response = await fetch('http://localhost:5000/api/bookings', {
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

      alert('Booking created successfully!');
      setStartDate('');
      setEndDate('');
    } catch {
      setBookingError('An error occurred. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

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
              center={selectedSpot ? { lat: selectedSpot.latitude, lng: selectedSpot.longitude } : mapCenter}
              zoom={14}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                disableDefaultUI: true,
                zoomControl: false,
                styles: isDarkMode ? darkMapStyle : [],
              }}
            >
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
                    position={{ lat: spot.latitude, lng: spot.longitude }}
                    onClick={() => setSelectedSpot(spot)}
                    label={{
                      text: `$${spot.price_per_day}/d`,
                      color: isSelected ? '#ffffff' : '#121212',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      className: isSelected
                        ? 'bg-black px-2 py-0.5 rounded-full shadow'
                        : 'bg-white px-2 py-0.5 rounded-full shadow border border-black/10',
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

        {/* --- Bottom Drawer / Rental Details --- */}
        <section className="bg-white/40 dark:bg-[#011b1b]/95 border-t border-black/5 dark:border-white/10 backdrop-blur-md rounded-t-4xl p-5 shadow-[0_-15px_30px_rgba(15,32,35,0.08)] transition-colors duration-300 z-20">
          <div className="w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mb-4" />

          {isLoading ? (
            <div className="text-center py-8 text-[#42565d] dark:text-[#d6e7ea]">Loading spots...</div>
          ) : !selectedSpot ? (
            <div className="text-center py-8 text-[#42565d] dark:text-[#d6e7ea]">No available spots</div>
          ) : (
            <>
              <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-4 shadow-[inset_0_2px_10px_rgba(15,23,42,0.08)] border border-black/5 dark:border-white/5 bg-[#e8e8e8] dark:bg-[#1a2a28] flex items-center justify-center">
                <MapPin className="w-12 h-12 text-[#42565d] dark:text-[#d6e7ea]" strokeWidth={2} />
              </div>

              <h2 className="text-[20px] font-bold tracking-tight text-[#121212] dark:text-white mb-1">
                {selectedSpot.title}
              </h2>
              <p className="text-[13px] font-medium text-[#42565d] dark:text-[#d6e7ea] mb-5">
                {selectedSpot.address}
              </p>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[12px] font-bold uppercase text-[#42565d] dark:text-[#d6e7ea]">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2 text-[#121212] dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold uppercase text-[#42565d] dark:text-[#d6e7ea]">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 py-2 text-[#121212] dark:text-white outline-none"
                  />
                </div>
              </div>

              {bookingError && <div className="mb-3 text-red-700 dark:text-red-300 text-sm">{bookingError}</div>}

              <div className="flex items-center justify-between mt-4 pb-20">
                <div className="flex items-baseline space-x-0.5">
                  <span className="text-[26px] font-extrabold tracking-tight text-[#121212] dark:text-white">${selectedSpot.price_per_day}</span>
                  <span className="text-sm font-medium text-[#6f797d] dark:text-[#9db0b6]">/ day</span>
                </div>

                <button
                  onClick={handleBookSpot}
                  disabled={isBooking || !startDate || !endDate}
                  className="px-8 py-3.5 cursor-pointer bg-[#0f4c81] hover:bg-[#0c3e67] disabled:bg-[#0f4c81]/45 disabled:cursor-not-allowed text-white font-semibold text-base rounded-2xl shadow-[0_12px_24px_rgba(15,76,129,0.24)] transition-all active:scale-95"
                >
                  {isBooking ? 'Booking...' : 'Rent'}
                </button>
              </div>
            </>
          )}
        </section>

        {/* --- Bottom Navigation Bar --- */}
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