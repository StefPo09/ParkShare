'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { getApiBaseUrl } from '../../constants/api';
import { Menu, ChevronRight, Plus, Key, Home, MapPin, Car } from 'lucide-react';
import NavMenu from "../components/NavMenu";
import ProfileMenu from "../components/ProfileMenu";
import { useLanguage } from '../components/LanguageProvider';

interface SpotItem {
    id: number;
    title: string;
    address: string;
    description?: string;
    price_per_day: number;
    price_currency?: string;
    image_url?: string | null;
}

export default function ManageSpotsPage() {
    const router = useRouter();
    const { t } = useLanguage();

    const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('key');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [spots, setSpots] = useState<SpotItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const API = getApiBaseUrl();

    const fetchSpots = useCallback(async () => {
        setIsLoading(true);

        try {
            const response = await fetch(`${API}/api/my-spots`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });

            if (!response.ok) {
                console.error(
                    'Failed to fetch spots:',
                    response.status,
                    response.statusText
                );
                setSpots([]);
                return;
            }

            const data = await response.json();
            setSpots(data.spots || []);
        } catch (error) {
            console.error('Failed to fetch spots:', error);
            setSpots([]);
        } finally {
            setIsLoading(false);
        }
    }, [API]);

    useEffect(() => {
        fetchSpots();
    }, [fetchSpots]);

    return (
        <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative font-sans">
            <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[#dfeef0] text-[#121212] dark:bg-[#011b1b] dark:text-white">

                {/* Header */}
                <header className="flex items-center justify-between px-5 pt-5 pb-3 z-10">
                    <button
                        aria-label="Open menu"
                        onClick={() => setIsMenuOpen(true)}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
                    >
                        <Menu className="w-6 h-6" strokeWidth={2.2} />
                    </button>

                    <h1 className="text-[28px] font-bold tracking-tight">
                        {t('manageYourSpots')}
                    </h1>

                    <ProfileMenu />
                </header>

                <NavMenu
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                />

                {/* Spots */}
                <main className="flex-1 px-4 pt-6 pb-8 overflow-y-auto space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            Loading spots...
                        </div>
                    ) : spots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <MapPin className="h-12 w-12 mb-2" />
                            <p>No parking spots yet</p>
                        </div>
                    ) : (
                        spots.map((spot) => {
                            const currency = spot.price_currency || 'RON';
                            return (
                                <div
                                    key={spot.id}
                                    onClick={() =>
                                        router.push(
                                            `${ROUTES.EDIT_SPOT}?id=${spot.id}`
                                        )
                                    }
                                    className="group relative flex items-center justify-between p-4 rounded-3xl bg-[#0f4c81] text-white shadow-[0_10px_25px_rgba(15,76,129,0.2)] cursor-pointer"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#e8e8e8] flex items-center justify-center">
                                            {spot.image_url ? (
                                                <img
                                                    src={`${API}${spot.image_url}`}
                                                    alt={spot.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <MapPin
                                                    className="h-8 w-8 text-[#404b51]"
                                                    strokeWidth={2}
                                                />
                                            )}
                                        </div>

                                        <div>
                                            <h2 className="text-lg font-bold leading-snug">
                                                {spot.title}
                                            </h2>

                                            <p className="text-sm font-medium text-slate-200/80">
                                                {spot.address}
                                            </p>

                                            <p className="text-sm font-semibold mt-1">
                                                {currency === 'RON'
                                                    ? `${spot.price_per_day} RON/day`
                                                    : `${currency}${spot.price_per_day}/day`}
                                            </p>
                                        </div>
                                    </div>

                                    <ChevronRight
                                        className="h-6 w-6 text-white/70"
                                        strokeWidth={2.2}
                                    />
                                </div>
                            );
                        })
                    )}
                </main>

                {/* Add */}
                <div className="px-4 pb-6 pt-2 mb-24">
                    <button
                        type="button"
                        onClick={() => router.push(ROUTES.ADD_SPOT)}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0f4c81] px-5 py-3.5 text-base font-semibold text-white"
                    >
                        <span>{t('addNewSpot')}</span>
                        <Plus className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Bottom nav */}
                <nav className="absolute bottom-0 left-0 right-0 flex justify-around items-center py-4 bg-[#dfeef0] dark:bg-[#011b1b] border-t border-black/5 dark:border-white/10 z-30">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('key');
                            router.push(ROUTES.RENT);
                        }}
                        className={`p-1.5 transition-all cursor-pointer rounded-full ${
                            activeTab === 'key' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Key className="w-6 h-6 transform -rotate-45" strokeWidth={activeTab === 'key' ? 2.5 : 2} />
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('home');
                            router.push(ROUTES.HOME);
                        }}
                        className={`p-1.5 transition-all cursor-pointer rounded-full ${
                            activeTab === 'home' ? 'text-[#0f4c81] dark:text-[#2dd4bf] scale-110' : 'text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Home className="w-6 h-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('car');
                            router.push(ROUTES.MANAGE_CAR);
                        }}
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