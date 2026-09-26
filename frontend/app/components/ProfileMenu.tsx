'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { getApiBaseUrl } from '../../constants/api';
import { useLanguage } from './LanguageProvider';

export default function ProfileMenu() {
  const router = useRouter();
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userInfo, setUserInfo] = useState<{ firstName: string; lastName: string; email: string; role: string }>({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
  });

  useEffect(() => {
    let isCancelled = false;

    const fetchUserData = async () => {
      try {
        const API = getApiBaseUrl();
        const meRes = await fetch(`${API}/api/auth/me`, { credentials: 'include' });
        if (meRes.ok) {
          const data = await meRes.json();
          if (!isCancelled && data.user) {
            setUserInfo({
              firstName: data.user.first_name || '',
              lastName: data.user.last_name || '',
              email: data.user.email || '',
              role: data.user.role || '',
            });
          }
        }
      } catch (err) {
        console.warn('Backend unavailable for user data in ProfileMenu');
      }

      try {
        const API = getApiBaseUrl();
        const picRes = await fetch(`${API}/api/user/profile-picture/download`, { credentials: 'include' });
        if (picRes.ok) {
          const blob = await picRes.blob();
          if (!isCancelled) {
            setAvatarUrl(URL.createObjectURL(blob));
          }
        }
      } catch (err) {
        console.warn('Backend unavailable for profile picture in ProfileMenu');
      }
    };

    fetchUserData();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      isCancelled = true;
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const avatarGradient = useMemo(() => {
    const source = `${userInfo.firstName}${userInfo.lastName}`.toLowerCase() || userInfo.email || 'user';
    let hash = 0;
    for (let i = 0; i < source.length; i += 1) hash = source.charCodeAt(i) + ((hash << 5) - hash);
    return ['from-[#0f4c81] via-[#3d7cb3] to-[#9ad7db]', 'from-[#0f7c67] via-[#2fb38d] to-[#b9eedb]'][Math.abs(hash) % 2];
  }, [userInfo.firstName, userInfo.lastName, userInfo.email]);

  const initials = useMemo(() => {
    const fn = userInfo.firstName?.[0] ?? '';
    const ln = userInfo.lastName?.[0] ?? '';
    const combined = `${fn}${ln}`.toUpperCase();
    if (combined) return combined;
    if (userInfo.email) return userInfo.email[0].toUpperCase();
    return '';
  }, [userInfo.firstName, userInfo.lastName, userInfo.email]);

  const handleViewProfile = () => {
    setIsOpen(false);
    router.push(ROUTES.PROFILE);
  };

  const handleSignOutClick = () => {
    setIsOpen(false);
    setShowSignOutModal(true);
  };

  const handleConfirmSignOut = async () => {
    try {
      const API = getApiBaseUrl();
      await fetch(`${API}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('Backend logout failed or backend unreachable');
    }

    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Frontend session clear failed');
    }

    setShowSignOutModal(false);
    router.push(ROUTES.START);
    router.refresh();
  };

  return (
    <div ref={menuRef} className="relative z-50">
      <button
        type="button"
        aria-label="Open profile menu"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
      >
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/10">
          {avatarUrl ? (
            <img src={avatarUrl} alt="User profile" className="h-full w-full object-cover" />
          ) : initials ? (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${avatarGradient} text-white font-bold text-[11px] tracking-wider select-none`}>
              {initials}
            </div>
          ) : (
            <User className="h-5 w-5 text-[#42565d] dark:text-[#9db0b6]" strokeWidth={2} />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-black z-50">
          <button
            type="button"
            onClick={handleViewProfile}
            className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-[15px] font-semibold text-[#121212] transition hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          >
            <span>{t('viewProfile')}</span>
            <ChevronRight className="h-4 w-4 text-[#42565d] dark:text-[#9db0b6]" strokeWidth={2.5} />
          </button>

          {userInfo.role === 'admin' && (
            <button
              type="button"
              onClick={() => { setIsOpen(false); router.push(ROUTES.ADMIN_REPORTS); }}
              className="flex w-full cursor-pointer items-center justify-between border-t border-black/10 px-4 py-3 text-left text-[15px] font-semibold text-[#121212] transition hover:bg-black/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
            >
              <span>{t('reviewReports')}</span>
              <ChevronRight className="h-4 w-4 text-[#42565d] dark:text-[#9db0b6]" strokeWidth={2.5} />
            </button>
          )}

          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-[15px] font-semibold text-[#121212] transition hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          >
            <span>{t('switchAccount')}</span>
            <ChevronRight className="h-4 w-4 text-[#42565d] dark:text-[#9db0b6]" strokeWidth={2.5} />
          </button>

          <div className="border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={handleSignOutClick}
              className="flex w-full cursor-pointer items-center justify-start px-4 py-3 text-left text-[15px] font-semibold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              {t('signOut')}
            </button>
          </div>
        </div>
      )}

      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs">
          <div className="w-full max-w-[320px] rounded-3xl bg-white p-5 text-center shadow-[0_18px_40px_rgba(15,23,42,0.18)] dark:bg-[#111111] dark:text-white">
            <h3 className="text-[18px] font-bold tracking-tight text-[#121212] dark:text-white">
              {t('areYouSure')}
            </h3>
            <p className="mt-2 text-sm text-[#42565d] dark:text-[#9db0b6]">
              {t('signedOutMessage')}
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowSignOutModal(false)}
                className="flex-1 cursor-pointer rounded-xl bg-[#121212] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a] dark:bg-white dark:text-[#121212] dark:hover:bg-[#eaeaea]"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOut}
                className="flex-1 cursor-pointer rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 dark:border-red-900 dark:bg-black dark:text-red-400 dark:hover:bg-red-950/30"
              >
                {t('signOut')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
