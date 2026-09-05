"use client";

import React from "react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ROUTES } from '../../constants/routes';
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!canLogIn || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to log in.');
      }

      router.push(ROUTES.HOME);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to connect to the backend.');
    } finally {
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

          <form className="mt-6 w-full space-y-3" onSubmit={handleSubmit}>
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
              disabled={!canLogIn || isSubmitting}
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
