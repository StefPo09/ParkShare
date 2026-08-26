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
            <div
                onClick={onClose}
                aria-hidden="true"
                className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            />

            <aside
                className={`fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col justify-between border-r border-black/5 bg-[#dfeef0]/95 px-5 py-6 text-[#121212] shadow-[5px_0_30px_rgba(15,32,35,0.15)] transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div>
                    <div className="flex items-center justify-between border-b border-black/5 pb-6">
                        <h2 className="text-[20px] font-bold tracking-tight text-[#121212]">
                            {t('parkShare')}
                        </h2>
                        <button
                            onClick={onClose}
                            aria-label="Close menu"
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5"
                        >
                            <X className="h-6 w-6" strokeWidth={2.2} />
                        </button>
                    </div>

                    <nav className="mt-6 space-y-2">
                        <button
                            onClick={() => { router.push(ROUTES.NOTIFICATIONS); onClose(); }}
                            className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 text-left text-base font-semibold text-[#121212] transition duration-200 hover:border-black/5 hover:bg-white/40 active:scale-[0.99]"
                        >
                            <Bell className="h-5 w-5 text-[#42565d]" strokeWidth={2.2} />
                            <span className="tracking-wide">{t('notifications')}</span>
                        </button>

                        <button
                            onClick={() => { router.push(ROUTES.MANAGE_CAR); onClose(); }}
                            className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 text-left text-base font-semibold text-[#121212] transition duration-200 hover:border-black/5 hover:bg-white/40 active:scale-[0.99]"
                        >
                            <Car className="h-5 w-5 text-[#42565d]" strokeWidth={2.2} />
                            <span className="tracking-wide">{t('manageYourCars')}</span>
                        </button>

                        <button
                            onClick={() => { router.push(ROUTES.MANAGE_SPOT || '/manage-spots'); onClose(); }}
                            className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 text-left text-base font-semibold text-[#121212] transition duration-200 hover:border-black/5 hover:bg-white/40 active:scale-[0.99]"
                        >
                            <MapPin className="h-5 w-5 text-[#42565d]" strokeWidth={2.2} />
                            <span className="tracking-wide">{t('manageYourSpots')}</span>
                        </button>

                        <button
                            onClick={() => { router.push(ROUTES.SETTINGS); onClose(); }}
                            className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 text-left text-base font-semibold text-[#121212] transition duration-200 hover:border-black/5 hover:bg-white/40 active:scale-[0.99]"
                        >
                            <Settings className="h-5 w-5 text-[#42565d]" strokeWidth={2.2} />
                            <span className="tracking-wide">{t('settings')}</span>
                        </button>

                        <hr className="my-4 border-black/5" />

                        <button
                            onClick={() => { router.push(ROUTES.NEWS_UPDATES); onClose(); }}
                            className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 text-left text-base font-semibold text-[#121212] transition duration-200 hover:border-black/5 hover:bg-white/40 active:scale-[0.99]"
                        >
                            <Newspaper className="h-5 w-5 text-[#42565d]" strokeWidth={2.2} />
                            <span className="tracking-wide">{t('newsUpdates')}</span>
                        </button>

                        <button
                            onClick={() => { router.push(ROUTES.HELP); onClose(); }}
                            className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-transparent px-4 py-3.5 text-left text-base font-semibold text-[#121212] transition duration-200 hover:border-black/5 hover:bg-white/40 active:scale-[0.99]"
                        >
                            <HelpCircle className="h-5 w-5 text-[#42565d]" strokeWidth={2.2} />
                            <span className="tracking-wide">{t('help')}</span>
                        </button>
                    </nav>
                </div>

                <footer className="px-4 text-[12px] font-semibold uppercase tracking-wider text-[#42565d]">
                    © 2026 TripleDoubleEspresso
                </footer>
            </aside>
        </>
    );
}
