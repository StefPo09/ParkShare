'use client'

import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function StartPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-white dark:bg-[#0B1C2C]">
      <div className="flex w-full max-w-sm flex-1 flex-col items-center justify-center p-6">
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
        <p className="mt-4 text-lg text-center text-[#33475A] dark:text-white/80">
          The best way to find and share parking spots.
        </p>

        <div className="mt-12 w-full space-y-4">
          <button
            onClick={() => router.push('/LoginPage')}
            className="h-12 w-full rounded-xl bg-[#0F4C81] text-sm font-semibold text-white transition hover:bg-[#0D3E68] active:scale-[0.99]"
          >
            Log in
          </button>
          <button
            onClick={() => router.push('/SignUpPage')}
            className="h-12 w-full rounded-xl bg-gray-200 text-sm font-semibold text-[#0B1C2C] transition hover:bg-gray-300 active:scale-[0.99] dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
