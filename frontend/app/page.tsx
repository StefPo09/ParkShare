'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '../constants/routes';

export default function StartPage() {
  const router = useRouter();

  useEffect(() => {
    // Show splash animation for 3.5 seconds, then navigate to LoginPage
    const timer = setTimeout(() => {
      router.push(ROUTES.LOGIN);
    }, 3500);

    return () => clearTimeout(timer);
  }, [router]);

  const handleVideoEnded = () => {
    router.push(ROUTES.LOGIN);
  };

  return (
    <div className="fixed inset-0 z-50 h-screen w-screen overflow-hidden bg-[#011b1b] dark:bg-[#0B1C2C]">
      <video
        src="/Animation/Loading.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnded}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
