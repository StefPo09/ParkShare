'use client'

import React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [hasEmailBlurred, setHasEmailBlurred] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showEmailWarning = hasEmailBlurred && email.trim() !== '' && !isEmailValid;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isEmailValid) {
      return;
    }

    setIsSubmitted(true);
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
          className="flex flex-1 flex-col items-center rounded-t-4xl px-6 pb-10 pt-7 bg-linear-to-b from-[#B3E3DE] to-[#B6CDDA] dark:from-[#1A2B3A] dark:to-[#0F1C2D]"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/75 text-[#0F4C81] shadow-sm dark:bg-white/10 dark:text-white">
            {isSubmitted ? <CheckCircle2 size={26} /> : <Mail size={26} />}
          </div>

          <h2 className="text-lg font-bold text-[#0B1C2C] dark:text-white">
            {isSubmitted ? 'Check your email' : 'Forgot password?'}
          </h2>
          <p className="mt-1 max-w-xs text-center text-sm leading-5 text-[#33475A] dark:text-white/80">
            {isSubmitted
              ? 'We sent password reset instructions to your email address.'
              : 'Enter your email and we will send you instructions to reset your password.'}
          </p>

          <form className="mt-6 w-full space-y-3" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsSubmitted(false);
                }}
                onBlur={() => setHasEmailBlurred(true)}
                placeholder="Enter your email"
                className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-[#0B1C2C] focus:outline-none focus:ring-2 transition dark:bg-[#1A2B3A] dark:text-white dark:border-white/20 ${
                  showEmailWarning
                    ? 'border-red-500 focus:ring-red-500/40'
                    : 'border-white/40 focus:ring-[#0F4C81]/40'
                }`}
              />
              {showEmailWarning && (
                <span className="mt-1 block text-xs font-medium text-red-600">
                  Please enter a valid email address.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!isEmailValid}
              className="h-12 w-full rounded-xl bg-[#0F4C81] text-sm font-semibold text-white transition hover:bg-[#0D3E68] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#0F4C81]/45 disabled:hover:bg-[#0F4C81]/45 cursor-pointer"
            >
              Send reset link
            </button>
          </form>

          <Link
            href={ROUTES.LOGIN}
            className="mt-5 flex items-center gap-2 text-sm font-medium text-[#0F4C81] underline dark:text-white"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
