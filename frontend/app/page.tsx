'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../constants/routes';

export default function StartPage() {
  const router = useRouter();
  const [isMorphing, setIsMorphing] = useState(false);
  const [isVideoHidden, setIsVideoHidden] = useState(false);

  const startMorphTransition = () => {
    if (isMorphing) return;
    console.debug('[StartPage] startMorphTransition');
    setIsMorphing(true);

    // Hide video layer after fade out completes
    setTimeout(() => {
      setIsVideoHidden(true);
    }, 700);
  };

  useEffect(() => {
    // Automatically trigger morph transition after ~3 seconds of video
    const timer = setTimeout(() => {
      startMorphTransition();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Failsafe: if morph transition didn't run (e.g. video blocked or minor client issues),
  // force showing the UI after a longer timeout so the page is never stuck on loading.
  useEffect(() => {
    const fallback = setTimeout(() => {
      if (!isMorphing) {
        console.warn('[StartPage] Failsafe: forcing morph transition after timeout');
        setIsVideoHidden(true);
        setIsMorphing(true);
      }
    }, 8000);
    return () => clearTimeout(fallback);
  }, [isMorphing]);

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-white dark:bg-[#0B1C2C] overflow-hidden">
      <noscript>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#011b1b] text-white">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-bold">JavaScript is required</h2>
            <p className="mt-2">Please enable JavaScript to use ParkShare, or use the links below</p>
            <div className="mt-6 space-y-3">
              <a href="/LoginPage" className="block rounded-xl bg-[#0F4C81] px-4 py-3 text-white">Log in</a>
              <a href="/SignUpPage" className="block rounded-xl bg-gray-200 px-4 py-3 text-[#0B1C2C]">Sign up</a>
            </div>
          </div>
        </div>
      </noscript>

      {/* Video Overlay Layer */}
      {!isVideoHidden && (
        <div
          id="parkshare-loading-overlay"
          className={`fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-[#011b1b] transition-opacity duration-700 ease-in-out ${
            isMorphing ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <video
            id="parkshare-loading-video"
            src="/Animation/Loading.mp4"
            autoPlay
            muted
            playsInline
            onEnded={startMorphTransition}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* StartPage Interface with PowerPoint-style Morph Transition */}
      <div className="flex w-full max-w-sm flex-1 flex-col items-center justify-center p-6 z-10">
        {/* Morphing Logo & Wordmark */}
        <div
          id="parkshare-morph-container"
          className={`flex flex-col items-center transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isMorphing
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-150 opacity-0 -translate-y-8'
          }`}
        >
          <Image
            src="/Icon.svg"
            alt="Park | Share logo"
            width={160}
            height={140}
            className="h-40 w-auto"
            priority
          />
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-center">
            <span className="text-[#0F4C81] dark:text-white">Park</span>
            <span className="mx-2 text-[#0F4C81]/60 dark:text-white/60">|</span>
            <span className="text-[#04B697]">Share</span>
          </h1>
        </div>

        {/* Morphing Tagline & Action Buttons */}
        <div
          id="parkshare-tagline-container"
          className={`mt-4 w-full flex flex-col items-center transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isMorphing
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-16'
          }`}
        >
          <p className="text-lg text-center text-[#33475A] dark:text-white/80">
            The best way to find and share parking spots.
          </p>

          <div className="mt-12 w-full space-y-4">
            <a
              href={ROUTES.LOGIN}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-[#0F4C81] text-sm font-semibold text-white transition hover:bg-[#0D3E68] active:scale-[0.99] cursor-pointer"
            >
              Log in
            </a>
            <a
              href={ROUTES.SIGN_UP}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-gray-200 text-sm font-semibold text-[#0B1C2C] transition hover:bg-gray-300 active:scale-[0.99] dark:bg-white/10 dark:text-white dark:hover:bg-white/20 cursor-pointer"
            >
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
