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
        // Replace with your actual image path or remote URL
        imageUrl: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=400&q=80',
    },
    {
        id: '2',
        name: 'Personal car name 2',
        model: 'car model 2',
    },
];

export default () => {
    return (
        <div className="relative flex flex-col h-screen w-full max-w-md mx-auto overflow-y-auto bg-[#B2F5EA] dark:bg-[#061512] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">

            {/* --- Top Header Navigation --- */}
            <header className="flex items-center justify-between px-5 py-5 z-10">
                <div className="w-6" /> {/* Spacer to center title */}
                <h1 className="text-xl font-bold tracking-wide text-slate-900 dark:text-white">
                    Manage your cars
                </h1>
                <button
                    aria-label="Close page"
                    className="p-1 text-slate-800 dark:text-slate-200 hover:opacity-70 transition-opacity cursor-pointer"
                >
                    <X className="w-6 h-6" />
                </button>
            </header>

            {/* --- Car List Content --- */}
            <main className="flex-1 px-5 pt-4 pb-8 space-y-4">
                {mockCars.map((car) => (
                    <div
                        key={car.id}
                        className="relative flex items-center justify-between p-4 rounded-2xl bg-[#0A4B75] dark:bg-[#0A4B75] text-white shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                    >
                        <div className="flex items-center space-x-4">
                            {/* Car Image Thumbnail Container */}
                            <div className="relative w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-300 flex items-center justify-center overflow-hidden border-2 border-white/20 shrink-0">
                                {car.imageUrl ? (
                                    <Image
                                        src={car.imageUrl}
                                        alt={car.name}
                                        fill
                                        sizes="80px"
                                        loading="eager"
                                        className="object-cover"
                                    />
                                ) : (
                                    <Car className="w-10 h-10 text-slate-800" />
                                )}
                            </div>

                            {/* Car Info */}
                            <div>
                                <h2 className="text-lg font-bold leading-snug">{car.name}</h2>
                                <p className="text-sm text-slate-300 font-medium">{car.model}</p>
                            </div>
                        </div>

                        {/* Right Arrow Icon */}
                        <ChevronRight className="w-5 h-5 text-white/80 shrink-0" />
                    </div>
                ))}

                {/* --- Add New Car Button --- */}
                <button
                    onClick={() => console.log('Add new car clicked')}
                    className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-2xl bg-[#83D8E9] dark:bg-[#073830] text-[#0A4B75] dark:text-[#a0ece0] font-semibold text-lg shadow-sm hover:opacity-90 active:scale-[0.99] transition-all border border-teal-400/20 cursor-pointer"
                >
                    <span>Add new car</span>
                    <Plus className="w-6 h-6" />
                </button>
            </main>
        </div>
    );
}