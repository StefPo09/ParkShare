'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from '../../constants/routes';
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, Circle } from '@react-google-maps/api';
import {
    Menu,
    Search,
    Key,
    Home,
    Car,
} from 'lucide-react';
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
    price: number;
    address: string;
    availability: string;
    distance: string;
    image: string;
    lat: number;
    lng: number;
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

function RentPageContent() {
    const { t } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('search') || '';
    const shouldAutoFocus = searchParams.has('search');

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const [spots, setSpots] = useState<ParkingSpot[]>([]);
    const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
    const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('key');
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [searchValue, setSearchValue] = useState(initialQuery);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    });

    // Detectare dark mode
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    // Geolocation setup
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

    // Centrare pe locația utilizatorului
    useEffect(() => {
        if (!map || !userLocation) return;
        map.panTo(userLocation);
        map.setZoom(13);
    }, [map, userLocation]);

    // Preluarea locurilor de parcare din Backend
    useEffect(() => {
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
                    price: s.price_per_day ?? s.price ?? 0,
                    address: s.address ?? s.location ?? '',
                    availability: s.availability ?? s.available_hours ?? '',
                    distance: s.distance ?? '',
                    image: s.image ?? s.photo ?? '',
                    lat: s.latitude ?? s.lat ?? (s.location && s.location.lat) ?? 0,
                    lng: s.longitude ?? s.lng ?? (s.location && s.location.lng) ?? 0,
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

    // Geocoding cu zoom apropiat pe stradă (Zoom 18)
    const handleAddressSearch = useCallback((addressToSearch?: string) => {
        const targetAddress = addressToSearch !== undefined ? addressToSearch : searchValue;
        if (!targetAddress || !window.google || !map) return;

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

    const mapCenterTarget = userLocation ?? (selectedSpot ? { lat: selectedSpot.lat, lng: selectedSpot.lng } : mapCenter);

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

                {/* Bara de Căutare din Header */}
                <div className="px-4 pb-3 z-10 bg-[#dfeef0] dark:bg-[#011b1b]">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleAddressSearch();
                        }}
                        className="flex items-center gap-3 rounded-[28px] border border-black/5 bg-white/40 p-2 pl-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10"
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
                <main className="relative flex-1 bg-[#e8e8e8] dark:bg-[#121c1a] overflow-hidden animate-in fade-in duration-300">
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
                                        onClick={() => setSelectedSpot(spot)}
                                        label={{
                                            text: `$${spot.price}/d`,
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

function RentPageSkeleton() {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative overflow-hidden">
            <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[#011b1b] dark:text-white">
                <header className="flex items-center justify-between px-5 pt-5 pb-3 z-10 bg-[#dfeef0] dark:bg-[#011b1b]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-[#121212] dark:text-white">
                        <Menu className="h-6 w-6" strokeWidth={2.2} />
                    </div>
                    <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
                        {t('parkShare')}
                    </h1>
                    <ProfileMenu />
                </header>
                <div className="px-4 pb-3 z-10 bg-[#dfeef0] dark:bg-[#011b1b]">
                    <div className="flex items-center gap-3 rounded-[28px] border border-black/5 bg-white/40 p-2 pl-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
                        <div className="flex-1 text-[18px] font-medium tracking-[-0.04em] text-[#42565d]/80 dark:text-[#dfeef0]/80">
                            {t('searchSpotOffers')}
                        </div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[20px] bg-[#0f4c81] shadow-md shadow-[#0f4c81]/15 dark:bg-[#9ad7db] dark:text-[#011b1b]">
                            <Search className="h-5 w-5 text-white dark:text-[#011b1b]" strokeWidth={2.2} />
                        </div>
                    </div>
                </div>
                <main className="relative flex-1 bg-[#e8e8e8] dark:bg-[#121c1a] flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0f4c81] border-t-transparent" />
                </main>
                <nav className="absolute bottom-0 left-0 right-0 flex justify-around items-center py-4 bg-[#dfeef0] dark:bg-[#011b1b] border-t border-black/5 dark:border-white/10 z-30">
                    <div className="p-1.5 text-[#0f4c81] dark:text-[#2dd4bf] scale-110">
                        <Key className="w-6 h-6 transform -rotate-45" strokeWidth={2.5} />
                    </div>
                    <div className="p-1.5 text-slate-500 dark:text-slate-400">
                        <Home className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <div className="p-1.5 text-slate-500 dark:text-slate-400">
                        <Car className="w-6 h-6" strokeWidth={2} />
                    </div>
                </nav>
            </div>
        </div>
    );
}

export default function ParkingRentPage() {
    return (
        <Suspense fallback={<RentPageSkeleton />}>
            <RentPageContent />
        </Suspense>
    );
}