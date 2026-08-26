'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from './LanguageProvider';
import {
    X,
    Bell,
    Car,
    MapPin,
    Settings,
    Newspaper,
    HelpCircle,
} from 'lucide-react';

interface NavMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NavMenu({ isOpen, onClose }: NavMenuProps) {
    const router = useRouter();
    const { t } = useLanguage();
    return (
        <>
            {/* --- Backdrop Overlay --- */}
            <div
                onClick={onClose}
                aria-hidden="true"
                className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity duration-300 ${
                    isOpen
                        ? 'opacity-100 pointer-events-auto'
                        : 'opacity-0 pointer-events-none'
                }`}
            />

            {/* --- Side Drawer Menu --- */}
            <aside
                className={`fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col justify-between py-6 px-5 transition-transform duration-300 ease-in-out shadow-[5px_0_30px_rgba(15,32,35,0.15)] bg-[#dfeef0]/95 bg-[#011b1b]/95 backdrop-blur-md text-[#121212] text-white border-r border-black/5 border-white/10 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Top Header */}
                <div>
                    <div className="flex items-center justify-between pb-6 border-b border-black/5 border-white/10">
                        <h2 className="text-[20px] font-bold tracking-tight text-[#121212] text-white">
                            {t('parkShare')}
                        </h2>
                        <button
                            onClick={onClose}
                            aria-label="Close menu"
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 text-white hover:bg-white/5"
                        >
                            <X className="h-6 w-6" strokeWidth={2.2} />
                        </button>
                    </div>

                    {/* Navigation Links Group */}
                    <nav className="mt-6 space-y-2">
                        <button
                            onClick={() => { router.push(ROUTES.NOTIFICATIONS); onClose(); }}
                            className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 text-left text-base font-semibold text-[#121212] transition duration-200 hover:border-black/5 hover:bg-white/40 text-white hover:border-white/5 hover:bg-white/5 active:scale-[0.99]"
                        >
                            <Bell className="h-5 w-5 text-[#42565d] text-[#9db0b6]" strokeWidth={2.2} />
                            <span className="tracking-wide">{t('notifications')}</span>
                        </button>

                        <button
                            onClick={() => { router.push(ROUTES.MANAGE_CAR); onClose(); }}
                            className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 text-left text-base font-semibold text-[#121212] transition duration-200 hover:border-black/5 hover:bg-white/40 text-white hover:border-white/5 hover:bg-white/5 active:scale-[0.99]"
                        >
                            <Car className="h-5 w-5 text-[#42565d] text-[#9db0b6]" strokeWidth={2.2} />
                            <span className="tracking-wide">{t('manageYourCars')}</span>
                        </button>

                        <button
                            onClick={() => { router.push(ROUTES.MANAGE_SPOT || '/manage-spots'); onClose(); }}
                            className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 text-left text-base font-semibold text-[#121212] transition duration-200 hover:border-black/5 hover:bg-white/40 text-white hover:border-white/5 hover:bg-white/5 active:scale-[0.99]"
                        >
                            <MapPin className="h-5 w-5 text-[#42565d] text-[#9db0b6]" strokeWidth={2.2} />
                            <span className="tracking-wide">{t('manageYourSpots')}</span>
                        </button>

                        <button
                            onClick={() => { router.push(ROUTES.SETTINGS); onClose(); }}
                            className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 text-left text-base font-semibold text-[#121212] transition duration-200 hover:border-black/5 hover:bg-white/40 text-white hover:border-white/5 hover:bg-white/5 active:scale-[0.99]"
                        >
                            <Settings className="h-5 w-5 text-[#42565d] text-[#9db0b6]" strokeWidth={2.2} />
                            <span className="tracking-wide">{t('settings')}</span>
                        </button>

                        <hr className="my-4 border-black/5 border-white/10" />

                        <button
                            onClick={() => { router.push(ROUTES.NEWS_UPDATES); onClose(); }}
                            className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 text-left text-base font-semibold text-[#121212] transition duration-200 hover:border-black/5 hover:bg-white/40 text-white hover:border-white/5 hover:bg-white/5 active:scale-[0.99]"
                        >
                            <Newspaper className="h-5 w-5 text-[#42565d] text-[#9db0b6]" strokeWidth={2.2} />
                            <span className="tracking-wide">{t('newsUpdates')}</span>
                        </button>

                        <button
                            onClick={() => { router.push(ROUTES.HELP); onClose(); }}
                            className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 text-left text-base font-semibold text-[#121212] transition duration-200 hover:border-black/5 hover:bg-white/40 text-white hover:border-white/5 hover:bg-white/5 active:scale-[0.99]"
                        >
                            <HelpCircle className="h-5 w-5 text-[#42565d] text-[#9db0b6]" strokeWidth={2.2} />
                            <span className="tracking-wide">{t('help')}</span>
                        </button>
                    </nav>
                </div>

                {/* Footer Brand Copyright */}
                <footer className="px-4 text-[12px] text-[#42565d] text-[#9db0b6] font-semibold uppercase tracking-wider">
                    © 2026 TripleDoubleEspresso
                </footer>
            </aside>
        </>
    );
}