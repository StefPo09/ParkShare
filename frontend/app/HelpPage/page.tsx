'use client';

import React from 'react';
import { useLanguage } from '../components/LanguageProvider';

export default function HelpPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-[#dfeef0] px-4 py-8 text-[#121212] dark:bg-[#011b1b] dark:text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-black/5 bg-white/60 p-5 shadow-lg dark:border-white/10 dark:bg-white/5">
        <h1 className="text-2xl font-bold">{t('helpTitle')}</h1>
        <p className="mt-3 text-sm text-[#42565d] dark:text-[#9db0b6]">{t('helpIntro')}</p>

        <div className="mt-5 space-y-4">
          <article className="rounded-2xl border border-black/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
            <h2 className="font-semibold">{t('faq1Title')}</h2>
            <p className="mt-2 text-sm text-[#42565d] dark:text-[#9db0b6]">{t('faq1Text')}</p>
          </article>

          <article className="rounded-2xl border border-black/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
            <h2 className="font-semibold">{t('faq2Title')}</h2>
            <p className="mt-2 text-sm text-[#42565d] dark:text-[#9db0b6]">{t('faq2Text')}</p>
          </article>

          <article className="rounded-2xl border border-black/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
            <h2 className="font-semibold">{t('faq3Title')}</h2>
            <p className="mt-2 text-sm text-[#42565d] dark:text-[#9db0b6]">{t('faq3Text')}</p>
          </article>
        </div>
      </div>
    </main>
  );
}
