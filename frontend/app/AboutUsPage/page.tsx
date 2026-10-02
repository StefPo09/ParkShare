'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Car, HeartHandshake, Home, Key, ParkingCircle } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../components/LanguageProvider';
import NavMenu from '../components/NavMenu';
import ProfileMenu from '../components/ProfileMenu';
import MenuButton from '../components/MenuButton';

export default function AboutUsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="relative min-h-screen bg-[#dfeef0] px-0 py-0 text-[#121212] dark:bg-[#011b1b] dark:text-white">
      <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[#dfeef0] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[#011b1b]">
        <header className="z-10 flex items-center justify-between bg-[#dfeef0] px-5 pt-5 pb-3 dark:bg-[#011b1b]">
          <MenuButton
            onClick={() => setIsMenuOpen(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          />
          <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
            {t('parkShare')}
          </h1>
          <ProfileMenu />
        </header>

        <NavMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        <main className="flex-1 overflow-y-auto px-4 pt-8 pb-24 text-[#121212] dark:text-white">
          <div className="mx-auto max-w-md space-y-5">
            <section className="rounded-3xl border border-black/5 bg-white/60 p-5 shadow-lg dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf]">
                <ParkingCircle className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold">{t('aboutTitle')}</h2>
              <p className="mt-3 text-sm leading-6 text-[#42565d] dark:text-[#9db0b6]">
                {t('aboutIntro')}
              </p>
            </section>

            <section className="rounded-3xl border border-black/5 bg-white/60 p-5 shadow-lg dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start gap-3">
                <HeartHandshake className="mt-0.5 h-5 w-5 shrink-0 text-[#0f4c81] dark:text-[#2dd4bf]" />
                <div>
                  <h3 className="font-semibold">{t('aboutMissionTitle')}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#42565d] dark:text-[#9db0b6]">
                    {t('aboutMissionText')}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-black/5 bg-white/60 p-5 shadow-lg dark:border-white/10 dark:bg-white/5">
              <h3 className="font-semibold">{t('aboutHowTitle')}</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Key className="mt-0.5 h-5 w-5 shrink-0 -rotate-45 text-[#0f4c81] dark:text-[#2dd4bf]" />
                  <p className="text-sm leading-6 text-[#42565d] dark:text-[#9db0b6]">
                    {t('aboutDriversText')}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Car className="mt-0.5 h-5 w-5 shrink-0 text-[#0f4c81] dark:text-[#2dd4bf]" />
                  <p className="text-sm leading-6 text-[#42565d] dark:text-[#9db0b6]">
                    {t('aboutOwnersText')}
                  </p>
                </div>
              </div>
            </section>

            <a
              href={ROUTES.HELP}
              onClick={(event) => {
                event.preventDefault();
                router.push(ROUTES.HELP);
              }}
              className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/60 p-4 text-sm font-semibold shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <span>{t('aboutNeedHelp')}</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex w-screen items-center justify-around border-t border-black/5 bg-[#dfeef0] pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#011b1b]">
        <a
          href={ROUTES.RENT}
          onClick={(event) => {
            event.preventDefault();
            router.push(ROUTES.RENT);
          }}
          aria-label={t('rentParkingSpot')}
          className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Key className="h-6 w-6 -rotate-45" strokeWidth={2} />
        </a>
        <a
          href={ROUTES.HOME}
          onClick={(event) => {
            event.preventDefault();
            router.push(ROUTES.HOME);
          }}
          aria-label="Home"
          aria-current="page"
          className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Home className="h-6 w-6" strokeWidth={2} />
        </a>
        <a
          href={ROUTES.MANAGE_CAR}
          onClick={(event) => {
            event.preventDefault();
            router.push(ROUTES.MANAGE_CAR);
          }}
          aria-label={t('manageYourCars')}
          className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Car className="h-6 w-6" strokeWidth={2} />
        </a>
      </nav>
    </div>
  );
}
