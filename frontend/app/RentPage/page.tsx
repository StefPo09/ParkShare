'use client';

import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import {
    Menu,
    User,
    MapPin,
    Clock,
    Key,
    Home,
    Car,
} from 'lucide-react';
import NavMenu from "../components/NavMenu";

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
    const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('home');
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
        <div className="relative flex flex-col h-screen w-full max-w-md mx-auto overflow-hidden bg-white dark:bg-[#061512] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">

            {/* --- Top Header Navigation --- */}
            <header className="flex items-center justify-between px-5 py-4 bg-[#B2F5EA] dark:bg-[#0d2a24] text-[#0d3b36] dark:text-[#a0ece0] transition-colors duration-300 z-10 shadow-sm">
                <button aria-label="Open menu"
                        onClick={() => setIsMenuOpen(true)}
                        className="p-1 hover:opacity-80 transition-opacity">
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold tracking-wide">Park Share</h1>
                <button aria-label="User profile"
                        onClick={() => router.push("/ProfilePage")}
                        className="p-1 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center overflow-hidden">
                        <User className="w-6 h-6 text-slate-600 dark:text-slate-300 fill-current" />
                    </div>
                </button>
            </header>

            <NavMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
            />

            {/* --- Google Map Container --- */}
            <main className="relative flex-1 bg-slate-100 dark:bg-[#121c1a] overflow-hidden">
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={mapCenter}
                        zoom={14}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        options={{
                            disableDefaultUI: true, // Hides standard map controls for a clean UI
                            zoomControl: false,
                            styles: isDarkMode ? darkMapStyle : [],
                        }}
                    >
                        {mockSpots.map((spot) => {
                            const isSelected = selectedSpot.id === spot.id;

                            // Custom Marker Icons using SVG Data URLs
                            const redPinSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="%23ef4444" stroke="%23dc2626" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;
                            const greyPinSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="%2394a3b8" stroke="%2364748b" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;

                            return (
                                <MarkerF
                                    key={spot.id}
                                    position={{ lat: spot.lat, lng: spot.lng }}
                                    onClick={() => setSelectedSpot(spot)}
                                    label={{
                                        text: `$${spot.price}/h`,
                                        color: isSelected ? '#ffffff' : '#475569',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        className: isSelected
                                            ? 'bg-black px-2 py-0.5 rounded-full shadow'
                                            : 'bg-white px-2 py-0.5 rounded-full shadow border border-slate-200',
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
                    <div className="flex items-center justify-center h-full text-slate-400">
                        Loading Map...
                    </div>
                )}
            </main>

            {/* --- Bottom Drawer / Rental Details --- */}
            <section className="bg-[#D8F3ED] dark:bg-[#07211C] rounded-t-3xl p-4 shadow-2xl transition-colors duration-300 z-20">
                <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />

                <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-3 shadow-inner">
                    <Image
                        src={selectedSpot.image}
                        alt={selectedSpot.address}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-white" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    </div>
                </div>

                <h2 className="text-lg font-semibold text-[#114B43] dark:text-[#38bdf8] mb-1">
                    {selectedSpot.address}
                </h2>

                <div className="flex items-center space-x-4 text-xs text-[#2D6A61] dark:text-[#2dd4bf] mb-4">
                    <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{selectedSpot.availability}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedSpot.distance}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-[#114B43] dark:text-[#38bdf8]">
              ${selectedSpot.price}
            </span>
                        <span className="text-xs text-[#2D6A61] dark:text-[#2dd4bf]">/ hour</span>
                    </div>

                    <button className="px-8 py-2.5 bg-[#0A4B75] hover:bg-[#083c5e] dark:bg-[#0284c7] dark:hover:bg-[#0369a1] text-white font-medium text-lg rounded-xl shadow-md transition-all active:scale-95">
                        Rent
                    </button>
                </div>
            </section>

            {/* --- Bottom Navigation Bar --- */}
            <nav className="flex justify-around items-center py-3 bg-[#D8F3ED] dark:bg-[#07211C] border-t border-teal-200/30 dark:border-teal-900/40 z-20">
                <button
                    onClick={() => setActiveTab('key')}
                    className={`p-2 transition-colors ${
                        activeTab === 'key'
                            ? 'text-black dark:text-white'
                            : 'text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white'
                    }`}
                >
                    <Key className="w-6 h-6 transform -rotate-45" />
                </button>

                <button
                    onClick={() => setActiveTab('home')}
                    className={`p-2 transition-colors ${
                        activeTab === 'home'
                            ? 'text-black dark:text-white'
                            : 'text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white'
                    }`}
                >
                    <Home className="w-6 h-6" />
                </button>

                <button
                    onClick={() => setActiveTab('car')}
                    className={`p-2 transition-colors ${
                        activeTab === 'car'
                            ? 'text-black dark:text-white'
                            : 'text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white'
                    }`}
                >
                    <Car className="w-6 h-6" />
                </button>
            </nav>
        </div>
    );
}