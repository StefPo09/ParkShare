'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck, Check, Crown, Percent, Sparkles } from 'lucide-react';
import { getApiBaseUrl } from '../../constants/api';
import { useLanguage } from '../components/LanguageProvider';

type PremiumStatus = {
  is_premium: boolean;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export default function PremiumPage() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadStatus = async () => {
      const checkout = new URLSearchParams(window.location.search).get('checkout');
      const attempts = checkout === 'success' ? 8 : 1;
      let premiumConfirmed = false;

      for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
          const response = await fetch(`${getApiBaseUrl()}/api/premium/status`, {
            credentials: 'include',
            cache: 'no-store',
          });
          const data = response.ok ? await response.json() as PremiumStatus : null;
          if (cancelled) return;
          if (!data) {
            setError(t('premiumErrorGeneric'));
            break;
          }
          setStatus(data);
          premiumConfirmed = data.is_premium;
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
    <main className="min-h-screen bg-[#f8f3e4] px-5 py-10 text-[#302817] dark:bg-[#17150f] dark:text-[#fff9e9]">
      <section className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-[32px] border border-amber-400/40 bg-gradient-to-br from-[#fff9e8] via-[#fbf3dd] to-[#f2dfae] p-7 shadow-[0_24px_70px_rgba(120,82,12,0.16)] dark:from-[#282316] dark:via-[#211d13] dark:to-[#342a16] sm:p-10">
          <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20">
              <Crown className="h-7 w-7" />
            </span>
            <span className="text-xs font-black uppercase tracking-[0.22em]">ParkShare</span>
          </div>

          <h1 className="mt-7 text-4xl font-black tracking-tight sm:text-5xl">{t('premiumPageTitle')}</h1>
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
  );
}
