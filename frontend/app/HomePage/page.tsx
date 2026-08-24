'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { Menu, Search, ChevronRight, Car, Home, Key } from 'lucide-react';
import ProfileMenu from '../components/ProfileMenu';
import NavMenu from '../components/NavMenu';

const parkingListings = [
  {
    id: 1,
    title: 'Seller name 1',
    name: 'NAME 1',
    address: 'Address 1',
    price: '$1099',
    image:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    title: 'Seller name 2',
    name: 'NAME 2',
    address: 'Address 2',
    price: '$501',
    image:
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    title: 'Seller name 3',
    name: 'NAME 3',
    address: 'Address 3',
    price: '$99',
    image:
      'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative">
      <div className="mx-auto flex h-screen w-full max-w-[430px] flex-col overflow-hidden bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[#011b1b] dark:text-white">
        <header className="flex items-center justify-between px-5 pt-5 pb-3 z-10 bg-[#dfeef0] dark:bg-[#011b1b]">
          <button
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          >
            <Menu className="h-6 w-6" strokeWidth={2.2} />
          </button>

          <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
            Park Share
          </h1>

          <ProfileMenu />
        </header>

        <NavMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-2">
          <button
            type="button"
            onClick={() => router.push(ROUTES.RENT)}
            className="mb-5 flex w-full cursor-pointer items-center justify-between rounded-[28px] bg-[#9ccdff] px-4 py-4 shadow-[0_8px_18px_rgba(15,76,129,0.18)] transition hover:brightness-[0.98] dark:bg-[#244f86]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff4b3d] text-base font-bold text-white shadow-md">
                1
              </span>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0d4bb5] text-[82px] font-bold leading-none text-white shadow-inner">
                <span className="translate-y-[-2px]">P</span>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end">
              <span className="mr-2 text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
                Manage parking
                <span className="block">spots</span>
              </span>
            </div>

            <ChevronRight className="ml-2 h-12 w-12 text-[#121212] dark:text-white" strokeWidth={2.5} />
          </button>

          <button
            type="button"
            onClick={() => router.push(ROUTES.MANAGE_CAR)}
            className="mb-5 flex w-full cursor-pointer items-center justify-between rounded-[28px] bg-[#9ccdff] px-4 py-4 shadow-[0_8px_18px_rgba(15,76,129,0.18)] transition hover:brightness-[0.98] dark:bg-[#244f86]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff4b3d] text-base font-bold text-white shadow-md">
                1
              </span>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f6f6f6] text-[82px] font-bold leading-none text-[#121212] shadow-inner">
                <Car className="h-[52px] w-[52px] text-[#0f4c81] dark:text-[#0f4c81]" strokeWidth={2.4} />
              </div>
            </div>

            <div className="flex flex-1 items-center justify-end">
              <span className="mr-2 text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
                Manage your
                <span className="block">cars</span>
              </span>
            </div>

            <ChevronRight className="ml-2 h-12 w-12 text-[#121212] dark:text-white" strokeWidth={2.5} />
          </button>

          <div className="mb-5 flex h-[74px] items-center rounded-[30px] border-[3px] border-[#121212] bg-transparent px-4 text-[#121212] dark:border-[#dfeaf0] dark:text-white">
            <span className="flex-1 text-[28px] font-normal tracking-[-0.04em] text-[#121212] dark:text-white">
              Search spot offers
            </span>
            <Search className="h-9 w-9 text-[#121212] dark:text-white" strokeWidth={2.2} />
          </div>

          <div className="mb-4 flex items-center justify-between text-[#121212] dark:text-white">
            <span className="text-[28px] font-bold tracking-tight">Spots in city, country</span>
            <ChevronRight className="h-8 w-8" strokeWidth={2.5} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {parkingListings.map((spot) => (
              <div key={spot.id} className="min-w-0">
                <div className="relative h-[170px] overflow-hidden rounded-[24px] bg-[#d9d9d9]">
                  <Image
                    src={spot.image}
                    alt={spot.title}
                    fill
                    sizes="(max-width: 430px) 33vw, 130px"
                    className="object-cover"
                  />
                </div>

                <div className="mt-2">
                  <p className="text-lg font-medium text-[#121212] dark:text-white">{spot.title}</p>
                  <p className="text-xl font-bold text-[#121212] dark:text-white">{spot.name}</p>
                  <p className="text-lg font-medium text-[#121212] dark:text-white">{spot.address}</p>
                  <p className="text-[23px] font-bold text-[#121212] dark:text-white">{spot.price}</p>
                </div>
              </div>
            ))}
          </div>
        </main>

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
