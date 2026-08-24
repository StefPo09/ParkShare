'use client';

import { useRouter } from "next/navigation";
import { ROUTES } from '../../constants/routes';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import {
    Menu,
    MapPin,
    Clock,
    Key,
    Home,
    Car,
} from 'lucide-react';
import NavMenu from "../components/NavMenu";
import ProfileMenu from "../components/ProfileMenu";

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

export default function ParkingRentPage() {
    const [selectedSpot, setSelectedSpot] = useState<ParkingSpot>(mockSpots[0]);
    const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('key');
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Load Google Maps SDK
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    });

    // Detect browser/system theme preferences
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
                        Park Share
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
                            center={mapCenter}
                            zoom={14}
                            onLoad={onLoad}
                            onUnmount={onUnmount}
                            options={{
                                disableDefaultUI: true,
                                zoomControl: false,
                                styles: isDarkMode ? darkMapStyle : [],
                            }}
                        >
                            {mockSpots.map((spot) => {
                                const isSelected = selectedSpot.id === spot.id;

                                const redPinSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="%23ef4444" stroke="%23dc2626" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;
                                const greyPinSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="%2342565d" stroke="%2364748b" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;

                                return (
                                    <MarkerF
                                        key={spot.id}
                                        position={{ lat: spot.lat, lng: spot.lng }}
                                        onClick={() => setSelectedSpot(spot)}
                                        label={{
                                            text: `$${spot.price}/h`,
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
                            Loading Map...
                        </div>
                    )}
                </main>

                {/* --- Bottom Drawer / Rental Details --- */}
                <section className="bg-white/40 dark:bg-[#011b1b]/95 border-t border-black/5 dark:border-white/10 backdrop-blur-md rounded-t-4xl p-5 shadow-[0_-15px_30px_rgba(15,32,35,0.08)] transition-colors duration-300 z-20">
                    <div className="w-12 h-1.5 bg-black/10 dark:bg-white/10 rounded-full mx-auto mb-4" />

                    <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-4 shadow-[inset_0_2px_10px_rgba(15,23,42,0.08)] border border-black/5 dark:border-white/5">
                        <Image
                            src={selectedSpot.image}
                            alt={selectedSpot.address}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 bg-black/20 px-2 py-1 rounded-full backdrop-blur-xs">
                            <span className="w-2 h-2 rounded-full bg-white" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                        </div>
                    </div>

                    <h2 className="text-[20px] font-bold tracking-tight text-[#121212] dark:text-white mb-1">
                        {selectedSpot.address}
                    </h2>

                    <div className="flex items-center space-x-4 text-[13px] font-medium text-[#42565d] dark:text-[#d6e7ea] mb-5">
                        <div className="flex items-center space-x-1.5">
                            <Clock className="w-4 h-4 text-[#6f797d] dark:text-[#9db0b6]" strokeWidth={2} />
                            <span>{selectedSpot.availability}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <MapPin className="w-4 h-4 text-[#6f797d] dark:text-[#9db0b6]" strokeWidth={2} />
                            <span>{selectedSpot.distance}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pb-20">
                        <div className="flex items-baseline space-x-0.5">
                            <span className="text-[26px] font-extrabold tracking-tight text-[#121212] dark:text-white">
                                ${selectedSpot.price}
                            </span>
                            <span className="text-sm font-medium text-[#6f797d] dark:text-[#9db0b6]">/ hour</span>
                        </div>

                        <button className="px-8 py-3.5 cursor-pointer bg-[#0f4c81] hover:bg-[#0c3e67] text-white font-semibold text-base rounded-2xl shadow-[0_12px_24px_rgba(15,76,129,0.24)] transition-all active:scale-95">
                            Rent
                        </button>
                    </div>
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