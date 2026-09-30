'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV === 'development') {
      Promise.all([
        navigator.serviceWorker.getRegistrations().then((registrations) =>
          Promise.all(
            registrations
              .filter((registration) => registration.scope === new URL('/', window.location.origin).href)
              .map((registration) => registration.unregister()),
          ),
        ),
        caches.keys().then((cacheNames) =>
          Promise.all(
            cacheNames
              .filter((cacheName) => cacheName.startsWith('parkshare-shell-'))
              .map((cacheName) => caches.delete(cacheName)),
          ),
        ),
      ]).catch((error: unknown) => {
        console.error('ParkShare development service worker cleanup failed:', error);
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
