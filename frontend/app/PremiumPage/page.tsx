'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Car, Check, Crown, Home, Key, Menu, Percent, Sparkles } from 'lucide-react';
import { getApiBaseUrl } from '../../constants/api';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from '../components/LanguageProvider';
import NavMenu from '../components/NavMenu';
import ProfileMenu from '../components/ProfileMenu';

type PremiumStatus = {
  is_premium: boolean;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export default function PremiumPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadStatus = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const checkout = searchParams.get('checkout');
      const checkoutSessionId = searchParams.get('session_id');
      const attempts = checkout === 'success' ? 8 : 1;
      let premiumConfirmed = false;

      for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
          const API = getApiBaseUrl();
          const response = checkout === 'success' && checkoutSessionId
            ? await fetch(`${API}/api/premium/confirm`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              cache: 'no-store',
              body: JSON.stringify({ session_id: checkoutSessionId }),
            })
            : await fetch(`${API}/api/premium/status`, {
              credentials: 'include',
              cache: 'no-store',
            });
          const data = response.ok ? await response.json() as PremiumStatus : null;
          if (cancelled) return;
          if (response.status === 202 && attempt < attempts - 1) {
            await new Promise((resolve) => window.setTimeout(resolve, 2000));
            continue;
          }
          if (!data) {
            const errorData = await response.json().catch(() => null) as { error?: string } | null;
            setError(errorData?.error || t('premiumErrorGeneric'));
            break;
          }
          setStatus(data);
          premiumConfirmed = Boolean(data.is_premium);
          if (premiumConfirmed || checkout !== 'success' || attempt === attempts - 1) break;
          await new Promise((resolve) => window.setTimeout(resolve, 2000));
        } catch {
          if (!cancelled) setError(t('premiumErrorGeneric'));
          break;
        }
      }

      if (cancelled) return;
      if (checkout === 'success' && !premiumConfirmed) {
        setNotice(t('premiumWaiting'));
      } else if (premiumConfirmed) {
        setNotice(t('premiumActive'));
      } else if (checkout === 'cancelled') {
        setNotice(t('premiumCheckoutCancelled'));
      }
      window.dispatchEvent(new Event('parkshare-premium-updated'));
      setIsLoading(false);
    };

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const startBillingAction = async (path: 'checkout' | 'portal') => {
    setIsWorking(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/premium/${path}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok || typeof data.url !== 'string') {
        throw new Error(data.error || t('premiumErrorGeneric'));
      }
      window.location.assign(data.url);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('premiumErrorGeneric'));
      setIsWorking(false);
    }
  };

  const benefits = [
    { icon: Percent, text: t('premiumFeatureDiscount') },
    { icon: BadgeCheck, text: t('premiumFeaturePriority') },
    { icon: Sparkles, text: t('premiumFeaturePromotion') },
  ];

  return (
    <div className="min-h-screen bg-[#f8f3e4] text-[#302817] dark:bg-[#17150f] dark:text-[#fff9e9]">
      <div className="relative mx-auto flex min-h-screen w-full max-w-107.5 flex-col overflow-hidden bg-[#f8f3e4] shadow-[0_25px_50px_rgba(120,82,12,0.12)] dark:bg-[#17150f]">
        <header className="relative z-30 flex items-center justify-between border-b border-amber-900/10 bg-[#fbf5e6] px-5 pb-3 pt-5 dark:border-amber-200/10 dark:bg-[#17150f]">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#302817] transition hover:bg-amber-500/10 dark:text-white"
          >
            <Menu className="h-6 w-6" strokeWidth={2.2} />
          </button>
          <h1 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-amber-800 dark:text-amber-300">
            <Crown className="h-5 w-5" />
            {t('parkShare')}
          </h1>
          <ProfileMenu />
        </header>

        <NavMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        <main className="flex-1 overflow-y-auto px-5 py-7 pb-28">
          <section className="mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-[32px] border border-amber-400/40 bg-gradient-to-br from-[#fff9e8] via-[#fbf3dd] to-[#f2dfae] p-7 shadow-[0_24px_70px_rgba(120,82,12,0.16)] dark:from-[#282316] dark:via-[#211d13] dark:to-[#342a16] sm:p-10">
              <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20">
                  <Crown className="h-7 w-7" />
                </span>
                <span className="text-xs font-black uppercase tracking-[0.22em]">ParkShare</span>
              </div>

              <h2 className="mt-7 text-4xl font-black tracking-tight sm:text-5xl">{t('premiumPageTitle')}</h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-[#6b5a35] dark:text-[#dbcda9]">{t('premiumIntro')}</p>
              <p className="mt-6 text-3xl font-extrabold text-amber-700 dark:text-amber-300">
                {t('premiumSubscriptionPrice')}
              </p>

              <div className="mt-8 grid gap-3">
                {benefits.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 rounded-2xl border border-amber-800/10 bg-white/55 p-4 dark:border-amber-200/10 dark:bg-black/15">
                    <Icon className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
                    <span className="text-sm font-semibold">{text}</span>
                  </div>
                ))}
              </div>

              {isLoading && <p className="mt-6 text-sm text-[#6b5a35] dark:text-[#dbcda9]">{t('premiumWaiting')}</p>}
              {notice && <p role="status" className="mt-6 text-sm font-semibold text-amber-800 dark:text-amber-200">{notice}</p>}
              {error && <p role="alert" className="mt-6 text-sm font-semibold text-red-600 dark:text-red-300">{error}</p>}
              {status?.cancel_at_period_end && (
                <p className="mt-4 text-sm font-semibold text-amber-800 dark:text-amber-200">{t('premiumCancelPeriod')}</p>
              )}

              <div className="mt-8">
                {status?.is_premium ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200">
                      <Check className="h-5 w-5" /> {t('premiumActive')}
                    </span>
                    <button
                      type="button"
                      disabled={isWorking}
                      onClick={() => void startBillingAction('portal')}
                      className="cursor-pointer rounded-xl bg-[#302817] px-5 py-3 text-sm font-bold text-white transition hover:bg-black disabled:opacity-60 dark:bg-amber-300 dark:text-[#211a0c] dark:hover:bg-amber-200"
                    >
                      {t('premiumManageSubscription')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isWorking || isLoading}
                    onClick={() => void startBillingAction('checkout')}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-amber-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-amber-900/20 transition hover:bg-amber-700 disabled:cursor-wait disabled:opacity-60"
                  >
                    <Crown className="h-4 w-4" />
                    {t('premiumSubscribe')}
                  </button>
                )}
              </div>
            </div>
          </section>
        </main>

        <nav aria-label="Main navigation" className="absolute inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-amber-700/15 bg-[#fbf5e6]/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:border-amber-200/15 dark:bg-[#17150f]/95">
          <button
            type="button"
            aria-label={t('searchSpotOffers')}
            onClick={() => router.push(ROUTES.RENT)}
            className="flex min-w-16 cursor-pointer flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-amber-800 transition hover:bg-amber-500/10 dark:text-amber-200"
          >
            <Key className="h-5 w-5 -rotate-45" strokeWidth={2.2} />
            <span className="text-[10px] font-semibold">{t('searchSpotOffers')}</span>
          </button>
          <button
            type="button"
            aria-label={t('parkShare')}
            onClick={() => router.push(ROUTES.HOME)}
            className="flex min-w-16 cursor-pointer flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-amber-800 transition hover:bg-amber-500/10 dark:text-amber-200"
          >
            <Home className="h-5 w-5" strokeWidth={2.2} />
            <span className="text-[10px] font-semibold">{t('parkShare')}</span>
          </button>
          <button
            type="button"
            aria-label={t('manageYourCars')}
            onClick={() => router.push(ROUTES.MANAGE_CAR)}
            className="flex min-w-16 cursor-pointer flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-amber-800 transition hover:bg-amber-500/10 dark:text-amber-200"
          >
            <Car className="h-5 w-5" strokeWidth={2.2} />
            <span className="text-[10px] font-semibold">{t('manageYourCars')}</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
