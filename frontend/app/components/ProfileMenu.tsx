'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfileMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewProfile = () => {
    setIsOpen(false);
    router.push('/ProfilePage');
  };

  const handleSignOutClick = () => {
    setIsOpen(false);
    setShowSignOutModal(true);
  };

  const handleConfirmSignOut = () => {
    setShowSignOutModal(false);
    router.push('/LoginPage');
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="Open profile menu"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#121212] transition hover:scale-[1.02] hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
      >
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/10">
          <User className="h-5 w-5 text-[#42565d] dark:text-[#9db0b6]" strokeWidth={2} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-black">
          <button
            type="button"
            onClick={handleViewProfile}
            className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-[15px] font-semibold text-[#121212] transition hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          >
            <span>View Profile</span>
            <ChevronRight className="h-4 w-4 text-[#42565d] dark:text-[#9db0b6]" strokeWidth={2.5} />
          </button>

          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-[15px] font-semibold text-[#121212] transition hover:bg-black/5 dark:text-white dark:hover:bg-white/5"
          >
            <span>Switch Account</span>
            <ChevronRight className="h-4 w-4 text-[#42565d] dark:text-[#9db0b6]" strokeWidth={2.5} />
          </button>

          <div className="border-t border-black/10 dark:border-white/10">
            <button
              type="button"
              onClick={handleSignOutClick}
              className="flex w-full cursor-pointer items-center justify-start px-4 py-3 text-left text-[15px] font-semibold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs">
          <div className="w-full max-w-[320px] rounded-3xl bg-white p-5 text-center shadow-[0_18px_40px_rgba(15,23,42,0.18)] dark:bg-[#111111] dark:text-white">
            <h3 className="text-[18px] font-bold tracking-tight text-[#121212] dark:text-white">
              Are you sure?
            </h3>
            <p className="mt-2 text-sm text-[#42565d] dark:text-[#9db0b6]">
              You will be signed out of your account.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowSignOutModal(false)}
                className="flex-1 cursor-pointer rounded-xl bg-[#121212] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a] dark:bg-white dark:text-[#121212] dark:hover:bg-[#eaeaea]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOut}
                className="flex-1 cursor-pointer rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 dark:border-red-900 dark:bg-black dark:text-red-400 dark:hover:bg-red-950/30"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
