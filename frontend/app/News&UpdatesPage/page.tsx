'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Car, Crown, Home, Key, MapPin, Menu, Newspaper } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../components/LanguageProvider';
import NavMenu from '../components/NavMenu';
import ProfileMenu from '../components/ProfileMenu';

const updates = [
  {
    icon: MapPin,
    titleKey: 'newsNearbyTitle',
    descriptionKey: 'newsNearbyDescription',
    actionKey: 'newsExploreSpots',
    href: ROUTES.RENT,
    accent: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
  {
    icon: Crown,
    titleKey: 'premiumPageTitle',
    descriptionKey: 'newsPremiumDescription',
    actionKey: 'newsExplorePremium',
    href: ROUTES.PREMIUM,
    accent: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  {
    icon: Car,
    titleKey: 'newsManageTitle',
    descriptionKey: 'newsManageDescription',
    actionKey: 'newsManageSpots',
    href: ROUTES.MANAGE_SPOT,
    accent: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
];

export default function NewsUpdatesPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="relative min-h-screen bg-[#dfeef0] px-0 py-0 text-[#121212] dark:bg-[#011b1b] dark:text-white">
      <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[#dfeef0] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[#011b1b]">
        <header className="z-10 flex items-center justify-between bg-[#dfeef0] px-5 pb-3 pt-5 dark:bg-[#011b1b]">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          >
            <Menu className="h-6 w-6" strokeWidth={2.2} />
          </button>
          <h1 className="text-[28px] font-bold tracking-tight">{t('parkShare')}</h1>
          <ProfileMenu />
        </header>

        <NavMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6">
          <div className="mx-auto max-w-md">
            <section className="overflow-hidden rounded-[30px] border border-black/5 bg-white/60 p-5 shadow-lg dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf]">
                <Newspaper className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f4c81] dark:text-[#2dd4bf]">
                {t('newsLatestLabel')}
              </p>
              <h2 className="mt-2 text-2xl font-bold">{t('newsUpdates')}</h2>
              <p className="mt-2 text-sm leading-6 text-[#42565d] dark:text-[#9db0b6]">
                {t('newsUpdatesIntro')}
              </p>
            </section>

            <div className="mt-5 space-y-3">
              {updates.map(({ icon: Icon, titleKey, descriptionKey, actionKey, href, accent }) => (
                <article
                  key={titleKey}
                  className="rounded-3xl border border-black/5 bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accent}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{t(titleKey)}</h3>
                      <p className="mt-1.5 text-sm leading-6 text-[#42565d] dark:text-[#9db0b6]">
                        {t(descriptionKey)}
                      </p>
                      <button
                        type="button"
                        onClick={() => router.push(href)}
                        className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-[#0f4c81] transition hover:gap-3 dark:text-[#2dd4bf]"
                      >
                        {t(actionKey)}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </main>
      </div>

      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex w-screen items-center justify-around border-t border-black/5 bg-[#dfeef0] pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#011b1b]"
      >
        <button
          type="button"
          aria-label={t('searchSpotOffers')}
          onClick={() => router.push(ROUTES.RENT)}
          className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Key className="h-6 w-6 -rotate-45" strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label={t('parkShare')}
          onClick={() => router.push(ROUTES.HOME)}
          className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Home className="h-6 w-6" strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label={t('manageYourCars')}
          onClick={() => router.push(ROUTES.MANAGE_CAR)}
          className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Car className="h-6 w-6" strokeWidth={2} />
        </button>
      </nav>
    </div>
  );
}
