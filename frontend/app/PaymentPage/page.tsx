'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Menu,
    User,
    ChevronRight,
    ChevronDown,
    Plus,
    HelpCircle,
    Key,
    Home,
    Car,
} from 'lucide-react';
import NavMenu from '../components/NavMenu';

export default function RentFormPage() {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('home');

    return (
        <div className="relative flex flex-col min-h-screen w-full max-w-md mx-auto overflow-hidden bg-white dark:bg-[#061512] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
            {/* --- Top Header Navigation --- */}
            <header className="flex items-center justify-between px-5 py-4 bg-[#B2F5EA] dark:bg-[#0d2a24] text-[#0d3b36] dark:text-[#a0ece0] transition-colors duration-300 z-10 shadow-sm">
                <button
                    aria-label="Open menu"
                    onClick={() => setIsMenuOpen(true)}
                    className="p-1 hover:opacity-80 transition-opacity"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold tracking-wide">Park Share</h1>
                <button
                    aria-label="User profile"
                    onClick={() => router.push('/ProfilePage')}
                    className="p-1 hover:opacity-80 transition-opacity"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center overflow-hidden">
                        <User className="w-6 h-6 text-slate-600 dark:text-slate-300 fill-current" />
                    </div>
                </button>
            </header>

            <NavMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* --- Main Content Area --- */}
            <main className="flex-1 bg-[#D8F3ED] dark:bg-[#07211C] rounded-t-3xl p-5 shadow-2xl transition-colors duration-300 z-20 space-y-5 overflow-y-auto">
                {/* Title & Spot Details */}
                <div>
                    <h2 className="text-xl font-bold text-[#114B43] dark:text-[#a0ece0] mb-1">
                        Rent parking spot
                    </h2>
                    <p className="text-xs text-[#2D6A61] dark:text-[#2dd4bf] mb-2.5">
                        Renting spot at: Parking spot address
                    </p>
                    <button className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border border-[#2D6A61] dark:border-white text-[#114B43] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition">
                        View details
                        <ChevronRight className="w-3 h-3 fill-current" />
                    </button>
                </div>

                {/* Section: Car Info */}
                <div className="space-y-2.5">
                    <h3 className="text-sm font-semibold text-[#114B43] dark:text-[#a0ece0]">
                        Car info:
                    </h3>

                    <input
                        type="text"
                        placeholder="Car registration plate..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-black/60 border border-transparent dark:border-white/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />

                    <div className="relative w-full">
                        <select
                            defaultValue=""
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-black/60 border border-transparent dark:border-white/80 text-slate-900 dark:text-white text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                        >
                            <option value="" disabled hidden>
                                Car model...
                            </option>
                            <option value="sedan">Sedan</option>
                            <option value="suv">SUV</option>
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
                    </div>

                    <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Legal documents..."
                                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-black/60 border border-transparent dark:border-white/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                            />
                            <Plus className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-slate-300 cursor-pointer" />
                        </div>
                        <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 cursor-pointer" />
                    </div>

                    <div>
                        <button className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border border-[#2D6A61] dark:border-white text-[#114B43] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition">
                            Use own car
                            <ChevronRight className="w-3 h-3 fill-current" />
                        </button>
                    </div>
                </div>

                {/* Section: Payment Info */}
                <div className="space-y-2.5">
                    <h3 className="text-sm font-semibold text-[#114B43] dark:text-[#a0ece0]">
                        Payment info:
                    </h3>

                    <div className="relative w-full">
                        <select
                            defaultValue=""
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-black/60 border border-transparent dark:border-white/80 text-slate-900 dark:text-white text-xs appearance-none focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                        >
                            <option value="" disabled hidden>
                                Choose payment method...
                            </option>
                            <option value="card">Credit Card</option>
                        </select>
                        <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" />
                    </div>

                    <input
                        type="text"
                        placeholder="Card number..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-black/60 border border-transparent dark:border-white/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />

                    <div className="flex w-full gap-2.5">
                        <input
                            type="text"
                            placeholder="Expiration date..."
                            maxLength={5}
                            className="w-1/2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-black/60 border border-transparent dark:border-white/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 min-w-0"
                        />

                        <input
                            type="text"
                            placeholder="Security code..."
                            maxLength={4}
                            className="w-1/2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-black/60 border border-transparent dark:border-white/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 min-w-0"
                        />
                    </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 flex justify-center">
                    <button className="px-8 py-3 bg-[#0A4B75] hover:bg-[#083c5e] dark:bg-[#0284c7] dark:hover:bg-[#0369a1] text-white font-medium text-base rounded-xl shadow-md transition-all active:scale-95">
                        Confirm purchase
                    </button>
                </div>
            </main>

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