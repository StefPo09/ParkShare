'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Car, Heart, Home, Key, MapPin, Menu, Trash2 } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { getApiBaseUrl } from '../../constants/api';
import { useLanguage } from '../components/LanguageProvider';
import NavMenu from '../components/NavMenu';
import ProfileMenu from '../components/ProfileMenu';

type FavoriteSpot = {
  id: number;
  title: string;
  address: string;
  description?: string;
  price_per_day: number;
  price_currency?: string;
  start_hour?: string;
  end_hour?: string;
  image_url?: string | null;
  is_on_sale?: boolean;
};

export default function FavoritesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const API = getApiBaseUrl();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [spots, setSpots] = React.useState<FavoriteSpot[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [removingSpotId, setRemovingSpotId] = React.useState<number | null>(null);

  const loadFavorites = React.useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/favorites`, { credentials: 'include' });
      if (response.status === 401 || response.redirected) {
        setError(t('loginRequired'));
        return;
      }
      if (!response.ok) throw new Error(`Status ${response.status}`);

      const data: { spots?: FavoriteSpot[] } = await response.json();
      setSpots(Array.isArray(data.spots) ? data.spots : []);
    } catch {
      setError(t('favoritesLoadError'));
    } finally {
      setIsLoading(false);
    }
  }, [API, t]);

  React.useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const removeFavorite = async (spotId: number) => {
    setRemovingSpotId(spotId);
    setError('');
    try {
      const response = await fetch(`${API}/api/favorites/${spotId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.status === 401 || response.redirected) {
        setError(t('loginRequired'));
        return;
      }
      if (!response.ok) throw new Error(`Status ${response.status}`);
      setSpots((current) => current.filter((spot) => spot.id !== spotId));
    } catch {
      setError(t('favoriteActionError'));
    } finally {
      setRemovingSpotId(null);
    }
  };

  const getImageUrl = (imageUrl?: string | null) => {
    if (!imageUrl) return null;
    return imageUrl.startsWith('http') ? imageUrl : `${API}${imageUrl}`;
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#dfeef0] text-[#121212] dark:bg-[#011b1b] dark:text-white">
      <div className="flex h-full w-full flex-col overflow-hidden">
        <header className="z-10 flex items-center justify-between px-5 pb-3 pt-5">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">{t('favoritesTitle')}</h1>
          <ProfileMenu />
        </header>

        <NavMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-3 sm:px-6">
          <div className="mx-auto w-full max-w-6xl">
            <p className="mb-5 text-sm text-[#42565d] dark:text-[#9db0b6]">{t('favoritesIntro')}</p>

            {isLoading && (
              <p role="status" className="py-12 text-center text-sm text-[#42565d] dark:text-[#9db0b6]">
                {t('favoritesLoading')}
              </p>
            )}

            {!isLoading && error && (
              <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-center">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <button
                  type="button"
                  onClick={() => void loadFavorites()}
                  className="mt-3 rounded-xl bg-[#0f4c81] px-4 py-2 text-sm font-semibold text-white dark:bg-[#2dd4bf] dark:text-[#011b1b]"
                >
                  {t('profileGuardRetry')}
                </button>
              </div>
            )}

            {!isLoading && !error && spots.length === 0 && (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-black/5 bg-white/40 px-6 text-center dark:border-white/10 dark:bg-white/5">
                <Heart className="h-10 w-10 text-rose-500" />
                <p className="mt-4 max-w-lg text-sm text-[#42565d] dark:text-[#9db0b6]">{t('favoritesEmpty')}</p>
                <button
                  type="button"
                  onClick={() => router.push(ROUTES.RENT)}
                  className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0f4c81] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d3e68] dark:bg-[#2dd4bf] dark:text-[#011b1b]"
                >
                  <MapPin className="h-4 w-4" />
                  {t('searchSpotOffers')}
                </button>
              </div>
            )}

            {!isLoading && !error && spots.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {spots.map((spot) => {
                  const imageUrl = getImageUrl(spot.image_url);
                  return (
                    <article
                      key={spot.id}
                      className="overflow-hidden rounded-3xl border border-black/5 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="relative h-44 bg-[#cde8e8] dark:bg-[#0c2e2b]">
                        {imageUrl ? (
                          <Image src={imageUrl} alt={spot.title} fill unoptimized className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <MapPin className="h-10 w-10 text-[#0f4c81]/50 dark:text-[#2dd4bf]/50" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => void removeFavorite(spot.id)}
                          disabled={removingSpotId !== null}
                          aria-label={t('removeFavorite')}
                          title={t('removeFavorite')}
                          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-md transition hover:scale-105 disabled:opacity-50 dark:bg-[#011b1b]/90 dark:text-rose-300"
                        >
                          {removingSpotId === spot.id ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                        {spot.is_on_sale === false && (
                          <span className="absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white">
                            {t('spotNotAvailable')}
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        <h2 className="truncate text-lg font-bold">{spot.title || spot.address}</h2>
                        <p className="mt-1 flex items-center gap-1 truncate text-sm text-[#42565d] dark:text-[#9db0b6]">
                          <MapPin className="h-4 w-4 shrink-0" />
                          {spot.address}
                        </p>
                        {spot.description && (
                          <p className="mt-2 line-clamp-2 text-sm text-[#42565d] dark:text-[#9db0b6]">
                            {spot.description}
                          </p>
                        )}
                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-lg font-bold text-[#0f4c81] dark:text-[#2dd4bf]">
                              {spot.price_per_day} {spot.price_currency || 'RON'}
                            </p>
                            <p className="text-xs text-[#6f797d] dark:text-[#9db0b6]">
                              {spot.start_hour || '14:00'} - {spot.end_hour || '18:00'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => router.push(`${ROUTES.RENT}?search=${encodeURIComponent(spot.address)}`)}
                            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0f4c81] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d3e68] dark:bg-[#2dd4bf] dark:text-[#011b1b]"
                          >
                            <ArrowRight className="h-4 w-4" />
                            {t('viewOnMap')}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex w-screen items-center justify-around border-t border-black/5 bg-[#dfeef0] pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#011b1b]">
        <a href={ROUTES.RENT} onClick={(event) => { event.preventDefault(); router.push(ROUTES.RENT); }} aria-label={t('searchSpotOffers')} className="rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400">
          <Key className="h-6 w-6 -rotate-45" strokeWidth={2} />
        </a>
        <a href={ROUTES.HOME} onClick={(event) => { event.preventDefault(); router.push(ROUTES.HOME); }} aria-label={t('parkShare')} className="rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400">
          <Home className="h-6 w-6" strokeWidth={2} />
        </a>
        <a href={ROUTES.MANAGE_CAR} onClick={(event) => { event.preventDefault(); router.push(ROUTES.MANAGE_CAR); }} aria-label={t('manageYourCars')} className="rounded-full p-1.5 text-slate-500 transition-all dark:text-slate-400">
          <Car className="h-6 w-6" strokeWidth={2} />
        </a>
      </nav>
    </div>
  );
}
