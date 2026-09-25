'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, MapPinned, House } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const INVALID_DESTINATION_TEXTS = [
    'parking spot address',
    'parking spot',
    'address unavailable',
    'unknown address',
];

function sanitizeDestinationValue(value: string | null): string {
    if (!value) return '';

    const trimmed = value.trim();
    if (!trimmed) return '';

    const normalized = trimmed.toLowerCase();
    const isPlaceholder = INVALID_DESTINATION_TEXTS.some((placeholder) => normalized === placeholder || normalized.includes(placeholder));
    if (isPlaceholder) return '';

    return trimmed;
}

function SuccessPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showPrompt, setShowPrompt] = useState(true);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    const rawSpotTitle = sanitizeDestinationValue(searchParams.get('spotTitle'));
    const rawSpotAddress = sanitizeDestinationValue(searchParams.get('spotAddress'));
    const spotTitle = rawSpotTitle || rawSpotAddress || 'Parking spot';
    const duration = searchParams.get('duration') || '2 hours';
    const total = searchParams.get('total') || '25.00';
    const currency = searchParams.get('currency') || 'RON';
    const spotAddress = rawSpotAddress || rawSpotTitle || 'Address unavailable';
    const startHour = searchParams.get('startHour');
    const endHour = searchParams.get('endHour');
    const spotLat = Number(searchParams.get('spotLat') ?? '');
    const spotLng = Number(searchParams.get('spotLng') ?? '');
    const hasValidSpotCoords =
        Number.isFinite(spotLat) &&
        Number.isFinite(spotLng) &&
        Math.abs(spotLat) > 1e-6 &&
        Math.abs(spotLng) > 1e-6;

    useEffect(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            () => {
                setUserLocation(null);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
    }, []);

    const mapsDirectionsUrl = useMemo(() => {
        const originParam = userLocation ? `&origin=${encodeURIComponent(`${userLocation.lat},${userLocation.lng}`)}` : '';

        if (hasValidSpotCoords) {
            const destination = `${spotLat},${spotLng}`;
            return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
        }

        const destinationText = sanitizeDestinationValue(spotAddress);
        if (!destinationText) {
            return userLocation
                ? `https://www.google.com/maps/dir/?api=1${originParam}&travelmode=driving`
                : 'https://www.google.com/maps';
        }

        return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${encodeURIComponent(destinationText)}&travelmode=driving`;
    }, [hasValidSpotCoords, spotAddress, spotLat, spotLng, userLocation]);

    const handleGoHome = () => {
        router.push(ROUTES.HOME);
    };

    const handleOpenMaps = () => {
        if (!mapsDirectionsUrl) {
            window.open('https://www.google.com/maps', '_blank', 'noopener,noreferrer');
            return;
        }

        window.open(mapsDirectionsUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="min-h-screen bg-[#dfeef0] dark:bg-[#011b1b] px-5 py-10">
            <div className="mx-auto flex min-h-[80vh] max-w-[430px] items-center justify-center">
                <div className="w-full rounded-3xl bg-white/70 p-8 text-center shadow-xl backdrop-blur dark:bg-white/5">

                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                        <CheckCircle
                            className="h-12 w-12 text-green-500"
                            strokeWidth={2}
                        />
                    </div>

                    <h1 className="mt-6 text-3xl font-bold text-[#121212] dark:text-white">
                        Payment successful!
                    </h1>

                    <p className="mt-3 text-sm text-[#42565d] dark:text-[#d6e7ea]">
                        Your parking spot has been successfully reserved.
                    </p>

                    <div className="mt-8 space-y-3 rounded-2xl bg-black/5 p-4 text-left dark:bg-white/5">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                Parking spot
                            </span>

                            <span className="text-sm font-semibold dark:text-white text-right truncate max-w-[200px]">
                                {spotTitle}
                            </span>
                        </div>

                        {startHour && endHour && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    Time slot
                                </span>

                                <span className="text-sm font-semibold dark:text-white">
                                    {startHour} - {endHour}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                Duration
                            </span>

                            <span className="text-sm font-semibold dark:text-white">
                                {duration}
                            </span>
                        </div>

                        <div className="flex justify-between items-center border-t border-black/10 pt-3 dark:border-white/10">
                            <span className="font-semibold text-sm dark:text-white">
                                Total paid
                            </span>

                            <span className="font-bold text-[#0f4c81] dark:text-[#2dd4bf]">
                                {total} {currency}
                            </span>
                        </div>
                    </div>

                    {showPrompt && (
                        <div className="mt-8 rounded-2xl border border-black/10 bg-white/60 p-4 text-left shadow-sm dark:border-white/10 dark:bg-white/5">
                            <p className="text-sm font-semibold text-[#121212] dark:text-white">
                                Do you want to navigate to the parking spot?
                            </p>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={handleGoHome}
                                    className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-semibold text-[#121212] transition hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:text-white"
                                >
                                    <House className="h-4 w-4" />
                                    No
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPrompt(false);
                                        handleOpenMaps();
                                    }}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-[#0f4c81] px-3 py-3 text-sm font-semibold text-white transition hover:bg-[#0c3e67] dark:bg-[#155b8a]"
                                >
                                    <MapPinned className="h-4 w-4" />
                                    Yes
                                </button>
                            </div>
                        </div>
                    )}

                    {!showPrompt && (
                        <button
                            onClick={handleGoHome}
                            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f4c81] px-5 py-3.5 font-semibold text-white transition hover:bg-[#0c3e67] cursor-pointer active:scale-[0.99] dark:bg-[#155b8a]"
                        >
                            Done
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-[#dfeef0] dark:bg-[#011b1b]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0f4c81] border-t-transparent" />
            </div>
        }>
            <SuccessPaymentContent />
        </Suspense>
    );
}