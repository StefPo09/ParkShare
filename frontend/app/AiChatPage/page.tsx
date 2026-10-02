'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Car, Home, Key, Menu } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../components/LanguageProvider';
import AiChatConversation from '../components/AiChatConversation';
import NavMenu from '../components/NavMenu';
import ProfileMenu from '../components/ProfileMenu';

export default function AiChatPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#dfeef0] text-[#121212] dark:bg-[#011b1b] dark:text-white">
      <div className="flex h-full w-full flex-col overflow-hidden bg-[#dfeef0] dark:bg-[#011b1b]">
        <header className="z-10 flex items-center justify-between bg-[#dfeef0] px-5 pb-3 pt-5 dark:bg-[#011b1b]">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          >
            <Menu className="h-6 w-6" strokeWidth={2.2} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">{t('parkShare')}</h1>
          <ProfileMenu />
        </header>

        <NavMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        <main className="flex min-h-0 flex-1 flex-col px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6">
          <div className="flex min-h-0 w-full flex-1 flex-col">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f4c81]/10 text-[#0f4c81] dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf]">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t('aiChatTitle')}</h2>
                <p className="text-sm text-[#42565d] dark:text-[#9db0b6]">{t('aiChatIntro')}</p>
              </div>
            </div>
            <AiChatConversation fullHeight privacyText={t('aiChatPrivacyWarning')} />
          </div>
        </main>
      </div>

      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-50 flex w-screen items-center justify-around border-t border-black/5 bg-[#dfeef0] pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#011b1b]"
      >
        <a
          href={ROUTES.RENT}
          onClick={(event) => { event.preventDefault(); router.push(ROUTES.RENT); }}
          aria-label={t('searchSpotOffers')}
          className="rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Key className="h-6 w-6 -rotate-45" strokeWidth={2} />
        </a>
        <a
          href={ROUTES.HOME}
          onClick={(event) => { event.preventDefault(); router.push(ROUTES.HOME); }}
          aria-label={t('parkShare')}
          className="rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Home className="h-6 w-6" strokeWidth={2} />
        </a>
        <a
          href={ROUTES.MANAGE_CAR}
          onClick={(event) => { event.preventDefault(); router.push(ROUTES.MANAGE_CAR); }}
          aria-label={t('manageYourCars')}
          className="rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400"
        >
          <Car className="h-6 w-6" strokeWidth={2} />
        </a>
      </nav>
    </div>
  );
}
