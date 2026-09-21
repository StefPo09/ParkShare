'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { Menu, ChevronRight, Plus, Car, Key, Home } from 'lucide-react';
import NavMenu from "../components/NavMenu";
import ProfileMenu from "../components/ProfileMenu";
import { useLanguage } from '../components/LanguageProvider';

interface CarItem {
    id: number;
    brand: string;
    model: string;
    license_plate: string;
    year?: number;
    color?: string;
    image_url?: string | null; // NOU
}

export default function ManageCarsPage() {
    const router = useRouter();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('car');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cars, setCars] = useState<CarItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'; // NOU

    useEffect(() => {
        const fetchCars = async () => {
            try {
                const response = await fetch(`${API}/api/cars`, {
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    setCars(data.cars || []);
                        } else {
                            const errText = `Server returned ${response.status}`;
                            console.error('Failed to fetch cars:', errText);
                            setErrorMessage(`Failed to load cars: ${response.statusText || response.status}`);
                        }
            } catch (error) {
                        console.error('Failed to fetch cars:', error);
                        setErrorMessage('Failed to fetch cars. Is the backend running and CORS configured?');
            } finally {
                        setIsLoading(false);
            }
        };
        fetchCars();
    }, [API]);

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
                        {t('manageYourCars')}
                    </h1>

                    <ProfileMenu />
                </header>

                <NavMenu
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                />

                {/* --- Lista de mașini --- */}
                <main className="flex-1 px-4 pt-6 pb-8 overflow-y-auto space-y-4">
                    {errorMessage ? (
                        <div className="mb-3 rounded-lg bg-red-500/20 border border-red-500 px-4 py-2 text-red-700 dark:text-red-300 text-sm">
                            {errorMessage}
                        </div>
                    ) : isLoading ? (
                        <div className="py-12 text-center text-sm text-slate-500">{t('loading')}</div>
                    ) : cars.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Car className="h-12 w-12 text-[#404b51] dark:text-slate-400 mb-2" />
                            <p className="text-[#404b51] dark:text-slate-400">No cars yet</p>
                        </div>
                    ) : (
                        cars.map((car) => (
                            <div
                                key={car.id}
                                onClick={() => router.push(`${ROUTES.EDIT_CAR}?id=${car.id}`)}
                                className="group relative flex items-center justify-between p-4 rounded-3xl bg-[#0f4c81] text-white shadow-[0_10px_25px_rgba(15,76,129,0.2)] transition-all duration-200 hover:scale-[1.01] hover:bg-[#0c3e67] cursor-pointer"
                            >
                                <div className="flex items-center space-x-4">
                                    {/* SCHIMBARE: afiseaza imaginea reala daca exista */}
                                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-[#e8e8e8] dark:bg-[#d7d7d7] flex items-center justify-center">
                                        {car.image_url ? (
                                            <img
                                                src={`${API}${car.image_url}`}
                                                alt={`${car.brand} ${car.model}`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <Car className="h-8 w-8 text-[#404b51]" strokeWidth={2} />
                                        )}
                                    </div>

                                    {/* Informații Mașină */}
                                    <div>
                                        <h2 className="text-lg font-bold leading-snug">{car.brand}</h2>
                                        <p className="text-sm font-medium text-slate-200/80">{car.license_plate} - {car.model}</p>
                                    </div>
                                </div>

                                {/* Săgeată Dreapta */}
                                <ChevronRight className="h-6 w-6 text-white/70 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
                            </div>
                        ))
                    )}
                </main>

                {/* --- Buton Add New Car --- */}
                <div className="px-4 pb-6 pt-2 mb-24">
                    <button
                        type="button"
                        onClick={() => router.push(ROUTES.ADD_CAR)}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0f4c81] px-5 py-3.5 text-base font-semibold text-white shadow-[0_16px_28px_rgba(15,76,129,0.28)] transition hover:bg-[#0c3e67] active:scale-[0.99]"
                    >
                        <span>{t('addNewCar')}</span>
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