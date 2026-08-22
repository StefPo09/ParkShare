'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X, ChevronRight, Plus, Car } from 'lucide-react';

interface CarItem {
    id: string;
    name: string;
    model: string;
    imageUrl?: string;
}

const mockCars: CarItem[] = [
    {
        id: '1',
        name: 'Personal car name',
        model: 'car model',
        imageUrl: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=400&q=80',
    },
    {
        id: '2',
        name: 'Personal car name 2',
        model: 'car model 2',
    },
];

export default function ManageCarsPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative font-sans">
            <div className="mx-auto flex h-screen w-full max-w-[430px] flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">

                {/* --- Header Navigation --- */}
                <header className="flex items-center justify-between px-5 pt-5 z-10">
                    <div className="w-9" />
                    <h1 className="text-[24px] font-bold tracking-tight text-[#121212] dark:text-white">
                        Manage your cars
                    </h1>
                    <button
                        aria-label="Close page"
                        onClick={() => router.push('/')}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
                    >
                        <X className="h-7 w-7" strokeWidth={2.2} />
                    </button>
                </header>

                {/* --- Lista de mașini --- */}
                <main className="flex-1 px-4 pt-6 pb-8 overflow-y-auto space-y-4">
                    {mockCars.map((car) => (
                        <div
                            key={car.id}
                            onClick={() => router.push('/EditCarPage')}
                            className="group relative flex items-center justify-between p-4 rounded-3xl bg-[#0f4c81] text-white shadow-[0_10px_25px_rgba(15,76,129,0.2)] transition-all duration-200 hover:scale-[1.01] hover:bg-[#0c3e67] cursor-pointer"
                        >
                            <div className="flex items-center space-x-4">
                                {/* Thumbnail Imagine / Icon Mașină */}
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-[#e8e8e8] dark:bg-[#d7d7d7] flex items-center justify-center">
                                    {car.imageUrl ? (
                                        <Image
                                            src={car.imageUrl}
                                            alt={car.name}
                                            fill
                                            sizes="64px"
                                            loading="eager"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <Car className="h-8 w-8 text-[#404b51]" strokeWidth={2} />
                                    )}
                                </div>

                                {/* Informații Mașină */}
                                <div>
                                    <h2 className="text-lg font-bold leading-snug">{car.name}</h2>
                                    <p className="text-sm font-medium text-slate-200/80">{car.model}</p>
                                </div>
                            </div>

                            {/* Săgeată Dreapta */}
                            <ChevronRight className="h-6 w-6 text-white/70 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
                        </div>
                    ))}
                </main>

                {/* --- Buton Add New Car --- */}
                <div className="px-4 pb-6 pt-2">
                    <button
                        type="button"
                        onClick={() => router.push('/AddCarPage')}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0f4c81] px-5 py-3.5 text-base font-semibold text-white shadow-[0_16px_28px_rgba(15,76,129,0.28)] transition hover:bg-[#0c3e67] active:scale-[0.99]"
                    >
                        <span>Add new car</span>
                        <Plus className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
}