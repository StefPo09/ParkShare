'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

function SuccessPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const spotTitle = searchParams.get('spotTitle') || searchParams.get('spotAddress') || 'Parking spot';
    const duration = searchParams.get('duration') || '2 hours';
    const total = searchParams.get('total') || '25.00';
    const currency = searchParams.get('currency') || 'RON';
    const startHour = searchParams.get('startHour');
    const endHour = searchParams.get('endHour');

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

                    <button
                        onClick={() => router.push(ROUTES.HOME)}
                        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f4c81] px-5 py-3.5 font-semibold text-white transition hover:bg-[#0c3e67] cursor-pointer active:scale-[0.99] dark:bg-[#155b8a]"
                    >
                        Done
                        <ArrowRight className="h-4 w-4" />
                    </button>
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