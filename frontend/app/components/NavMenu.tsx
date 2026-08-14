'use client';

import React from 'react';
import {
    X,
    Bell,
    Car,
    Settings,
    Newspaper,
    HelpCircle,
} from 'lucide-react';

interface NavMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NavMenu({ isOpen, onClose }: NavMenuProps) {
    return (
        <>
            {/* --- Backdrop Overlay --- */}
            <div
                onClick={onClose}
                aria-hidden="true"
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
                    isOpen
                        ? 'opacity-100 pointer-events-auto'
                        : 'opacity-0 pointer-events-none'
                }`}
            />

            {/* --- Side Drawer Menu --- */}
            <aside
                className={`fixed top-0 left-0 bottom-0 z-50 w-3/4 max-w-xs flex flex-col justify-between py-6 px-5 transition-transform duration-300 ease-in-out shadow-2xl bg-[#D8F3ED] dark:bg-[#07211C] text-[#0d3b36] dark:text-[#a0ece0] ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Top Header */}
                <div>
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-teal-800/20 dark:border-teal-700/30">
                        <h2 className="text-xl font-bold tracking-wide text-slate-900 dark:text-white">
                            Park Share
                        </h2>
                        <button
                            onClick={onClose}
                            aria-label="Close menu"
                            className="p-1 text-slate-700 dark:text-slate-200 hover:opacity-70 transition-opacity"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation Links Group 1 */}
                    <nav className="space-y-5 text-sm font-medium">
                        <button
                            onClick={() => console.log('Notifications clicked')}
                            className="flex items-center space-x-3.5 w-full text-left text-slate-800 dark:text-slate-200 hover:opacity-80 transition-opacity"
                        >
                            <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                            <span>Notifications</span>
                        </button>

                        <button
                            onClick={() => console.log('Manage cars clicked')}
                            className="flex items-center space-x-3.5 w-full text-left text-slate-800 dark:text-slate-200 hover:opacity-80 transition-opacity"
                        >
                            <Car className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                            <span>Manage your cars</span>
                        </button>

                        <button
                            onClick={() => console.log('Settings clicked')}
                            className="flex items-center space-x-3.5 w-full text-left text-slate-800 dark:text-slate-200 hover:opacity-80 transition-opacity"
                        >
                            <Settings className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                            <span>Settings</span>
                        </button>

                        <hr className="my-4 border-teal-800/20 dark:border-teal-700/30" />

                        {/* Navigation Links Group 2 */}
                        <button
                            onClick={() => console.log('News clicked')}
                            className="flex items-center space-x-3.5 w-full text-left text-slate-800 dark:text-slate-200 hover:opacity-80 transition-opacity"
                        >
                            <Newspaper className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                            <span>News & Updates</span>
                        </button>

                        <button
                            onClick={() => console.log('Help clicked')}
                            className="flex items-center space-x-3.5 w-full text-left text-slate-800 dark:text-slate-200 hover:opacity-80 transition-opacity"
                        >
                            <HelpCircle className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                            <span>Help</span>
                        </button>
                    </nav>
                </div>

                {/* Footer Brand Copyright */}
                <footer className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    © 2026 TripleDoubleEspresso
                </footer>
            </aside>
        </>
    );
}