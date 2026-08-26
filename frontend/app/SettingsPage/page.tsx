'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import {
  X,
  Key,
  Home,
  Car,
  Sun,
  Moon,
  Laptop,
  Globe,
  Bell,
  Trash2,
  ShieldCheck,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('car');

  // State pentru preferințe
  const [theme, setTheme] = useState<'light' | 'dark' | 'device'>('device');
  const [language, setLanguage] = useState<'en' | 'ro' | 'de' | 'fr' | 'es'>('en');

  // State pentru notificări sistem
  const [notifications, setNotifications] = useState({
    push: true,
    sound: true
  });

  // State pentru Pop-up-ul Custom de Succes
  const [showModal, setShowModal] = useState(false);

  const toggleNotification = (field: 'push' | 'sound') => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleClearCache = () => {
    // Deschide modalul custom în loc de alert()
    setShowModal(true);
  };

  return (
      <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative">
        <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">

          {/* Header - Identic cu restul paginilor */}
          <header className="flex items-center justify-between px-5 pt-5">
            <div className="flex-1 text-center">
              <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
                Settings
              </h1>
            </div>
            <button
                aria-label="Close"
                onClick={() => router.back()}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
            >
              <X className="h-7 w-7" strokeWidth={2.2} />
            </button>
          </header>

          {/* Main Content */}
          <main className="flex-1 px-4 pt-6 overflow-y-auto space-y-4 pb-28 no-scrollbar">

            {/* --- THEME SELECTOR --- */}
            <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
              <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                App Theme
              </label>
              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white/40 p-1 dark:bg-black/20">
                <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        theme === 'light'
                            ? 'bg-[#0f4c81] text-white shadow-sm dark:bg-[#2dd4bf] dark:text-[#011b1b]'
                            : 'text-[#42565d] dark:text-[#9db0b6] hover:bg-white/30 dark:hover:bg-white/5'
                    }`}
                >
                  <Sun className="h-4 w-4" strokeWidth={2.2} />
                  <span>Light</span>
                </button>

                <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        theme === 'dark'
                            ? 'bg-[#0f4c81] text-white shadow-sm dark:bg-[#2dd4bf] dark:text-[#011b1b]'
                            : 'text-[#42565d] dark:text-[#9db0b6] hover:bg-white/30 dark:hover:bg-white/5'
                    }`}
                >
                  <Moon className="h-4 w-4" strokeWidth={2.2} />
                  <span>Dark</span>
                </button>

                <button
                    type="button"
                    onClick={() => setTheme('device')}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        theme === 'device'
                            ? 'bg-[#0f4c81] text-white shadow-sm dark:bg-[#2dd4bf] dark:text-[#011b1b]'
                            : 'text-[#42565d] dark:text-[#9db0b6] hover:bg-white/30 dark:hover:bg-white/5'
                    }`}
                >
                  <Laptop className="h-4 w-4" strokeWidth={2.2} />
                  <span>Device</span>
                </button>
              </div>
            </div>

            {/* --- LANGUAGE SELECTOR --- */}
            <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
              <label htmlFor="settings-lang" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                Language
              </label>
              <div className="relative flex items-center">
                <Globe className="absolute left-3 h-5 w-5 text-[#6f797d] dark:text-[#9db0b6]" strokeWidth={2} />

                <select
                    id="settings-lang"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="w-full rounded-xl border border-black/10 bg-white/60 pl-10 pr-10 py-2.5 text-[18px] font-medium text-[#121212] outline-none dark:border-white/10 dark:bg-white/5 dark:text-white cursor-pointer appearance-none relative z-10"
                >
                  <option value="en" className="text-black bg-white dark:bg-[#011b1b] dark:text-white">English (EN)</option>
                  <option value="ro" className="text-black bg-white dark:bg-[#011b1b] dark:text-white">Română (RO)</option>
                  <option value="de" className="text-black bg-white dark:bg-[#011b1b] dark:text-white">Deutsch (DE)</option>
                  <option value="fr" className="text-black bg-white dark:bg-[#011b1b] dark:text-white">Français (FR)</option>
                  <option value="es" className="text-black bg-white dark:bg-[#011b1b] dark:text-white">Español (ES)</option>
                </select>

                <div className="absolute right-3 pointer-events-none z-20 text-[#6f797d] dark:text-[#9db0b6]">
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* --- NOTIFICATIONS TOGGLES --- */}
            <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5 space-y-2">
              <label className="block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea] pl-1">
                Preferences
              </label>

              <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white/50 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#42565d] dark:text-[#d6e7ea]" />
                  <span className="text-[17px] font-medium text-[#121212] dark:text-white">Push Notifications</span>
                </div>
                <button
                    type="button"
                    onClick={() => toggleNotification('push')}
                    className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-200 ${
                        notifications.push ? 'bg-[#0f4c81] dark:bg-[#2dd4bf]' : 'bg-black/10 dark:bg-white/10'
                    }`}
                >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    notifications.push ? 'translate-x-6' : 'translate-x-1'
                }`} />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white/50 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-lg select-none">🔊</span>
                  <span className="text-[17px] font-medium text-[#121212] dark:text-white">In-App Sounds</span>
                </div>
                <button
                    type="button"
                    onClick={() => toggleNotification('sound')}
                    className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-200 ${
                        notifications.sound ? 'bg-[#0f4c81] dark:bg-[#2dd4bf]' : 'bg-black/10 dark:bg-white/10'
                    }`}
                >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    notifications.sound ? 'translate-x-6' : 'translate-x-1'
                }`} />
                </button>
              </div>
            </div>

            {/* --- STORAGE & UTILITIES --- */}
            <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
              <label className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea]">
                System & Maintenance
              </label>
              <button
                  type="button"
                  onClick={handleClearCache}
                  className="w-full flex items-center justify-between rounded-xl border border-black/10 bg-white/50 px-3 py-2.5 text-[17px] font-medium text-[#121212] outline-none transition cursor-pointer hover:bg-red-500/5 group dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                <div className="flex items-center gap-2 text-left">
                  <Trash2 className="h-5 w-5 text-[#6f797d] dark:text-[#9db0b6] group-hover:text-red-500 transition-colors" />
                  <div>
                    <p className="group-hover:text-red-500 transition-colors">Clear App Cache</p>
                    <p className="text-[12px] font-normal text-[#6f797d] dark:text-[#9db0b6] mt-0.5">Free up temporary local space</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-red-500 transition-colors" />
              </button>
            </div>

            {/* --- SUPPORT & LEGAL --- */}
            <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
              <label className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#d6e7ea] pl-1">
                Support & Legal
              </label>

              <div className="divide-y divide-black/5 dark:divide-white/5 bg-white/50 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
                <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-3 transition cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 text-left"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#42565d] dark:text-[#d6e7ea]" />
                    <span className="text-[17px] font-medium text-[#121212] dark:text-white">Terms of Service</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </button>

                <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-3 transition cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 text-left"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#42565d] dark:text-[#d6e7ea]" />
                    <span className="text-[17px] font-medium text-[#121212] dark:text-white">Privacy Policy</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </button>

                <button
                    type="button"
                    onClick={() => router.push(ROUTES.HELP)}
                    className="w-full flex items-center justify-between px-3 py-3 transition cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg select-none">❓</span>
                    <span className="text-[17px] font-medium text-[#121212] dark:text-white">Help & FAQ</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Versiunea Aplicației */}
            <div className="text-center pt-2 select-none">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#6f797d]/70 dark:text-[#9db0b6]/50">
                App Version 1.0.0 (2026)
              </p>
            </div>

          </main>

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

        {/* --- CUSTOM POP-UP MODAL (Glassmorphism, aceleași culori) --- */}
        {showModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity animate-fadeIn">
              <div className="w-full max-w-[280px] p-6 rounded-2xl border border-black/5 bg-white/90 text-center shadow-xl dark:border-white/10 dark:bg-[#011b1b]/95 animate-scaleUp">

                <div className="flex justify-center mb-3">
                  <CheckCircle2 className="h-12 w-12 text-[#0f4c81] dark:text-[#2dd4bf]" strokeWidth={2} />
                </div>

                <h3 className="text-lg font-bold text-[#121212] dark:text-white mb-1">
                  Success
                </h3>

                <p className="text-[14px] text-[#42565d] dark:text-[#9db0b6] mb-5">
                  Cache cleared successfully!
                </p>

                <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm active:scale-[0.98] cursor-pointer bg-[#0f4c81] text-white dark:bg-[#2dd4bf] dark:text-[#011b1b]"
                >
                  OK
                </button>
              </div>
            </div>
        )}
      </div>
  );
}