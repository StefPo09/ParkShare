'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import {
  X,
  Key,
  Home,
  Car,
  SunMoon,
  Globe,
  Bell,
  Trash2,
  ShieldCheck,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('car');

  // State pentru preferințe
  const [theme, setTheme] = useState<'light' | 'dark' | 'device'>('device');
  const [language, setLanguage] = useState<'en' | 'ro' | 'de' | 'fr' | 'es'>('en');

  // State pentru alte setări utile non-account
  const [notifications, setNotifications] = useState({
    push: true,
    emailAlerts: false, // doar alerte de sistem, nu modifică emailul
    sound: true
  });

  const toggleNotification = (field: 'push' | 'emailAlerts' | 'sound') => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleClearCache = () => {
    window.alert('Cache cleared successfully!');
  };

  return (
      <div className="min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b] relative">
        <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">

          {/* Header */}
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
          <main className="flex-1 px-4 pt-4 overflow-y-auto space-y-5 pb-28 no-scrollbar">

            {/* --- SECTION 1: THEME --- */}
            <div className="space-y-2 px-2">
              <div className="flex items-center gap-2 pl-1 text-[#114B43] dark:text-[#2dd4bf]">
                <SunMoon className="h-4 w-4" />
                <h3 className="text-[12px] font-bold uppercase tracking-[0.15em]">
                  Theme Customization
                </h3>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5 space-y-1">
                {[
                  { id: 'light', label: 'Light Mode' },
                  { id: 'dark', label: 'Dark Mode' },
                  { id: 'device', label: 'Device Settings' }
                ].map((option) => (
                    <button
                        key={option.id}
                        onClick={() => setTheme(option.id as any)}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-[16px] font-medium transition cursor-pointer hover:bg-white/40 dark:hover:bg-white/5"
                    >
                      <span className="text-[#121212] dark:text-white">{option.label}</span>
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[#0f4c81] dark:border-[#2dd4bf]">
                        {theme === option.id && (
                            <div className="h-2.5 w-2.5 rounded-full bg-[#0f4c81] dark:bg-[#2dd4bf]" />
                        )}
                      </div>
                    </button>
                ))}
              </div>
            </div>

            {/* --- SECTION 2: LANGUAGE --- */}
            <div className="space-y-2 px-2">
              <div className="flex items-center gap-2 pl-1 text-[#114B43] dark:text-[#2dd4bf]">
                <Globe className="h-4 w-4" />
                <h3 className="text-[12px] font-bold uppercase tracking-[0.15em]">
                  Language
                </h3>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2.5 text-[16px] font-medium text-[#121212] outline-none dark:border-white/10 dark:bg-[#022525] dark:text-white cursor-pointer"
                >
                  <option value="en">English (EN)</option>
                  <option value="ro">Română (RO)</option>
                  <option value="de">Deutsch (DE)</option>
                  <option value="fr">Français (FR)</option>
                  <option value="es">Español (ES)</option>
                </select>
              </div>
            </div>

            {/* --- SECTION 3: NOTIFICATIONS --- */}
            <div className="space-y-2 px-2">
              <div className="flex items-center gap-2 pl-1 text-[#114B43] dark:text-[#2dd4bf]">
                <Bell className="h-4 w-4" />
                <h3 className="text-[12px] font-bold uppercase tracking-[0.15em]">
                  Notifications
                </h3>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5 space-y-2">
                {[
                  { id: 'push', label: 'Push Notifications' },
                  { id: 'emailAlerts', label: 'System Email Alerts' },
                  { id: 'sound', label: 'In-App Sounds' }
                ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-2">
                  <span className="text-[16px] font-medium text-[#121212] dark:text-white">
                    {item.label}
                  </span>
                      <button
                          type="button"
                          onClick={() => toggleNotification(item.id as any)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer ${
                              notifications[item.id as keyof typeof notifications]
                                  ? 'bg-[#0f4c81] dark:bg-[#2dd4bf]'
                                  : 'bg-black/10 dark:bg-white/10'
                          }`}
                      >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            notifications[item.id as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                      </button>
                    </div>
                ))}
              </div>
            </div>

            {/* --- SECTION 4: STORAGE & CACHE --- */}
            <div className="space-y-2 px-2">
              <div className="flex items-center gap-2 pl-1 text-[#114B43] dark:text-[#2dd4bf]">
                <Trash2 className="h-4 w-4" />
                <h3 className="text-[12px] font-bold uppercase tracking-[0.15em]">
                  Storage & Cache
                </h3>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
                <button
                    type="button"
                    onClick={handleClearCache}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition cursor-pointer hover:bg-red-500/5 group text-left"
                >
                  <div>
                    <p className="text-[16px] font-medium text-[#121212] dark:text-white group-hover:text-red-500 transition-colors">
                      Clear App Cache
                    </p>
                    <p className="text-[12px] text-[#6f797d] dark:text-[#9db0b6]">
                      Free up space by deleting cached images
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                </button>
              </div>
            </div>

            {/* --- SECTION 5: LEGAL & SUPPORT --- */}
            <div className="space-y-2 px-2">
              <div className="flex items-center gap-2 pl-1 text-[#114B43] dark:text-[#2dd4bf]">
                <ShieldCheck className="h-4 w-4" />
                <h3 className="text-[12px] font-bold uppercase tracking-[0.15em]">
                  Support & Legal
                </h3>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5 divide-y divide-black/5 dark:divide-white/5">
                <button className="w-full flex items-center justify-between rounded-xl px-3 py-3 transition cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 text-left">
                  <span className="text-[16px] font-medium text-[#121212] dark:text-white">Terms of Service</span>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </button>
                <button className="w-full flex items-center justify-between rounded-xl px-3 py-3 transition cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 text-left">
                  <span className="text-[16px] font-medium text-[#121212] dark:text-white">Privacy Policy</span>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </button>
                <button className="w-full flex items-center justify-between rounded-xl px-3 py-3 transition cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 text-left">
                  <span className="text-[16px] font-medium text-[#121212] dark:text-white">Help & FAQ</span>
                  <HelpCircle className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <p className="text-center text-[11px] text-[#6f797d] dark:text-[#9db0b6] pt-2">
                App Version 1.4.2 (2026)
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
      </div>
  );
}