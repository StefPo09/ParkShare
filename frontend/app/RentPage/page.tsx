'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from '../../constants/routes';
import { getApiBaseUrl } from '../../constants/api';
import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, Circle } from '@react-google-maps/api';
import {
  Menu,
  Search,
  Key,
  Home,
  Car,
  Clock,
  MapPin,
  X,
} from 'lucide-react';
import Image from 'next/image';
import NavMenu from "../components/NavMenu";
import ProfileMenu from "../components/ProfileMenu";
import { useLanguage } from '../components/LanguageProvider';

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
  id: string;
  title?: string;
  price: number;
  price_currency?: string;
  address: string;
  description?: string;
  start_hour?: string;
  end_hour?: string;
  availability: string;
  distance: string;
  image: string;
  lat: number;
  lng: number;
  is_on_sale?: boolean;
  bookings?: Array<{ start_date: string; end_date: string; status: string }>;
}

const mockSpots: ParkingSpot[] = [
  {
    id: '1',
    title: 'Central Garage Spot',
    price: 4,
    price_currency: 'RON',
    address: 'Address unavailable',
    description: 'Secure underground parking with 24/7 surveillance.',
    start_hour: '14:00',
    end_hour: '18:00',
    availability: '14:00 - 18:00',
    distance: '100 meters',
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    lat: 37.7749,
    lng: -122.4194,
    is_on_sale: false,
  },
  {
    id: '2',
    title: 'Eastside Spot',
    price: 3,
    price_currency: 'RON',
    address: 'Eastside Spot',
    description: 'Spacious outdoor spot close to metro station.',
    start_hour: '10:00',
    end_hour: '20:00',
    availability: '10:00 - 20:00',
    distance: '350 meters',
    image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
    lat: 37.7770,
    lng: -122.4120,
    is_on_sale: true,
  },
  {
    id: '3',
    title: 'Downtown Garage',
    price: 5,
    price_currency: 'RON',
    address: 'Downtown Garage',
    description: 'Covered parking with EV charging station.',
    start_hour: '08:00',
    end_hour: '18:00',
    availability: '08:00 - 18:00',
    distance: '500 meters',
    image: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
    lat: 37.7710,
    lng: -122.4250,
    is_on_sale: false,
  },
];

function RentPageContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('search') || '';
  const shouldAutoFocus = searchParams.has('search');

  const API = getApiBaseUrl();

  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('key');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchValue, setSearchValue] = useState(initialQuery);

  // Gestiuni Drag/Swipe pentru Bottom Sheet
  const [sheetY, setSheetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY - sheetY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY - dragStartY.current;
    if (currentY >= 0) {
      setSheetY(currentY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (sheetY > 100) {
      setSelectedSpot(null);
      setSheetY(0);
    } else {
      setSheetY(0);
    }
  };

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey,
    authReferrerPolicy: 'origin',
    version: 'weekly',
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
    );
  }, []);

  useEffect(() => {
    if (!map || !userLocation) return;
    map.panTo(userLocation);
    map.setZoom(13);
  }, [map, userLocation]);

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const response = await fetch(`${API}/api/spots?available_only=true`, {
          credentials: 'include',
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);

        const data = await response.json();
        const rawSpots = Array.isArray(data?.spots) ? data.spots : [];

        const fetchedSpots: ParkingSpot[] = rawSpots.map((s: any) => {
          const startH = s.start_hour || s.start_time || '08:00';
          const endH = s.end_hour || s.end_time || '18:00';
          const currency = s.price_currency || 'RON';
          const priceVal = Number(s.price_per_day ?? s.price ?? 0);
          const imageUrl = s.image_url
              ? (s.image_url.startsWith('http') ? s.image_url : `${API}${s.image_url}`)
              : (s.image ?? s.photo ?? 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80');

          return {
            id: String(s.id ?? s._id ?? ''),
            title: s.title || s.address || 'Parking Spot',
            price: priceVal,
            price_currency: currency,
            address: s.address ?? s.location ?? '',
            description: s.description ?? '',
            start_hour: startH,
            end_hour: endH,
            availability: `${startH} - ${endH}`,
            distance: s.distance ?? '',
            image: imageUrl,
            lat: Number(s.latitude ?? s.lat ?? (s.location && s.location.lat) ?? 0),
            lng: Number(s.longitude ?? s.lng ?? (s.location && s.location.lng) ?? 0),
            is_on_sale: Boolean(s.is_on_sale),
            bookings: Array.isArray(s.bookings) ? s.bookings : [],
          };
        });

        const spotsToUse = fetchedSpots.length > 0 ? fetchedSpots : mockSpots;
        setSpots(spotsToUse);
      } catch (error) {
        setSpots(mockSpots);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpots();
  }, [API]);

  const handleAddressSearch = useCallback((addressToSearch?: string) => {
    const targetAddress = addressToSearch !== undefined ? addressToSearch : searchValue;
    if (!targetAddress || typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.Geocoder || !map) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: targetAddress }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        map.panTo(location);
        map.setZoom(18);
      }
    });
  }, [map, searchValue]);

  useEffect(() => {
    if (isLoaded && map && initialQuery) {
      handleAddressSearch(initialQuery);
    }
  }, [isLoaded, map, initialQuery, handleAddressSearch]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    if (userLocation) {
      mapInstance.panTo(userLocation);
    }
  }, [userLocation]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const mapCenterTarget = userLocation ?? mapCenter;

  return (
      <div
          className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[opacity,transform]"
          style={{
            animation: 'smoothFadeIn 450ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
      >
        <style jsx global>{`
        @keyframes smoothFadeIn {
          from {
            opacity: 0;
            transform: scale(0.985) translateY(4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

        <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[#011b1b] dark:text-white relative">

          {/* Header Navigation */}
          <header className="relative z-30 flex items-center justify-between px-5 pt-5 pb-2 bg-[#dfeef0] dark:bg-[#011b1b]">
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

          {/* Search Bar */}
          <div className="relative z-20 px-4 pb-3 bg-[#dfeef0] dark:bg-[#011b1b]">
            <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddressSearch();
                }}
                className="flex items-center gap-3 rounded-[28px] border border-black/5 bg-white/40 p-2 pl-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10 transition-all duration-300 focus-within:shadow-md"
            >
              <input
                  type="text"
                  value={searchValue}
                  autoFocus={shouldAutoFocus}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={t('searchSpotOffers')}
                  className="flex-1 border-0 bg-transparent text-[18px] font-medium tracking-[-0.04em] text-[#121212] outline-none placeholder:text-[#42565d]/80 dark:text-white dark:placeholder:text-[#dfeef0]/80"
              />
              <button
                  type="submit"
                  aria-label={t('searchSpotOffers')}
                  className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[20px] bg-[#0f4c81] shadow-md shadow-[#0f4c81]/15 transition hover:brightness-105 active:scale-95 dark:bg-[#9ad7db] dark:text-[#011b1b]"
              >
                <Search className="h-5 w-5 text-white dark:text-[#011b1b]" strokeWidth={2.2} />
              </button>
            </form>
          </div>

          <NavMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
          />

          {/* Google Maps Container */}
          <main className="relative flex-1 bg-[#e8e8e8] dark:bg-[#121c1a] overflow-hidden transform-gpu z-10">
            {loadError ? (
                <div className="flex h-full items-center justify-center px-6 text-center text-[#6f797d] dark:text-[#9db0b6]">
                  Google Maps is blocked for this host. In Google Cloud, allow this URL in the API key restrictions: {typeof window !== 'undefined' ? window.location.origin : 'this device'}.
                </div>
            ) : !googleMapsApiKey ? (
                <div className="flex h-full items-center justify-center text-[#6f797d] dark:text-[#9db0b6]">
                  Map unavailable: Google Maps API key is not configured.
                </div>
            ) : isLoaded ? (
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={mapCenterTarget}
                    zoom={14}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onClick={() => setSelectedSpot(null)}
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
                        '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"36\" height=\"36\" viewBox=\"0 0 24 24\" fill=\"#ef4444\" stroke=\"#dc2626\" stroke-width=\"1.5\"><path d=\"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"3\" fill=\"white\"/></svg>'
                    )}`;
                    const greyPinSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                        '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"#42565d\" stroke=\"#64748b\" stroke-width=\"1.5\"><path d=\"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"3\" fill=\"white\"/></svg>'
                    )}`;

                    return (
                        <MarkerF
                            key={spot.id}
                            position={{ lat: spot.lat, lng: spot.lng }}
                            onClick={() => {
                              setSelectedSpot(spot);
                              setSheetY(0);
                            }}
                            label={{
                              text: `${spot.price} ${spot.price_currency || 'RON'}`,
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

          {/* Bottom Navigation */}
          <nav className="fixed inset-x-0 bottom-0 z-50 flex w-screen items-center justify-around border-t border-black/5 bg-[#dfeef0] pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#011b1b]">
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

          {/* Bottom Sheet Card Details */}
          {selectedSpot && (
              <div
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{
                    transform: `translateY(${sheetY}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="absolute bottom-[72px] left-3 right-3 z-30 rounded-[22px] bg-[#cde8e8] dark:bg-[#0c2e2b] p-3 shadow-xl transition-all duration-300 border border-black/5 dark:border-white/10"
              >
                {/* Drag Handle Indicator */}
                <div className="flex justify-center pb-1.5 cursor-grab active:cursor-grabbing">
                  <div className="h-1 w-10 rounded-full bg-[#8baab0] dark:bg-[#204a44]" />
                </div>

                {/* Spot Image Preview with Pagination Dots */}
                <div className="relative h-28 w-full overflow-hidden rounded-[16px] bg-slate-200 shadow-inner">
                  <Image
                      src={selectedSpot.image}
                      alt={selectedSpot.title || selectedSpot.address}
                      fill
                      unoptimized
                      className="object-cover"
                  />

                  {/* Close button */}
                  <button
                      type="button"
                      aria-label="Close spot details"
                      onClick={() => setSelectedSpot(null)}
                      className="absolute top-2 right-2 z-20 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70 active:scale-95"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>

                  {selectedSpot.is_on_sale ? (
                      <div className="absolute top-2 left-2 z-10 rounded-full bg-[#0f4c81] dark:bg-[#2dd4bf] dark:text-[#011b1b] px-2.5 py-0.5 text-[11px] font-bold text-white shadow-md">
                        ON SALE
                      </div>
                  ) : (
                      <div className="absolute top-2 left-2 z-10 rounded-full bg-red-500 dark:bg-red-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-md">
                        UNAVAILABLE
                      </div>
                  )}

                  {/* Dots indicator */}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
                    <span className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                  </div>
                </div>

                {/* Spot Details Header */}
                <div className="mt-2 px-1">
                  <h3 className="text-[16px] font-bold text-[#1a4a58] dark:text-[#a0ece0] tracking-tight truncate">
                    {selectedSpot.address}
                  </h3>

                  <div className="mt-0.5 flex items-center gap-3 text-[13px] font-medium text-[#52737c] dark:text-[#74928d]">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 stroke-[2]" />
                      <span>{selectedSpot.start_hour && selectedSpot.end_hour ? `${selectedSpot.start_hour} - ${selectedSpot.end_hour}` : (selectedSpot.availability || '14:00 - 18:00')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 stroke-[2]" />
                      <span>{!selectedSpot.is_on_sale ? 'Unavailable' : (selectedSpot.distance || 'Available now')}</span>
                    </div>
                  </div>
                </div>

                {/* Price & Action Row */}
                <div className="mt-2 flex items-center justify-between px-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[20px] font-bold text-[#143d49] dark:text-white">
                      {selectedSpot.price} {selectedSpot.price_currency || 'RON'}
                    </span>
                    <span className="text-[13px] font-medium text-[#52737c] dark:text-[#74928d]">
                      / day
                    </span>
                  </div>

                  <button
                      type="button"
                      disabled={!selectedSpot.is_on_sale}
                      onClick={() => {
                        if (!selectedSpot.is_on_sale) return;
                        router.push(`${ROUTES.PAYMENT}?spot=${selectedSpot.id}`);
                      }}
                      className={`rounded-[14px] px-5 py-1.5 text-[15px] font-extrabold tracking-wider text-white shadow-md transition duration-200 ${
                          selectedSpot.is_on_sale
                              ? 'bg-[#0c4a75] hover:bg-[#0a3c5f] active:scale-95 dark:bg-[#155b8a] cursor-pointer'
                              : 'bg-slate-400 dark:bg-slate-600 opacity-60 cursor-not-allowed pointer-events-none shadow-none'
                      }`}
                  >
                    PAY
                  </button>
                </div>

                {/* Location Name Section */}
                <div className="mt-2 border-t border-black/5 dark:border-white/10 pt-1.5 px-1">
                  <h4 className="text-[13px] font-bold text-[#1a4a58] dark:text-[#a0ece0] truncate">
                    {selectedSpot.title || 'Location details'}
                  </h4>
                  {selectedSpot.description && (
                      <p className="mt-0.5 text-[11px] text-[#52737c] dark:text-[#74928d] line-clamp-1">
                        {selectedSpot.description}
                      </p>
                  )}
                </div>
              </div>
          )}
        </div>
      </div>
  );
}

export default function ParkingRentPage() {
  return (
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center bg-[#dfeef0] dark:bg-[#011b1b]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0f4c81] border-t-transparent" />
        </div>
      }>
        <RentPageContent />
      </Suspense>
  );
}
