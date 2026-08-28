'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../components/LanguageProvider';
import type { Language } from '../i18n/translations';
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
  CheckCircle2,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { theme: appTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'key' | 'home' | 'car'>('car');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedTheme: 'light' | 'dark' | 'device' =
    mounted && appTheme === 'dark'
      ? 'dark'
      : mounted && appTheme === 'light'
        ? 'light'
        : 'device';

  const handleThemeChange = (nextTheme: 'light' | 'dark' | 'device') => {
    setTheme(nextTheme === 'device' ? 'system' : nextTheme);
  };

  const [notifications, setNotifications] = useState({
    push: true,
    sound: true,
  });

  const [showModal, setShowModal] = useState(false);

  const toggleNotification = (field: 'push' | 'sound') => {
    setNotifications((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleClearCache = () => {
    setShowModal(true);
  };

  return (
    <div className="relative min-h-screen bg-[#dfeef0] px-0 py-0 dark:bg-[#011b1b]">
      <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_48%)] bg-[#dfeef0] text-[#121212] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_36%)] dark:bg-[#011b1b] dark:text-white">
        <header className="flex items-center justify-between px-5 pt-5">
          <div className="flex-1 text-center">
            <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">{t('settings')}</h1>
          </div>
          <button
            aria-label={t('close')}
            onClick={() => router.back()}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          >
            <X className="h-7 w-7" strokeWidth={2.2} />
          </button>
        </header>

        <main className="flex-1 space-y-4 overflow-y-auto px-4 pb-28 pt-6 no-scrollbar">
          <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
            <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#dfeef0]">
              {t('appTheme')}
            </label>
            <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white/40 p-1 dark:bg-white/5">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                  selectedTheme === 'light'
                    ? 'bg-[#0f4c81] text-white shadow-sm'
                    : 'text-[#42565d] hover:bg-white/30 dark:text-[#dfeef0] dark:hover:bg-white/10'
                }`}
              >
                <Sun className="h-4 w-4" strokeWidth={2.2} />
                <span>{t('light')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                  selectedTheme === 'dark'
                    ? 'bg-[#0f4c81] text-white shadow-sm'
                    : 'text-[#42565d] hover:bg-white/30 dark:text-[#dfeef0] dark:hover:bg-white/10'
                }`}
              >
                <Moon className="h-4 w-4" strokeWidth={2.2} />
                <span>{t('dark')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('device')}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                  selectedTheme === 'device'
                    ? 'bg-[#0f4c81] text-white shadow-sm'
                    : 'text-[#42565d] hover:bg-white/30 dark:text-[#dfeef0] dark:hover:bg-white/10'
                }`}
              >
                <Laptop className="h-4 w-4" strokeWidth={2.2} />
                <span>{t('device')}</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
            <label htmlFor="settings-lang" className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#dfeef0]">
              {t('language')}
            </label>
            <div className="relative flex items-center">
              <Globe className="absolute left-3 h-5 w-5 text-[#6f797d] dark:text-[#dfeef0]/80" strokeWidth={2} />
              <select
                id="settings-lang"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="relative z-10 w-full cursor-pointer appearance-none rounded-xl border border-black/10 bg-white/60 py-2.5 pl-10 pr-10 text-[18px] font-medium text-[#121212] outline-none transition dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                <option value="en" className="bg-white text-black">English (EN)</option>
                <option value="ro" className="bg-white text-black">Română (RO)</option>
                <option value="de" className="bg-white text-black">Deutsch (DE)</option>
                <option value="fr" className="bg-white text-black">Français (FR)</option>
                <option value="es" className="bg-white text-black">Español (ES)</option>
              </select>

              <div className="pointer-events-none absolute right-3 z-20 text-[#6f797d] dark:text-[#dfeef0]/80">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
            <label className="mb-1 block pl-1 text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#dfeef0]">
              {t('preferences')}
            </label>

            <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white/50 px-3 py-2.5 dark:border-white/10 dark:bg-white/10">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#42565d] dark:text-[#dfeef0]" />
                <span className="text-[17px] font-medium text-[#121212] dark:text-white">{t('pushNotifications')}</span>
              </div>
              <button
                type="button"
                onClick={() => toggleNotification('push')}
                className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-200 ${
                  notifications.push ? 'bg-[#0f4c81]' : 'bg-black/10 dark:bg-white/10'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  notifications.push ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white/50 px-3 py-2.5 dark:border-white/10 dark:bg-white/10">
              <div className="flex items-center gap-2">
                <span className="select-none text-lg">🔊</span>
                <span className="text-[17px] font-medium text-[#121212] dark:text-white">{t('inAppSounds')}</span>
              </div>
              <button
                type="button"
                onClick={() => toggleNotification('sound')}
                className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-200 ${
                  notifications.sound ? 'bg-[#0f4c81]' : 'bg-black/10 dark:bg-white/10'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  notifications.sound ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
            <label className="mb-1 block text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#dfeef0]">
              {t('systemMaintenance')}
            </label>
            <button
              type="button"
              onClick={handleClearCache}
              className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-black/10 bg-white/50 px-3 py-2.5 text-[17px] font-medium text-[#121212] transition hover:bg-red-500/5 dark:border-white/10 dark:bg-white/10 dark:text-white"
            >
              <div className="flex items-center gap-2 text-left">
                <Trash2 className="h-5 w-5 text-[#6f797d] transition-colors group-hover:text-red-500 dark:text-[#dfeef0]/80" />
                <div>
                  <p className="transition-colors group-hover:text-red-500">{t('clearCache')}</p>
                  <p className="mt-0.5 text-[12px] font-normal text-[#6f797d] dark:text-[#dfeef0]/70">{t('clearCacheSubtitle')}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-red-500" />
            </button>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white/20 p-2 dark:border-white/10 dark:bg-white/5">
            <label className="mb-1 block pl-1 text-[12px] font-medium uppercase tracking-[0.12em] text-[#42565d] dark:text-[#dfeef0]">
              {t('supportLegal')}
            </label>

            <div className="divide-y divide-black/5 overflow-hidden rounded-xl border border-black/10 bg-white/50 dark:divide-white/10 dark:border-white/10 dark:bg-white/10">
              <button type="button" className="flex w-full items-center justify-between px-3 py-3 text-left transition cursor-pointer hover:bg-white/40 dark:hover:bg-white/5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#42565d] dark:text-[#dfeef0]" />
                  <span className="text-[17px] font-medium text-[#121212] dark:text-white">{t('termsOfService')}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>

              <button type="button" className="flex w-full items-center justify-between px-3 py-3 text-left transition cursor-pointer hover:bg-white/40 dark:hover:bg-white/5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#42565d] dark:text-[#dfeef0]" />
                  <span className="text-[17px] font-medium text-[#121212] dark:text-white">{t('privacyPolicy')}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => router.push(ROUTES.HELP)}
                className="flex w-full items-center justify-between px-3 py-3 text-left transition cursor-pointer hover:bg-white/40 dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-2">
                  <span className="select-none text-lg">❓</span>
                  <span className="text-[17px] font-medium text-[#121212] dark:text-white">{t('helpFaq')}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="select-none pt-2 text-center">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#6f797d]/70 dark:text-[#dfeef0]/70">
              {t('appVersion')}
            </p>
          </div>
        </main>

        <nav className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-black/5 bg-[#dfeef0] py-4 dark:border-white/10 dark:bg-[#011b1b]">
          <button
            onClick={() => { setActiveTab('key'); router.push(ROUTES.RENT); }}
            className={`cursor-pointer rounded-full p-1.5 transition-all ${
              activeTab === 'key' ? 'scale-110 text-[#0f4c81] dark:text-[#7dd3fc]' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Key className="h-6 w-6 -rotate-45" strokeWidth={activeTab === 'key' ? 2.5 : 2} />
          </button>

          <button
            onClick={() => { setActiveTab('home'); router.push(ROUTES.HOME); }}
            className={`cursor-pointer rounded-full p-1.5 transition-all ${
              activeTab === 'home' ? 'scale-110 text-[#0f4c81] dark:text-[#7dd3fc]' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Home className="h-6 w-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          </button>

          <button
            onClick={() => { setActiveTab('car'); router.push(ROUTES.MANAGE_CAR); }}
            className={`cursor-pointer rounded-full p-1.5 transition-all ${
              activeTab === 'car' ? 'scale-110 text-[#0f4c81] dark:text-[#7dd3fc]' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Car className="h-6 w-6" strokeWidth={activeTab === 'car' ? 2.5 : 2} />
          </button>
        </nav>
      </div>

      {showModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-70 rounded-2xl border border-black/5 bg-white/90 p-6 text-center shadow-xl dark:border-white/10 dark:bg-[#0a1d1d]">
            <div className="mb-3 flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-[#0f4c81]" strokeWidth={2} />
            </div>

            <h3 className="mb-1 text-lg font-bold text-[#121212] dark:text-white">{t('success')}</h3>
            <p className="mb-5 text-[14px] text-[#42565d] dark:text-[#dfeef0]/80">{t('cacheCleared')}</p>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full rounded-xl bg-[#0f4c81] px-2.5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.98]"
            >
              {t('ok')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}