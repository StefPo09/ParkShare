'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getApiBaseUrl } from '../../constants/api';
import { ROUTES } from '../../constants/routes';
import { useLanguage } from './LanguageProvider';

type CompletionStep = 'profile' | 'account';
type ApiUser = {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  phone_country_code?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  name?: string | null;
};

const EXEMPT_PATHS = new Set<string>([
  ROUTES.HOME,
  ROUTES.PROFILE,
  ROUTES.ACCOUNT_SETTINGS,
  ROUTES.ABOUT_US,
  ROUTES.HELP,
  ROUTES.START,
  ROUTES.LOGIN,
  ROUTES.SIGN_UP,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.PASSWORD_RESET,
]);

function isEligibleForGuard(pathname: string) {
  return !EXEMPT_PATHS.has(pathname) &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_next/') &&
    !pathname.includes('.');
}

function getNames(user: ApiUser) {
  const nameParts = user.name?.trim().split(/\s+/) ?? [];
  return {
    firstName: user.first_name?.trim() || nameParts[0] || '',
    lastName: user.last_name?.trim() || nameParts.slice(1).join(' '),
  };
}

function hasValidAdultBirthDate(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const birthDate = new Date(`${value}T00:00:00`);
  const [year, month, day] = value.split('-').map(Number);
  if (
    Number.isNaN(birthDate.getTime()) ||
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() + 1 !== month ||
    birthDate.getDate() !== day
  ) return false;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age >= 18;
}

export default function ProfileCompletionGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [checkedPath, setCheckedPath] = useState<string | null>(null);
  const [blockedPath, setBlockedPath] = useState<string | null>(null);
  const [notice, setNotice] = useState<CompletionStep | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const needsCheck = isEligibleForGuard(pathname);

  useEffect(() => {
    const url = new URL(window.location.href);
    const noticeStep = url.searchParams.get('profileRequired');
    if ((noticeStep === 'profile' || noticeStep === 'account') &&
        (pathname === ROUTES.PROFILE || pathname === ROUTES.ACCOUNT_SETTINGS)) {
      setNotice(noticeStep);
      url.searchParams.delete('profileRequired');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }

    if (!needsCheck) {
      setCheckedPath(pathname);
      setBlockedPath(null);
      setLoadError(false);
      return;
    }

    const controller = new AbortController();
    setLoadError(false);
    setBlockedPath(null);
    setCheckedPath(null);

    const checkCompletion = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
          credentials: 'include',
          signal: controller.signal,
        });

        if (response.status === 401) {
          throw new Error('Your session is no longer valid.');
        }
        if (!response.ok) throw new Error(`Unable to check profile completion (${response.status})`);

        const data: { user?: ApiUser } = await response.json();
        if (!data.user) throw new Error('Profile completion response did not include a user.');

        const user = data.user;
        const names = getNames(user);
        const profileComplete =
          Boolean(names.firstName) &&
          Boolean(names.lastName) &&
          hasValidAdultBirthDate(user.date_of_birth);

        let requiredStep: CompletionStep | null = null;
        let destination: string | null = null;
        if (!profileComplete) {
          requiredStep = 'profile';
          destination = ROUTES.PROFILE;
        } else {
          const accountComplete =
            Boolean(user.email?.trim()) &&
            Boolean(user.phone_country_code?.trim()) &&
            Boolean(user.phone?.replace(/\D/g, '')) &&
            Boolean(user.country?.trim()) &&
            Boolean(user.city?.trim()) &&
            Boolean(names.firstName) &&
            Boolean(names.lastName);

          if (!accountComplete) {
            requiredStep = 'account';
            destination = ROUTES.ACCOUNT_SETTINGS;
          }
        }

        if (controller.signal.aborted) return;
        if (requiredStep && destination) {
          setBlockedPath(pathname);
          setNotice(requiredStep);
          router.replace(`${destination}?profileRequired=${requiredStep}`);
        } else {
          setCheckedPath(pathname);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Profile completion check failed:', error);
        setLoadError(true);
        setCheckedPath(pathname);
      }
    };

    void checkCompletion();
    return () => controller.abort();
  }, [pathname, needsCheck, retry, router]);

  const closeNotice = () => {
    setNotice(null);
    if (window.location.search.includes('profileRequired=')) {
      window.history.replaceState(window.history.state, '', pathname);
    }
  };

  return (
    <>
      {(!needsCheck || (checkedPath === pathname && blockedPath !== pathname && !loadError)) && children}

      {needsCheck && (checkedPath !== pathname || blockedPath === pathname) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#011b1b] px-4">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/30 border-t-white" aria-label={t('profileGuardChecking')} />
        </div>
      )}

      {loadError && needsCheck && checkedPath === pathname && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-2xl border border-red-300 bg-white p-5 text-center shadow-2xl dark:border-red-800 dark:bg-[#102b28]">
            <h2 className="text-lg font-bold text-red-700 dark:text-red-300">{t('profileGuardErrorTitle')}</h2>
            <p className="mt-2 text-sm text-[#42565d] dark:text-[#dfeef0]">{t('profileGuardErrorMessage')}</p>
            <button
              type="button"
              onClick={() => setRetry((count) => count + 1)}
              className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              {t('profileGuardRetry')}
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
          <div role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-2xl border border-red-300 bg-red-50 p-5 text-center shadow-2xl dark:border-red-800 dark:bg-[#321919]">
            <h2 className="text-lg font-bold text-red-800 dark:text-red-200">{t('profileGuardTitle')}</h2>
            <p className="mt-2 text-sm leading-6 text-red-800 dark:text-red-100">
              {notice === 'profile' ? t('profileGuardProfileMessage') : t('profileGuardAccountMessage')}
            </p>
            <button
              type="button"
              onClick={closeNotice}
              className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              {t('ok')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
