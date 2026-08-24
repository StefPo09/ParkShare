'use client'

import React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../../constants/routes';
import { Check, Eye, EyeOff, LockKeyhole, X } from 'lucide-react';

export default function PasswordResetPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [verifyNewPassword, setVerifyNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showVerifyNewPassword, setShowVerifyNewPassword] = useState(false);

  const passwordRequirements = [
    {
      label: 'At least 8 characters',
      isMet: newPassword.length >= 8,
    },
    {
      label: 'One uppercase letter',
      isMet: /[A-Z]/.test(newPassword),
    },
    {
      label: 'One lowercase letter',
      isMet: /[a-z]/.test(newPassword),
    },
    {
      label: 'One symbol',
      isMet: /[^A-Za-z0-9]/.test(newPassword),
    },
    {
      label: 'One number',
      isMet: /\d/.test(newPassword),
    },
  ];

  const isPasswordValid = passwordRequirements.every((requirement) => requirement.isMet);
  const passwordsMatch = verifyNewPassword === '' || newPassword === verifyNewPassword;
  const canResetPassword =
    isPasswordValid &&
    verifyNewPassword.trim() !== '' &&
    newPassword === verifyNewPassword;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!canResetPassword) {
      return;
    }

    router.push(ROUTES.LOGIN);
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-white dark:bg-[#0B1C2C]">
      <div className="flex w-full max-w-sm flex-1 flex-col">
        {/* Logo + wordmark */}
        <div className="flex flex-col items-center pb-6 pt-12">
          <Image
            src="/Icon.svg"
            alt="Park | Share logo"
            width={120}
            height={100}
            className="h-28 w-auto"
            priority
          />
          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            <span className="text-[#0F4C81] dark:text-white">Park</span>
            <span className="mx-2 text-[#0F4C81]/60 dark:text-white/60">|</span>
            <span className="text-[#04B697]">Share</span>
          </h1>
        </div>

        {/* Bottom sheet */}
        <div
          className="flex flex-1 flex-col items-center rounded-t-4xl px-6 pb-10 pt-7 bg-gradient-to-b from-[#B3E3DE] to-[#B6CDDA] dark:from-[#1A2B3A] dark:to-[#0F1C2D]"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/75 text-[#0F4C81] shadow-sm dark:bg-white/10 dark:text-white">
            <LockKeyhole size={26} />
          </div>

          <h2 className="text-lg font-bold text-[#0B1C2C] dark:text-white">Reset password</h2>
          <p className="mt-1 max-w-xs text-center text-sm leading-5 text-[#33475A] dark:text-white/80">
            Choose a new password that keeps your account protected.
          </p>

          <form className="mt-6 w-full space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col w-full gap-1">
              <label className="font-medium text-sm text-[#0B1C2C] dark:text-white">New Password</label>
              <div className="relative flex items-center w-full">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="h-12 w-full rounded-xl border border-white/40 bg-white pl-4 pr-12 text-sm text-[#0B1C2C] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40 dark:bg-[#1A2B3A] dark:text-white dark:border-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 text-[#0F4C81] hover:text-[#0B1C2C] transition cursor-pointer dark:text-white/80 dark:hover:text-white"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="mt-2 rounded-xl border border-white/50 bg-white/70 p-3 shadow-sm backdrop-blur-sm dark:bg-white/10 dark:border-white/20">
                <p className="mb-2 text-xs font-semibold text-[#0B1C2C] dark:text-white">
                  Password must include
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {passwordRequirements.map((requirement) => (
                    <div
                      key={requirement.label}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        requirement.isMet
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                          : 'bg-red-50 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full ${
                          requirement.isMet
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                        }`}
                      >
                        {requirement.isMet ? <Check size={14} /> : <X size={14} />}
                      </span>
                      {requirement.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col w-full gap-1">
              <label className="font-medium text-sm text-[#0B1C2C] dark:text-white">Verify New Password</label>
              <div className="relative flex items-center w-full">
                <input
                  type={showVerifyNewPassword ? 'text' : 'password'}
                  required
                  value={verifyNewPassword}
                  onChange={(e) => setVerifyNewPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className={`h-12 w-full rounded-xl border bg-white pl-4 pr-12 text-sm text-[#0B1C2C] focus:outline-none focus:ring-2 transition dark:bg-[#1A2B3A] dark:text-white dark:border-white/20 ${
                    !passwordsMatch
                      ? 'border-red-500 focus:ring-red-500/40'
                      : 'border-white/40 focus:ring-[#0F4C81]/40'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowVerifyNewPassword(!showVerifyNewPassword)}
                  aria-label={showVerifyNewPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 text-[#0F4C81] hover:text-[#0B1C2C] transition cursor-pointer dark:text-white/80 dark:hover:text-white"
                >
                  {showVerifyNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {!passwordsMatch && (
                <span className="text-xs text-red-600 font-medium mt-0.5 dark:text-red-400">
                  Passwords do not match!
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!canResetPassword}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#0F4C81] text-sm font-semibold text-white transition hover:bg-[#0D3E68] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#0F4C81]/45 disabled:hover:bg-[#0F4C81]/45 cursor-pointer"
            >
              Reset password
            </button>
          </form>

          <Link
            href={ROUTES.LOGIN}
            className="mt-5 text-sm font-medium text-[#0F4C81] underline dark:text-white"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
