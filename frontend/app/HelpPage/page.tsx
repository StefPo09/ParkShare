'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Car, Home, Key, Menu } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../components/LanguageProvider';
import NavMenu from '../components/NavMenu';
import ProfileMenu from '../components/ProfileMenu';

export default function HelpPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  return (
    <div className="relative min-h-screen bg-[#dfeef0] px-0 py-0 text-[#121212] dark:bg-[#011b1b] dark:text-white">
      <div className="mx-auto flex h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[#dfeef0] shadow-[0_25px_50px_rgba(15,32,35,0.12)] transition-colors duration-300 dark:bg-[#011b1b]">
        <header className="z-10 flex items-center justify-between bg-[#dfeef0] px-5 pt-5 pb-3 dark:bg-[#011b1b]">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          >
            <Menu className="h-6 w-6" strokeWidth={2.2} />
          </button>
          <h1 className="text-[28px] font-bold tracking-tight text-[#121212] dark:text-white">
            {t('parkShare')}
          </h1>
          <ProfileMenu />
        </header>

        <NavMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        <main className="flex-1 overflow-y-auto px-4 pt-8 pb-24 text-[#121212] dark:text-white">
          <div className="mx-auto max-w-md">
            <div className="rounded-3xl border border-black/5 bg-white/60 p-5 shadow-lg dark:border-white/10 dark:bg-white/5">
              <h2 className="text-2xl font-bold">{t('helpTitle')}</h2>
              <p className="mt-3 text-sm text-[#42565d] dark:text-[#9db0b6]">{t('helpIntro')}</p>

              <div className="mt-5 space-y-4">
                <article className="rounded-2xl border border-black/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                  <h3 className="font-semibold">{t('faq1Title')}</h3>
                  <p className="mt-2 text-sm text-[#42565d] dark:text-[#9db0b6]">{t('faq1Text')}</p>
                </article>

                <article className="rounded-2xl border border-black/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                  <h3 className="font-semibold">{t('faq2Title')}</h3>
                  <p className="mt-2 text-sm text-[#42565d] dark:text-[#9db0b6]">{t('faq2Text')}</p>
                </article>

                <article className="rounded-2xl border border-black/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                  <h3 className="font-semibold">{t('faq3Title')}</h3>
                  <p className="mt-2 text-sm text-[#42565d] dark:text-[#9db0b6]">{t('faq3Text')}</p>
                </article>
              </div>

            </div>
          </div>
        </main>

      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex w-screen items-center justify-around border-t border-black/5 bg-[#dfeef0] pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#011b1b]">
        <a
          href={ROUTES.RENT}
          onClick={(e) => { e.preventDefault(); router.push(ROUTES.RENT); }}
          className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Key className="h-6 w-6 -rotate-45" strokeWidth={2} />
        </a>

        <a
          href={ROUTES.HOME}
          onClick={(e) => { e.preventDefault(); router.push(ROUTES.HOME); }}
          aria-current="page"
          className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Home className="h-6 w-6" strokeWidth={2} />
        </a>

        <a
          href={ROUTES.MANAGE_CAR}
          onClick={(e) => { e.preventDefault(); router.push(ROUTES.MANAGE_CAR); }}
          className="cursor-pointer rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Car className="h-6 w-6" strokeWidth={2} />
        </a>
      </nav>
    </div>
  );
}
