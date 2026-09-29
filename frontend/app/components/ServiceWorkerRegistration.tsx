'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const isLocalDevelopment =
      process.env.NODE_ENV === 'development' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1');

    if (isLocalDevelopment) {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) =>
          Promise.all(
            registrations
              .filter((registration) => registration.scope === new URL('/', window.location.origin).href)
              .map((registration) => registration.unregister()),
          ),
        )
        .catch((error: unknown) => {
          console.error('ParkShare service worker cleanup failed:', error);
        });
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .catch((error: unknown) => {
        console.error('ParkShare service worker registration failed:', error);
      });
  }, []);

  return null;
}
