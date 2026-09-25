"use client";

import React from "react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ROUTES } from '../../constants/routes';
import { getApiBaseUrl } from '../../constants/api';
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canLogIn = email.trim() !== "" && password.trim() !== "";

  const handleGoogleContinue = () => {
    const API = getApiBaseUrl();
    const redirectTo = `${window.location.origin}${ROUTES.HOME}`;
    window.location.href = `${API}/api/auth/google/login?redirect_to=${encodeURIComponent(redirectTo)}`;
  };

  const handleGoogleLogin = () => {
    const API = getApiBaseUrl();
    const redirectTo = `${window.location.origin}${ROUTES.HOME}`;
    window.location.href = `${API}/api/auth/google/login?redirect_to=${encodeURIComponent(redirectTo)}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!canLogIn || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const API = getApiBaseUrl();
      const response = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, remember }),
      });
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : null;

      if (!response.ok) {
        throw new Error(data?.error || 'The backend is unavailable. Please make sure it is running and try again.');
      }

      window.location.href = ROUTES.HOME;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to connect to the backend.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-white dark:bg-[#0B1C2C]">
      <div className="flex w-full max-w-sm flex-1 flex-col">
        {/* Logo + wordmark */}
        <div className="flex flex-col items-center pb-6 pt-12">
          <Image src="/Icon.svg" alt="Park | Share logo" width={120} height={100} className="h-28 w-auto" priority />
          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            <span className="text-[#0F4C81] dark:text-white">Park</span>
            <span className="mx-2 text-[#0F4C81]/60 dark:text-white/60">|</span>
            <span className="text-[#04B697]">Share</span>
          </h1>
        </div>

        {/* Bottom sheet */}
        <div
          className="flex flex-1 flex-col items-center rounded-t-4xl px-6 pb-10 pt-6 bg-linear-to-b from-[#B3E3DE] to-[#B6CDDA] dark:from-[#1A2B3A] dark:to-[#0F1C2D]"
        >
          <h2 className="text-lg font-bold text-[#0B1C2C] dark:text-white">Welcome back!</h2>
          <p className="mt-1 text-center text-sm text-[#33475A] dark:text-white/80">Please enter your details</p>

          <form className="mt-6 w-full space-y-3" onSubmit={handleSubmit} aria-label="Login form">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="h-12 w-full rounded-xl border border-white/40 bg-white px-4 text-sm text-[#0B1C2C] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40 dark:bg-[#1A2B3A] dark:text-white dark:border-white/20"
                required
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="h-12 w-full rounded-xl border border-white/40 bg-white px-4 text-sm text-[#0B1C2C] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/40 dark:bg-[#1A2B3A] dark:text-white dark:border-white/20"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0B1C2C]/60 dark:text-white/60 cursor-pointer"
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex w-full items-center justify-between text-sm">
              <label className="flex items-center text-[#33475A] dark:text-white/80">
                <input
                    name="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 mr-2 rounded border-white/40 cursor-pointer"
                  />
                  Remember me for 30 days
                </label>
              <Link href={ROUTES.FORGOT_PASSWORD} className="text-[#0F4C81] underline dark:text-white">
                Forgot password?
              </Link>
            </div>

            {error && (
              <p role="alert" className="text-center text-sm text-red-600 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={typeof window !== 'undefined' ? (!canLogIn || isSubmitting) : false}
              className="h-12 w-full rounded-xl bg-[#0F4C81] text-sm font-semibold text-white transition hover:bg-[#0D3E68] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#0F4C81]/45 disabled:hover:bg-[#0F4C81]/45"
            >
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="my-5 flex w-full items-center gap-3">
            <span className="h-px flex-1 bg-[#5B6B6E]/50 dark:bg-white/30" />
            <span className="text-xs text-[#5B6B6E] dark:text-white/60">or</span>
            <span className="h-px flex-1 bg-[#5B6B6E]/50 dark:bg-white/30" />
          </div>

          <div className="w-full space-y-3">
            <SocialButton
                label="Continue with Google"
                icon={<GoogleIcon/>}
                onClick={`/api/auth/google/login?redirect_to=${encodeURIComponent(ROUTES.HOME)}`}
            />
            <SocialButton
                label="Continue with Apple"
                icon={<AppleIcon/>}
                onClick="/api/auth/apple/login"
            />
            <SocialButton
                label="Continue with Facebook"
                icon={<FacebookIcon/>}
                onClick="/api/auth/facebook/login"
            />
          </div>

          <p className="mt-3 text-center text-sm text-[#4A5A63] dark:text-white/80">
            Don't have an account?{' '}
            <Link href={ROUTES.SIGN_UP} className="font-medium text-[#0F4C81] underline dark:text-white">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function SocialButton({
                        label,
                        icon,
                        onClick,
                      }: {
  label: string
  icon: React.ReactNode
  onClick?: (() => void) | string
}) {
  if (typeof onClick === 'string') {
    // If onClick is used as href string, render as progressive anchor
    return (
      <a
        href={onClick}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-[#EEEEEE] text-sm font-medium text-[#0B1C2C] transition hover:bg-[#E4E4E4] active:scale-[0.99] dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
      >
        {icon}
        <span>{label}</span>
      </a>
    );
  }

  return (
      <button
          type="button"
          onClick={onClick}
          className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl bg-[#EEEEEE] text-sm font-medium text-[#0B1C2C] transition hover:bg-[#E4E4E4] active:scale-[0.99] dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
      >
        {icon}
        <span>{label}</span>
      </button>
  )
}

function GoogleIcon() {
  return (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"
        />
        <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"
        />
        <path
            fill="#FBBC05"
            d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"
        />
        <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"
        />
      </svg>
  )
}

function AppleIcon() {
  return (
      <svg width="16" height="18" viewBox="0 0 16 18" className="fill-black dark:fill-white">
        <path
            d="M13.1 9.6c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.8-2.7-.8-1.4 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2.3-.9-2.3-3.8zM10.9 3.4c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z"/>
      </svg>
  )
}

function FacebookIcon() {
  return (
      <svg width="18" height="18" viewBox="0 0 18 18">
        <circle cx="9" cy="9" r="9" fill="#1877F2"/>
        <path
            fill="#fff"
            d="M11.5 9.3h-1.6v5.4H7.8V9.3H6.6V7.4h1.2V6.1c0-1.5.7-2.4 2.4-2.4h1.5v1.9h-.9c-.7 0-.7.3-.7.7v1h1.7l-.3 1.9z"
        />
      </svg>
  )
}