'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { Menu, ChevronRight, Plus, Key, Home, MapPin, Car } from 'lucide-react';
import NavMenu from "../components/NavMenu";
import ProfileMenu from "../components/ProfileMenu";

interface SpotItem {
    id: string;
    name: string;
    address: string;
    imageUrl?: string;
}

const mockSpots: SpotItem[] = [
    {
        id: '1',
        name: 'Custom spot name',
        address: 'Parking spot address',
        imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=400&q=80',
    },
    {
        id: '2',
        name: 'Downtown Garage Spot',
        address: 'Main Street 123',
    },
];

export default function ManageSpotsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('key');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative font-sans">
            <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">

                {/* --- Header Navigation --- */}
                <header className="flex items-center justify-between px-5 pt-5 pb-3 z-10">
                    <button
                        aria-label="Open menu"
                        onClick={() => setIsMenuOpen(true)}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                    >
                        <Menu className="w-6 h-6" strokeWidth={2.2} />
                    </button>

                    <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
                        Manage your spots
                    </h1>

                    <ProfileMenu />
                </header>

                <NavMenu
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                />

                {/* --- Lista de locuri de parcare --- */}
                <main className="flex-1 px-4 pt-6 pb-8 overflow-y-auto space-y-4">
                    {mockSpots.map((spot) => (
                        <div
                            key={spot.id}
                            onClick={() => router.push(ROUTES.EDIT_SPOT || '/edit-spot')}
                            className="group relative flex items-center justify-between p-4 rounded-3xl bg-[#0f4c81] text-white shadow-[0_10px_25px_rgba(15,76,129,0.2)] transition-all duration-200 hover:scale-[1.01] hover:bg-[#0c3e67] cursor-pointer"
                        >
                            <div className="flex items-center space-x-4">
                                {/* Thumbnail Imagine / Icon Spot */}
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-[#e8e8e8] dark:bg-[#d7d7d7] flex items-center justify-center">
                                    {spot.imageUrl ? (
                                        <Image
                                            src={spot.imageUrl}
                                            alt={spot.name}
                                            fill
                                            sizes="64px"
                                            loading="eager"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <MapPin className="h-8 w-8 text-[#404b51]" strokeWidth={2} />
                                    )}
                                </div>

                                {/* Informații Spot */}
                                <div>
                                    <h2 className="text-lg font-bold leading-snug">{spot.name}</h2>
                                    <p className="text-sm font-medium text-slate-200/80">{spot.address}</p>
                                </div>
                            </div>

                            {/* Săgeată Dreapta */}
                            <ChevronRight className="h-6 w-6 text-white/70 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
                        </div>
                    ))}
                </main>

                {/* --- Buton Add New Spot --- */}
                <div className="px-4 pb-6 pt-2 mb-24">
                    <button
                        type="button"
                        onClick={() => router.push(ROUTES.ADD_SPOT)}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0f4c81] px-5 py-3.5 text-base font-semibold text-white shadow-[0_16px_28px_rgba(15,76,129,0.28)] transition hover:bg-[#0c3e67] active:scale-[0.99]"
                    >
                        <span>Add new spot</span>
                        <Plus className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                </div>

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
                        onClick={() => { setActiveTab('car'); router.push(ROUTES.MANAGE_SPOT); }}
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